const amqp = require('amqplib');

// RabbitMQ connection settings

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';
const RABBITMQ_URL = `amqp://${rabbitmqHost}:${rabbitmqPort}`;

const EXCHANGE_NAME = 'log_exchange_Saheser';

// Circular buffer to store the last 15 events
class EventBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = [];
  }

  add(event) {
    // Wenn die Anzahl der Events die Kapazität überschreitet, wird das älteste entfernt
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift(); // Entfernt das älteste Event
    }
    this.buffer.push(event); // Fügt das neue Event hinzu
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

// Erstelle einen Event-Buffer mit einer Kapazität von 15 Events
const eventBuffer = new EventBuffer(15);

// Verbinde dich mit RabbitMQ und starte das Abonnieren der Nachrichten
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

    // Starte das Empfangen von Nachrichten
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString()); // Verarbeite die Nachricht als JSON
          eventBuffer.add(event); // Füge das Event dem Buffer hinzu
          channel.ack(msg); // Bestätige die Nachricht als verarbeitet
        } catch (error) {
          console.error('Fehler beim Verarbeiten der Nachricht:', error);
          channel.nack(msg); // Falls ein Fehler auftritt, nack die Nachricht
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

// Starte den Subscriber
startSubscriber();
