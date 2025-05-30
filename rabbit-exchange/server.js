const express = require('express');
const logRoutes = require('./producer/producer.routes');

const app = express();
app.use(express.json());


app.use('/api', logRoutes);

const PORT = 3001;

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
