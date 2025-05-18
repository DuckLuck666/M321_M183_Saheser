const amqp = require('amqplib');

const EXCHANGE_NAME = 'log_exchange_Saheser';
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';
const RABBITMQ_URL = `amqp://${rabbitmqHost}:${rabbitmqPort}`;

async function publishLogEvent(eventType, mountainData) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Exchange deklarieren (Fanout = Broadcast an alle Queues)
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });

    const logEvent = {
      eventType,
      name: mountainData.name,
      elevation: mountainData.elevation,
      hasMountainRailway: mountainData.hasmountainrailway,
      timestamp: new Date().toISOString(),
    };

    // **Nachricht an Exchange senden (keine direkte Queue!)**
    channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(logEvent)));
    console.log(` [x] Sent ${eventType} event`, logEvent);

    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (error) {
    console.error('RabbitMQ Error:', error);
  }
}

module.exports = { publishLogEvent };
