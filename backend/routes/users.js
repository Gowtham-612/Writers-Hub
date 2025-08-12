const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { rows } = await db.query(
      `SELECT id, username, display_name, profile_image, bio, created_at 
       FROM users WHERE username = $1`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Get follower and following counts
    const [followersResult, followingResult, postsResult] = await Promise.all([
      db.query('SELECT COUNT(*) FROM followers WHERE following_id = $1', [user.id]),
      db.query('SELECT COUNT(*) FROM followers WHERE follower_id = $1', [user.id]),
      db.query('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND is_published = true', [user.id])
    ]);

    user.followers_count = parseInt(followersResult.rows[0].count);
    user.following_count = parseInt(followingResult.rows[0].count);
    user.posts_count = parseInt(postsResult.rows[0].count);

    // Check if current user is following this user
    if (req.isAuthenticated()) {
      const { rows: followCheck } = await db.query(
        'SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2',
        [req.user.id, user.id]
      );
      user.is_following = followCheck.length > 0;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const { display_name, bio, theme_preference } = req.body;
    
    const { rows } = await db.query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           theme_preference = COALESCE($3, theme_preference),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [display_name, bio, theme_preference, req.user.id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow a user
router.post('/follow/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    await db.query(
      'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, userId]
    );

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.query(
      'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, userId]
    );

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's posts
router.get('/:username/posts', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT p.*, u.username, u.display_name, u.profile_image,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE u.username = $1 AND p.is_published = true
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [username, limit, offset]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get followers
router.get('/:username/followers', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT u.id, u.username, u.display_name, u.profile_image, u.bio
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       JOIN users target ON f.following_id = target.id
       WHERE target.username = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [username, limit, offset]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get following
router.get('/:username/following', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT u.id, u.username, u.display_name, u.profile_image, u.bio
       FROM followers f
       JOIN users u ON f.following_id = u.id
       JOIN users follower ON f.follower_id = follower.id
       WHERE follower.username = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [username, limit, offset]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT id, username, display_name, profile_image, bio
       FROM users
       WHERE username ILIKE $1 OR display_name ILIKE $1
       ORDER BY display_name
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
