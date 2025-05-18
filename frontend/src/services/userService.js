import axios from 'axios';

const backendHost = import.meta.env.VITE_BACKEND;

async function login(formData) {
  try {
    const response = await axios.post(
      `${backendHost}/login`,
      { username: formData.username, pwd: formData.pwd },
      { withCredentials: true }
    );

    console.log('Login erfolgreich:', response.data);
    return response.data; // Rückgabe von Benutzerinformationen oder Token, falls vorhanden
  } catch (error) {
    if (error.response) {
      // Falls das Backend einen HTTP-Fehler zurückgibt
      if (error.response.status === 401) {
        console.warn('Falscher Benutzername oder Passwort.');
        return false;
      }
      console.error('Server-Fehler:', error.response.data);
    } else {
      console.error('Netzwerkfehler oder Server nicht erreichbar.');
    }
    return false; // Login fehlgeschlagen
  }
}

export default { login };
