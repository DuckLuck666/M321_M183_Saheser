const express = require('express');
const router = express.Router();
const producerController = require('./producer.controller');

// Routes definieren
router.post('/logevent/add', producerController.addEvent);
router.post('/logevent/edit', producerController.editEvent);
router.post('/logevent/delete', producerController.deleteEvent);

module.exports = router;
