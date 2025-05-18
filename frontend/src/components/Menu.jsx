import React from 'react';
import './menu.css';
import authenticationService from '../services/authenticationService';

const Menu = ({ setSelectedItem, menuItems }) => {
  const handleLogout = () => {
    authenticationService.logout();
  };


  return (
    <nav className="menu">
      {menuItems.map((menuItem) => (
        <button key={menuItem.id} onClick={() => setSelectedItem(menuItem.id)}>
          {menuItem.name}
        </button>
      ))}
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </nav>
  );
};

export default Menu;
