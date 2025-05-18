// moudule providing objects and functions for routing
const express = require('express');
const { body } = require('express-validator');

// utility to handle file uploads
const multer = require('multer');

// import controller functions
const mountainCtrl = require('../controllers/mountain');
const userCtrl = require('../controllers/user');
const passport = require('../passport-config');
const miscCtrl = require('../controllers/misc');
const { USE_SESSIOIN_HANDLING } = require('../util/const');
const { keycloak } = require('../config/keycloak-config');

// define storage location and filename for uploaded image files
const imgStorage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, 'public');
  },
  filename(req, file, callback) {
    const fileExt = file.mimetype.split('/')[1];
    filename = `${req.params.mntid}.${fileExt}`;
    callback(null, filename);
  },
});

// file filter function: accept only images
const filter = (req, file, callback) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};
// create a multer object to handle uploaded files
const upload = multer({ storage: imgStorage, fileFilter: filter }).single(
  'img'
);

const router = express.Router();
/*
router.post('/login', (req, res, next) => {
  console.log('Login route with passport hit');

  passport.authenticate('local', (err, user, info) => {
    userCtrl.loginWithPassport(req, res, next, err, user, info);
  })(req, res, next);
});*/
if (USE_SESSIOIN_HANDLING) {
  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      userCtrl.loginWithPassport(req, res, next, err, user, info);
    })(req, res, next);
  });
} else {
  router.post('/login', (req, res, next) => {
    userCtrl.login(req, res, next);
  });
  router.post(
    '/mnts',
    keycloak.protect(),
    [
      body('elevation') //maybe todo
        .isNumeric()
        .withMessage('Elevation muss eine Zahl sein'),
      body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Breitengrad muss zwischen -90 und 90 sein'),
    ],
    mountainCtrl.addPublicMountain
  );
  router.get(
    '/statistics/:elevationLevel',
    keycloak.protect(),
    mountainCtrl.calculateStatistics
  );
}

router.get('/users', userCtrl.filterUsers);
router.post('/users', userCtrl.signup);
router.delete('/users/:id', userCtrl.deleteUser);
router.get('/users/:id', userCtrl.getUser);

router.get('/mnts', mountainCtrl.getAllPublicMountainIds);
router.get('/mnts/:id', mountainCtrl.getPublicMountain);
router.put('/mnts/:id', mountainCtrl.updatePublicMountain);

router.put('/mnts/:mntid/img', upload, mountainCtrl.addPublicMountainImage);
router.delete('/mnts/:id', mountainCtrl.deletePublicMountain);

router.get('/', miscCtrl.default);
router.get('/avatars', miscCtrl.getAvatars);

// for testing purpose only, not used by frontend application
router.get('/images', miscCtrl.getImage);

module.exports = router;
