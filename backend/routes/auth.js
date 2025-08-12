const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');

// Google OAuth login
router.get('/google', (req, res, next) => {
  console.log('Google OAuth initiated');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', 
  (req, res, next) => {
    console.log('Google OAuth callback received');
    passport.authenticate('google', { failureRedirect: '/login' })(req, res, next);
  },
  (req, res) => {
    console.log('Google OAuth successful, redirecting to frontend');
    const redirectBase = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000';
    const redirectUrl = `${redirectBase}/dashboard`;
    res.redirect(redirectUrl);
  }
);

// Email/password registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if email already in use
    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Generate a username from email with retry to avoid rare collisions
    const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
    let username;
    let attempts = 0;
    while (attempts < 5) {
      const candidate = `${baseUsername}_${Math.random().toString(36).slice(2, 7)}`;
      const { rows: existingUsernames } = await db.query('SELECT 1 FROM users WHERE username = $1', [candidate]);
      if (existingUsernames.length === 0) {
        username = candidate;
        break;
      }
      attempts += 1;
    }
    if (!username) {
      return res.status(500).json({ error: 'Could not generate unique username. Please try again.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (email, username, password_hash, email_verified)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `;
    const { rows } = await db.query(insertQuery, [normalizedEmail, username, passwordHash]);
    const user = rows[0];

    // Create session
    req.login(user, (err) => {
      if (err) {
        console.error('Session creation error after registration:', err);
        return res.status(500).json({ error: 'Registration succeeded but session failed' });
      }
      const { password_hash, ...userWithoutPassword } = user;
      res.status(201).json({ message: 'Registered successfully', user: userWithoutPassword });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0 || !rows[0].password_hash) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create a session login via passport's req.login
    req.login(user, (err) => {
      if (err) {
        console.error('Session login error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }
      const { password_hash, ...userWithoutPassword } = user;
      res.json({ message: 'Logged in successfully', user: userWithoutPassword });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set password for logged-in Google users
router.post('/set-password', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, username, display_name, profile_image, theme_preference, created_at, updated_at',
      [passwordHash, req.user.id]
    );

    res.json({ message: 'Password set successfully', user: rows[0] });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    const { password, password_hash, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({ 
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? (() => { const { password_hash, ...u } = req.user; return u; })() : null 
  });
});

module.exports = router;
