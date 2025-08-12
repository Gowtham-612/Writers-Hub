const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

// Get user's conversations
router.get('/conversations', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT 
         c.id as chat_id,
         CASE 
           WHEN c.user1_id = $1 THEN c.user2_id
           ELSE c.user1_id
         END as other_user_id,
         u.username as other_username,
         u.display_name as other_display_name,
         u.profile_image as other_profile_image,
         (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
         (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
         (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM chats c
       JOIN users u ON (
         CASE 
           WHEN c.user1_id = $1 THEN c.user2_id
           ELSE c.user1_id
         END = u.id
       )
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY last_message_time DESC NULLS LAST`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get or create chat between two users
router.get('/with/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    // Check if chat exists
    let { rows } = await db.query(
      `SELECT id FROM chats 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [req.user.id, userId]
    );

    let chatId;
    if (rows.length === 0) {
      // Create new chat
      const { rows: newChat } = await db.query(
        'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
        [req.user.id, userId]
      );
      chatId = newChat[0].id;
    } else {
      chatId = rows[0].id;
    }

    res.json({ chat_id: chatId });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', isAuthenticated, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of this chat
    const { rows: chatCheck } = await db.query(
      'SELECT id FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [chatId, req.user.id]
    );

    if (chatCheck.length === 0) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    const { rows } = await db.query(
      `SELECT m.*, u.username, u.display_name, u.profile_image
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );

    // Mark messages as read
    await db.query(
      'UPDATE messages SET is_read = true WHERE chat_id = $1 AND sender_id != $2 AND is_read = false',
      [chatId, req.user.id]
    );

    res.json(rows.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/:chatId/messages', isAuthenticated, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is part of this chat
    const { rows: chatCheck } = await db.query(
      'SELECT id FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [chatId, req.user.id]
    );

    if (chatCheck.length === 0) {
      return res.status(403).json({ error: 'Not authorized to send message to this chat' });
    }

    const { rows } = await db.query(
      `INSERT INTO messages (chat_id, sender_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [chatId, req.user.id, content.trim()]
    );

    // Get user info for the message
    const { rows: userInfo } = await db.query(
      'SELECT username, display_name, profile_image FROM users WHERE id = $1',
      [req.user.id]
    );

    const message = {
      ...rows[0],
      ...userInfo[0]
    };

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.put('/:chatId/read', isAuthenticated, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is part of this chat
    const { rows: chatCheck } = await db.query(
      'SELECT id FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [chatId, req.user.id]
    );

    if (chatCheck.length === 0) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    await db.query(
      'UPDATE messages SET is_read = true WHERE chat_id = $1 AND sender_id != $2 AND is_read = false',
      [chatId, req.user.id]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count
router.get('/unread/count', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) as unread_count
       FROM messages m
       JOIN chats c ON m.chat_id = c.id
       WHERE (c.user1_id = $1 OR c.user2_id = $1) 
         AND m.sender_id != $1 
         AND m.is_read = false`,
      [req.user.id]
    );

    res.json({ unread_count: parseInt(rows[0].unread_count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
