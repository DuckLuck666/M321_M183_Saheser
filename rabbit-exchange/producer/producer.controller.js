const { publishLogEvent } = require('./producer.model');

exports.addEvent = (req, res) => {
  publishLogEvent('Hinzufügen', req.body);
  res.json({ message: 'Add log event sent' });
};

exports.editEvent = (req, res) => {
  publishLogEvent('Editieren', req.body);
  res.json({ message: 'Edit log event sent' });
};

exports.deleteEvent = (req, res) => {
  publishLogEvent('Löschen', req.body);
  res.json({ message: 'Delete log event sent' });
};
