const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = require('./models/user');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username', // Feld für den Benutzernamen
      passwordField: 'pwd', // Unser Feld für das Passwort heißt 'pwd'
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ where: { username: username } });

        if (!user) {
          return done(null, false, { message: 'Benutzer nicht gefunden.' });
        }

        const isMatch = await bcrypt.compare(password, user.pwd);
        if (!isMatch) {
          return done(null, false, { message: 'Falsches Passwort.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// User-ID in die Session speichern
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// User anhand der ID aus der Session abrufen
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
