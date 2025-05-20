import { useState, useEffect } from 'react';
import './mountain.css';
import mountainService from '../services/mountainService';
import authenticationService from '../services/authenticationService';
import DOMPurify from 'dompurify';

export default function Mountain({ onMountainAdded, selectedMountain }) {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    hoehe: '',
    laengengrad: '',
    breitengrad: '',
    bergbahn: 'ja',
    description: '',
    datei: null,
  });

  useEffect(() => {
    if (selectedMountain) {
      setFormData({
        id: selectedMountain.id || null,
        name: selectedMountain.name || '',
        hoehe: selectedMountain.elevation || '',
        laengengrad: selectedMountain.longitude || '',
        breitengrad: selectedMountain.latitude || '',
        bergbahn: selectedMountain.hasmountainrailway ? 'ja' : 'nein',
        description: selectedMountain.description || '',
        datei: null,
      });
    }
  }, [selectedMountain]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prevData) => ({
        ...prevData,
        datei: files[0],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const mountainData = {
        name: formData.name,
        elevation: formData.hoehe,
        longitude: formData.laengengrad,
        latitude: formData.breitengrad,
        hasmountainrailway: formData.bergbahn === 'ja',
        description: formData.description,
      };
      console.log('Submitting mountain data:', mountainData);

      let response;
      if (formData.id > 0) {
        let token = authenticationService.getToken();
        response = await fetch(`http://localhost:3000/mnts/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(mountainData),
        });
      } else {
        let token = authenticationService.getToken();
        response = await fetch('http://localhost:3000/mnts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(mountainData),
        });
      }

      const mountain = await response.json();
      if (!response.ok) {
        const errorMessages = mountain.errors
          .map((error) => error.msg)
          .join(', ');
        alert(`Fehler: ${errorMessages}`);
        return;
      }

      setFormData((prevData) => ({
        ...prevData,
        id: mountain.id,
      }));

      if (formData.datei) {
        const imageData = new FormData();
        imageData.append('img', formData.datei);

        const imageResponse = await fetch(
          `http://localhost:3000/mnts/${mountain.id}/img`,
          {
            method: 'PUT',
            body: imageData,
          }
        );

        if (!imageResponse.ok) {
          throw new Error('Fehler beim Hochladen des Bildes');
        }
      }

      alert(
        `Berg erfolgreich ${formData.id ? 'aktualisiert' : 'hinzugefügt'}!`
      );
      setFormData({
        id: null,
        name: '',
        hoehe: '',
        laengengrad: '',
        breitengrad: '',
        bergbahn: 'ja',
        description: '',
        datei: null,
      });

      if (onMountainAdded) {
        onMountainAdded();
      }
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern des Berges.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Möchten Sie diesen Berg wirklich löschen?')) {
      try {
        let token = authenticationService.getToken();
        await mountainService.deleteMountain(formData.id, token);

        alert('Berg erfolgreich gelöscht!');
        setFormData({
          id: null,
          name: '',
          hoehe: '',
          laengengrad: '',
          breitengrad: '',
          bergbahn: 'ja',
          description: '',
          datei: null,
        });
        if (onMountainAdded) {
          onMountainAdded();
        }
      } catch (error) {
        console.error('Fehler beim Löschen des Berges:', error);
        alert('Fehler beim Löschen des Berges.');
      }
    }
  };

  return (
    <div className="container">
      <h2 className="title">
        {formData.id ? 'Berg aktualisieren' : 'Berg erfassen'}
      </h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          name="name"
          type="text"
          placeholder="Name des Berges"
          value={formData.name}
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="hoehe"
          type="number"
          placeholder="Meter über Meer"
          value={formData.hoehe}
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="laengengrad"
          type="text"
          placeholder="Längengrad"
          value={formData.laengengrad}
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="breitengrad"
          type="text"
          placeholder="Breitengrad"
          value={formData.breitengrad}
          onChange={handleChange}
          className="input"
          required
        />
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="bergbahn"
              value="ja"
              checked={formData.bergbahn === 'ja'}
              onChange={handleChange}
            />{' '}
            Hat eine Bergbahn
          </label>
          <label>
            <input
              type="radio"
              name="bergbahn"
              value="nein"
              checked={formData.bergbahn === 'nein'}
              onChange={handleChange}
            />{' '}
            Hat keine Bergbahn
          </label>
        </div>
        <input
          type="file"
          name="datei"
          onChange={handleChange}
          className="file-input"
          accept="image/png, image/jpeg, image/jpg"
        />
        <textarea
          name="description"
          placeholder="Beschreibung"
          value={formData.description}
          onChange={handleChange}
          className="textarea"
          rows={4}
        />
        <button type="submit" className="submit-button">
          {formData.id ? 'Berg aktualisieren' : 'Berg hinzufügen'}
        </button>
        {formData.id && (
          <>
            <button
              type="button"
              className="delete-button"
              onClick={handleDelete}
            >
              Berg löschen
            </button>
            <div className="description-display" style={{ marginTop: '10px' }}>
              <p>
                Erstellen Sie eine HTML-konforme Beschreibung, sodass auf den{' '}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Link
                </a>{' '}
                geklickt werden kann:
              </p>
              <p>Not sanitized description:</p>
              <p
                dangerouslySetInnerHTML={{ __html: formData.description }}
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <p>Sanitized description (XSS safe):</p>
              <p
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(formData.description),
                }}
                style={{
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #ccc',
                  padding: '5px',
                }}
              />
            </div>
          </>
        )}
      </form>
    </div>
  );
}
