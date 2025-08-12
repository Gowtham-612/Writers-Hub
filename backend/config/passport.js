const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, rows[0]);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth profile received:', {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value
    });
    
    // Check if user already exists
    const { rows: existingUsers } = await db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (existingUsers.length > 0) {
      console.log('Existing user found, updating last login');
      // User exists, update last login
      await db.query(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [existingUsers[0].id]
      );
      return done(null, existingUsers[0]);
    }

    console.log('Creating new user from Google OAuth');
    // Create new user
    const email = profile.emails[0].value;
    const displayName = profile.displayName;
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
    const profileImage = profile.photos[0]?.value;

    const { rows: newUsers } = await db.query(
      `INSERT INTO users (google_id, email, username, display_name, profile_image) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [profile.id, email, username, displayName, profileImage]
    );

    console.log('New user created successfully');
    return done(null, newUsers[0]);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;
