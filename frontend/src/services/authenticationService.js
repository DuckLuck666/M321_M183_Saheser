import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8089',
  realm: 'ims3i',
  clientId: 'mountainGalleryFrontend',
});

const initKeycloak = () => {
  console.log('initKeycloak start');
  let promise = new Promise(function (resolve, reject) {
    try {
      console.log('initKeycloak');
      keycloak
        .init({ onLoad: 'check-sso' })
        .then((authenticated) => {
          console.log(
            `User is ${authenticated ? 'authenticated' : 'not authenticated'}`
          );
          if (authenticated) {
            console.log('token received:', keycloak.token);
            resolve(keycloak.token);
          }
        })
        .catch((error) => {
          console.error('Error 1 initializing Keycloak:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error 2 initializing Keycloak:', error);
      reject(error);
    }
  });
  return promise;
};

function login() {

  keycloak.login();
}

function logout() {
  keycloak.logout();
}
function getToken() {
  keycloak
    .updateToken(70)
    .then((refreshed) => {
      if (refreshed) {
        console.log('Token has been refreshed');
      } else {
        console.log('Token is still valid');
      }
    })
    .catch(() => {
      console.error('Failed to refresh the token');
    });

  return keycloak.token;
}
function getUserRoles() {
  if (!keycloak.tokenParsed) {
    return [];
  }
  const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
  const clientRoles =
    keycloak.tokenParsed.resource_access?.[keycloak.clientId]?.roles || [];
  return [...realmRoles, ...clientRoles];
}

export default {
  initKeycloak,
  logout,
  login,
  getToken,
  getUserRoles,
};
