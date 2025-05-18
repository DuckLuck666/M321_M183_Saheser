import React, { useState, useEffect } from 'react';
import './App.css';
import Menu from './components/Menu';
import Mountain from './components/Mountain';
import Login from './components/Login';
import Register from './components/Register';
import MountainGallery from './components/MountainGallery';
import LoginKeycloak from './components/LoginKeycloak';
import Statistic from './components/Statistic';
import mountainService from './services/mountainService';
import userService from './services/userService';
import authenticationService from './services/authenticationService';

function App() {
  const useKeycloak = true;
  const elevationLevel = 3000;
  const menuIdHome = 'menuIdHome';
  const menuIdLogin = 'menuIdLogin';
  const menuIdRegister = 'menuIdRegister';
  const menuIdAddMountain = 'menuIdAddMountain';
  const menuIdStatistics = 'menuStatistics';
  const [selectedItem, setSelectedItem] = useState(menuIdHome);
  const [isAuth, setIsAuth] = useState(false);
  const [selectedMountain, setSelectedMountain] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  const menuItems = [
    { name: 'Home', id: menuIdHome },
    { name: 'Login', id: menuIdLogin },
    { name: 'Registrieren', id: menuIdRegister },
    ...(isAuth
      ? [
          { name: 'Berg hinzufügen', id: menuIdAddMountain },
          { name: 'Statistiken', id: menuIdStatistics }, // Add this line for statistics
        ]
      : []),
  ];

  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMountains();

    if (useKeycloak) {
      authenticationService.initKeycloak().then(() => {
        setIsAuth(true);
        const roles = authenticationService.getUserRoles();
        setUserRoles(roles);
      });
    }
  }, []);
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.id === menuIdStatistics && userRoles.includes('no-statistics')) {
      return false;
    }
    return true;
  });
  const handleMountainAdded = () => {
    fetchMountains();
  };
  const handleLoginSubmit = (formData) => {
    if (useKeycloak) {
      authenticationService.login();
    }

    userService
      .login(formData)
      .then((status) => {
        setSelectedItem(menuIdHome);
      })
      .catch((error) => {
        console.error('Login fehlgeschlagen:', error);
        alert('Login fehlgeschlagen. Bitte überprüfe deine Eingaben.');
      });
  };

  const fetchMountains = async () => {
    try {
      const mountainList = await mountainService.loadMountainList();

      const mountainDetails = await Promise.all(
        mountainList.map(async (mountainId) => {
          const mountain = await mountainService.loadMountain(mountainId);

          const [longitude, latitude] = mountain.geometry.coordinates;

          return {
            ...mountain,
            longitude,
            latitude,
            hasmountainrailway: mountain.mountainrailway,
          };
        })
      );
      setMountains(mountainDetails);
    } catch (err) {
      console.error('Failed to load mountains:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Die Berge werden geladen ...</div>;
  }
  if (mountains.length === 0) {
    return (
      <div>Es wurden keine Berge gefunden. Versuchen Sie es nochmals.</div>
    );
  }

  const handleMountainSelect = (mountain) => {
    if (!isAuth) {
      alert('Sie müssen angemeldet sein, um einen Berg zu bearbeiten.');
      return;
    }
    setSelectedMountain(mountain);
    setSelectedItem(menuIdAddMountain);
  };

  return (
    <div>
      <Menu setSelectedItem={setSelectedItem} menuItems={filteredMenuItems} />

      {selectedItem === menuIdHome && (
        <MountainGallery
          mountains={mountains}
          onMountainSelect={handleMountainSelect}
          isAuth={isAuth}
        />
      )}

      {selectedItem === menuIdAddMountain && (
        <Mountain
          onMountainAdded={handleMountainAdded}
          selectedMountain={selectedMountain}
        />
      )}

      {selectedItem === menuIdLogin &&
        (useKeycloak ? (
          <LoginKeycloak handleLoginSubmit={handleLoginSubmit} />
        ) : (
          <Login handleLoginSubmit={handleLoginSubmit} />
        ))}
      {selectedItem === menuIdRegister && <Register />}
      {selectedItem === menuIdStatistics && (
        <Statistic elevationLevel={elevationLevel} />
      )}
    </div>
  );
}

export default App;
