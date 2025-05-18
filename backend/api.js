// importing genereal modules

//load environment
require('dotenv').config();
const { checkAndChangePlaintextPasswords } = require('./controllers/user');

const { keycloak } = require('./config/keycloak-config');
const { USE_SESSIOIN_HANDLING } = require('./util/const');

checkAndChangePlaintextPasswords();

// cookie parser for handling cookies
const cookieParser = require('cookie-parser');
const fs = require('fs');
const https = require('https');
const PORT = 3443;

// module for handling http requests and responses and managing routes
const express = require('express');

// helper for concatinating paths
const path = require('path');

// session management
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const memoryStore = new MemoryStore();
// importing self-developed moudules
const routes = require('./routes/main');

// importing log utilities
const logger = require('./util/log');

// import model classes
const Mountain = require('./models/mountain');
const User = require('./models/user');

const api = express();

// initialize body-parser for JSON-format
api.use(express.json());

// initialize database connection an orm
const db = require('./util/db');

const { sleep } = require('./util/helper');

// get sample data
const sampledata = require('./util/sampledata');
const { env } = require('process');

// get constants
const { STATIC_DIR, JWTSECTRET } = require('./util/const');

// initialize body-parser for JSON-format
api.use(express.json());
api.use(
  session({
    cookie: { maxAge: 3600000 }, // 1 hour
    store: new MemoryStore({
      checkPeriod: 3600000, // prune expired entries every 1h
    }),
    resave: false,
    saveUninitialized: false,
    secret: JWTSECTRET, // In production, use environment variable
    secure: true, // use secure cookies over HTTP
    sameSite: 'none', // 'none' with HTTPS + Secure
  })
);
const options = {
  key: fs.readFileSync('server-saheser.key'),
  cert: fs.readFileSync('server-saheser.crt'),
};
https.createServer(options, api).listen(PORT, () => {
  console.log(`HTTPS Server läuft auf https://localhost:${PORT}`);
});

// Configure session middleware
if (USE_SESSIOIN_HANDLING) {
  const passport = require('./passport-config');
  api.use(passport.initialize());
  api.use(passport.session());
  api.use(cookieParser());
  api.use((req, res, next) => {
    res.cookie('username', 'guest', {
      httpOnly: true,
      secure: false,
      maxAge: 3600000, // 1 hour in milliseconds
    });
    next();
  });
} else {
  api.use(
    session({
      //secret: found in keycloak.json
      secret: 'x7x1qydPBDoaij1iEohNcxEBYfhv7Jyi',
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
    })
  );
  api.use(keycloak.middleware());
}

// initialize cookie-parser middleware

// configure cookie settings

api.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, PUT, POST, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
/*
const helmet = require('helmet');

api.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));*/
// set static path for public dirctory: cwd=current working directory
api.use(express.static(path.join(process.cwd(), STATIC_DIR)));

api.use(routes);
// fallback: redirect to / in case there is no routing match
api.use((req, res, next) => {
  res.redirect('/');
});

// error handler sends error message as json
api.use((err, req, res, next) => {
  logger.error(err.message, {
    errno: err.errno,
    error: err,
  });
  res.status(err.statusCode).json({
    errorMessage:
      'Es ist ein Fehler aufgetreten, versuchen Sie es später erneut',
  });
});

// try to connect to database and start listener
(async () => {
  try {
    // sync database and load sample data while project code is under developement
    // check environment variable NODE_DBSYNC
    if (process.env.NODE_DBSYNC === 'true') {
      // polling for ready database
      let isDbReady = false;
      for (let i = 0; i < 5; i++) {
        try {
          await db.authenticate();
          isDbReady = true;
          break;
        } catch (err) {}
        await sleep(10000);
      }

      if (isDbReady) {
        await db.sync({ force: true });
        // load sample mountains
        for (const mountain of sampledata.mountains.features) {
          await Mountain.create({
            id: mountain.properties.id,
            name: mountain.properties.name,
            description: mountain.properties.description,
            image: mountain.properties.img,
            elevation: mountain.properties.el,
            hasmountainrailway: mountain.properties.mountainrailway,
            longitude: mountain.geometry.coordinates[0],
            latitude: mountain.geometry.coordinates[1],
          });
        }
        // load sample users
        let testUsers;
        if (process.env.NODE_HASHED_PWD === 'true') {
          testUsers = sampledata.users_hashed_pwd;
        } else {
          testUsers = sampledata.users_clear_pwd;
        }

        for (const user of testUsers) {
          await User.create({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            pwd: user.pwd,
            avatar: user.avatar,
          });
        }
        // associate mountains to users
        for (const userMountain of sampledata.userMountains) {
          await Mountain.update(
            {
              userId: userMountain.userid,
            },
            { where: { id: userMountain.mountainid } }
          );
        }
      }
    }
  } catch (err) {
    logger.error(err.message, {
      errno: err.errno,
      error: err,
    });
  } finally {
    api.listen(3000);
  }
})();
