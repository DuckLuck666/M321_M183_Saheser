import React, { useEffect } from 'react';

const LoginKeycloak = ({ handleLoginSubmit }) => {
  useEffect(() => {
    handleLoginSubmit();
  }, []);

  return (
    <div>
      <h2>Du wirst zur Anmeldung weitergeleitet...</h2>
    </div>
  );
};

export default LoginKeycloak;
