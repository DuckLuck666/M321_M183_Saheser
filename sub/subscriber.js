const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';

const RABBITMQ_URL = `amqp://${rabbitmqHost}:${rabbitmqPort}`;
const QUEUE_NAME = 'log_queue_Saheser';
const EXCHANGE_NAME = 'log_exchange_Saheser';
const LOG_DIR = path.join(__dirname, 'logs');

// Log-Verzeichnis anlegen, falls nicht vorhanden
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

const appendLogToFile = (logMessage) => {
  const date = dayjs().format('YYYY-MM-DD');
  const logFilePath = path.join(LOG_DIR, `log_${date}.txt`);

  const logEntry = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} - ${logMessage}\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Fehler beim Schreiben der Log-Datei:', err);
    } else {
      console.log(`✅ Log gespeichert: ${logEntry.trim()}`);
    }
  });
};

// Verbindung mit verbesserter Retry-Logik aufbauen
async function connectToRabbitMQ(retries = 5, delay = 5000) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });
    await channel.assertQueue(QUEUE_NAME, { durable: false });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '');

    console.log(`🚀 Wartet auf Nachrichten in Queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const logMessage = msg.content.toString();
        console.log(`📩 Nachricht: ${logMessage}`);
        appendLogToFile(logMessage);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(`❌ Fehler bei Verbindung zu RabbitMQ: ${error.message}`);
    if (retries > 0) {
      console.log(`🔁 Neuer Versuch... (${6 - retries}/${5}) in ${delay}ms`);
      setTimeout(() => connectToRabbitMQ(retries - 1, delay * 2), delay);
    } else {
      console.error('❌ Maximaler Verbindungsversuch erreicht. Verbindung fehlgeschlagen.');
      process.exit(1);
    }
  }
}

// Starte Subscriber (kein Express-Server notwendig, falls nur Subscriber)
connectToRabbitMQ();
