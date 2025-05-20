const axios = require('axios');

const logEventHost = process.env.LOGEVENT_HOST || 'localhost';
const logEventPort = process.env.LOGEVENT_PORT || '3001';
const EVENT_URL = `http://${logEventHost}:${logEventPort}/api/logevent/`;

// Funktion zum Hinzufügen eines Berges
exports.addMountainLog = async function (mountain) {
  let mountainLog = getMountainLogObj(mountain);
  mountainLog.type = 'Hinzufügen';

  try {
    const response = await axios.post(EVENT_URL + 'add', mountainLog);
    console.log('addMountainLog service finished', response.data);
    return 0;
  } catch (error) {
    console.error('Error adding mountain log:', error);
    throw error;
  }
};

// Funktion zum Bearbeiten eines Berges
exports.editMountainLog = async function (mountain) {
  let mountainLog = getMountainLogObj(mountain);
  mountainLog.type = 'Editieren';

  try {
    const response = await axios.post(EVENT_URL + 'edit', mountainLog);
    console.log('editMountainLog service finished', response.data);
    return 0;
  } catch (error) {
    console.error('Error editing mountain log:', error);
    throw error;
  }
};

// Funktion zum Löschen eines Berges
exports.deleteMountainLog = async function (mountain) {
  let mountainLog = getMountainLogObj(mountain);
  mountainLog.type = 'Löschen';

  try {
    const response = await axios.post(EVENT_URL + 'delete', mountainLog);
    console.log('deleteMountainLog service finished', response.data);
    return 0;
  } catch (error) {
    console.error('Error deleting mountain log:', error);
    throw error;
  }
};

// Hilfsfunktion, um das Mountain-Log-Objekt zu erstellen
function getMountainLogObj(mountain) {
  return {
    name: mountain.name,
    elevation: mountain.elevation,
    hasmountainrailway: mountain.hasmountainrailway, 
    date: new Date(),
  };
}
