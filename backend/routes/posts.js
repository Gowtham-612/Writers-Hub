const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

// Create a new post
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, content, tags, is_published = true } = req.body;
    
    const { rows } = await db.query(
      `INSERT INTO posts (user_id, title, content, tags, is_published) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, content, tags || [], is_published]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all posts (feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, u.username, u.display_name, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_published = true
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (tag) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(p.tags)`;
      queryParams.push(tag);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const { rows } = await db.query(query, queryParams);

    // Add like status for authenticated users
    if (req.isAuthenticated()) {
      for (let post of rows) {
        const { rows: likeCheck } = await db.query(
          'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
          [post.id, req.user.id]
        );
        post.is_liked = likeCheck.length > 0;
      }
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get posts from followed users (dashboard feed)
router.get('/feed', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT p.*, u.username, u.display_name, u.profile_image,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN followers f ON p.user_id = f.following_id
       WHERE f.follower_id = $1 AND p.is_published = true
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Add like status
    for (let post of rows) {
      const { rows: likeCheck } = await db.query(
        'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
        [post.id, req.user.id]
      );
      post.is_liked = likeCheck.length > 0;
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await db.query(
      `SELECT p.*, u.username, u.display_name, u.profile_image,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.is_published = true`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = rows[0];

    // Add like status for authenticated users
    if (req.isAuthenticated()) {
      const { rows: likeCheck } = await db.query(
        'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
        [post.id, req.user.id]
      );
      post.is_liked = likeCheck.length > 0;
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a post
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, is_published } = req.body;

    // Check if post belongs to user
    const { rows: postCheck } = await db.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postCheck[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { rows } = await db.query(
      `UPDATE posts 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           tags = COALESCE($3, tags),
           is_published = COALESCE($4, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [title, content, tags, is_published, id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post belongs to user
    const { rows: postCheck } = await db.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postCheck[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like a post
router.post('/:id/like', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, req.user.id]
    );

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlike a post
router.delete('/:id/like', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT c.*, u.username, u.display_name, u.profile_image
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a comment
router.post('/:id/comments', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const { rows } = await db.query(
      `INSERT INTO comments (post_id, user_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [id, req.user.id, content]
    );

    // Get user info for the comment
    const { rows: userInfo } = await db.query(
      'SELECT username, display_name, profile_image FROM users WHERE id = $1',
      [req.user.id]
    );

    const comment = {
      ...rows[0],
      ...userInfo[0]
    };

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular tags
router.get('/tags/popular', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT unnest(tags) as tag, COUNT(*) as count
       FROM posts
       WHERE is_published = true
       GROUP BY tag
       ORDER BY count DESC
       LIMIT 20`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
