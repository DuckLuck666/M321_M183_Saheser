const {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  SEQ_DB_ERR,
  SEQ_UNIQUE_CONSTRAINT_ERR,
  BCRYPTSALTROUNDS,
} = require('../util/const');

const { isEmpty } = require('../util/helper');
const User = require('../models/user');

const bcrypt = require('bcryptjs');

exports.hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, BCRYPTSALTROUNDS, (err, hash) => {
      if (err) reject(err);
      else resolve(hash);
    });
  });
};

getUserByUsername = async (username) => {
  try {
    const resultSet = await User.findOne({
      where: { username: username },
    });
    res.status(HTTP_STATUS_OK).json(toGeoFeatureObj(resultSet));
  } catch (err) {
    err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const username = req.body.username;
  const pwd = req.body.pwd;

  try {
    let user = await User.findOne({ where: { username: username } });

    if (user && (await bcrypt.compare(pwd, user.pwd))) {
      res.status(HTTP_STATUS_OK).json(user);
    } else {
      const err = new Error('Authentication failed.');
      err.statusCode = HTTP_STATUS_UNAUTHORIZED;
      throw err;
    }
  } catch (err) {
    if (err.statusCode !== HTTP_STATUS_UNAUTHORIZED) {
      err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    }
    next(err);
  }
};
exports.checkAndChangePlaintextPasswords = async () => {
  try {
    const users = await User.findAll();

    for (let user of users) {
      if (!user.pwd.startsWith('$2b$')) {
        const hashedPwd = await exports.hashPassword(user.pwd);
        await user.update({ pwd: hashedPwd });
        console.log(`Passwort für Benutzer ${user.username} wurde gehasht.`);
      }
    }

    console.log('Passwort-Check abgeschlossen.');
  } catch (err) {
    console.error('Fehler beim Prüfen der Passwörter:', err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const hashedPwd = await hashPassword(req.body.pwd);
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      pwd: hashedPwd,
      avatar: req.body.avatar,
    });
    res.status(HTTP_STATUS_CREATED).json(user);
  } catch (err) {
    if (err.name === SEQ_UNIQUE_CONSTRAINT_ERR) {
      err.statusCode = HTTP_STATUS_CONFLICT;
      err.message = `User already exists.`;
    } else {
      err.statusCode = HTTP_STATUS_INETERNAL_SERVER_ERROR;
    }
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    let httpStatus = HTTP_STATUS_OK;
    let user = await User.findOne({
      where: { id: req.params.id },
    });
    if (isEmpty(user)) {
      httpStatus = HTTP_STATUS_NOT_FOUND;
      user = {};
    }

    res.status(httpStatus).json(user);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    }
    next(err);
  }
};

exports.filterUsers = async (req, res, next) => {
  try {
    let users = new Array(0);
    if (isEmpty(req.query)) {
      users = await User.findAll();
    } else {
      try {
        users = await User.findAll({ where: req.query });
      } catch (err) {
        if (err.name === SEQ_DB_ERR) {
          err.message = 'Invalid query string.';
          err.statusCode = HTTP_STATUS_BAD_REQUEST;
          throw err;
        }
      }
    }
    res.status(HTTP_STATUS_OK).json(users);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    }
    next(err);
  }
};
exports.loginWithPassport = (req, res, next, err, user, info) => {
  if (err) {
    return next(err); // Fehler weitergeben
  }
  if (!user) {
    return res
      .status(401)
      .json({ message: info ? info.message : 'Login fehlgeschlagen' });
  }

  req.logIn(user, (err) => {
    if (err) {
      return next(err);
    }
    return res.status(200).json({ message: 'Login erfolgreich', user });
  });
};

exports.deleteUser = async (req, res, next) => {
  try {
    let countDeletedUsers = 0;
    let httpStatus = HTTP_STATUS_NOT_FOUND;
    if (!isEmpty(req.params.id)) {
      countDeletedUsers = await User.destroy({
        where: { id: req.params.id },
      });
    }
    if (countDeletedUsers != 0) {
      httpStatus = HTTP_STATUS_OK;
    }
    res.status(httpStatus).json({ usersDeleted: countDeletedUsers });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
