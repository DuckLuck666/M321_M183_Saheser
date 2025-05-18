import { useState } from 'react';
import './login.css';

const Login = ({ handleLoginSubmit }) => {
  const [formData, setFormData] = useState({
    username: '', // Stelle sicher, dass es ein leerer String ist
    pwd: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(formData);
  };

  return (
    <div>
      <h2 className="mountain-title">Benutzer Login</h2>
      <form className="mountain-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Benutzername"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="pwd"
          placeholder="Passwort"
          value={formData.pwd}
          onChange={handleChange}
          required
        />
        <button type="submit">Einloggen</button>
      </form>
    </div>
  );
};

export default Login;
