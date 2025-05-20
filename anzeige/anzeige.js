const amqp = require('amqplib');

// RabbitMQ connection settings

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';
const RABBITMQ_URL = `amqp://${rabbitmqHost}:${rabbitmqPort}`;

const EXCHANGE_NAME = 'log_exchange_Saheser';

class EventBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = [];
  }

  add(event) {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(event);
    this.display();
  }

  display() {
    console.clear(); // Leert die Konsole
    console.log('=== Letzte 15 Events ===');
    console.log('------------------------');

    // Die Events werden in umgekehrter Reihenfolge angezeigt (neueste zuerst)
    this.buffer
      .slice()
      .reverse()
      .forEach((event, index) => {
        console.log(`${index + 1}. Event Type: ${event.eventType}`);
        console.log(`   Timestamp: ${event.timestamp}`);
        console.log('------------------------');
      });
  }
}

const eventBuffer = new EventBuffer(15);

async function startSubscriber() {
  try {
    // Stelle die Verbindung zu RabbitMQ her
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Stelle sicher, dass der Exchange existiert
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });

    // Erstelle eine Queue und binde sie an den Exchange
    const { queue } = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(queue, EXCHANGE_NAME, '');

    console.log('Subscriber gestartet. Warte auf Nachrichten...');

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          eventBuffer.add(event);
          channel.ack(msg);
        } catch (error) {
          console.error('Fehler beim Verarbeiten der Nachricht:', error);
          channel.nack(msg);
        }
      }
    });

    // Behandle den Fall, wenn das Programm geschlossen wird
    process.on('SIGINT', async () => {
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fehler beim Verbinden mit RabbitMQ:', error);
    process.exit(1);
  }
}

startSubscriber();
const express = require('express');

const app = express();
app.use(express.json());

const PORT = 3002;

app.get('/', (req, res) => {
  res.send(
    'Logging Event API is running. Use /api/logevent/add to add events.'
  );
});

app.listen(PORT, () => {
  console.log(`Logging Event API running on http://localhost:${PORT}`);
});
const promclient = require('prom-client');

const register = promclient.register;
promclient.collectDefaultMetrics();

const httpRequestCounter = new promclient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});
