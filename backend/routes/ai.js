const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');
const axios = require('axios');
require('dotenv').config();

// Chat message structure
const createChatMessage = (role, content) => ({
  role,
  content
});

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const { rows } = await db.query('SELECT NOW() as current_time');
    console.log('Database query successful:', rows[0]);
    
    // Test chat_sessions table
    const { rows: tableCheck } = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_sessions'
      ) as table_exists
    `);
    
    console.log('Chat sessions table exists:', tableCheck[0].table_exists);
    
    res.json({ 
      status: 'success',
      database: 'connected',
      current_time: rows[0].current_time,
      chat_sessions_table: tableCheck[0].table_exists
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Initialize chat session
router.post('/chat/start', isAuthenticated, async (req, res) => {
  try {
    console.log('Starting new chat session for user:', req.user.id);
    
    const { rows } = await db.query(
      `INSERT INTO chat_sessions (user_id, created_at) 
       VALUES ($1, CURRENT_TIMESTAMP) RETURNING id`,
      [req.user.id]
    );

    console.log('Chat session created successfully:', rows[0]);

    res.json({ 
      session_id: rows[0].id,
      message: 'Chat session started'
    });
  } catch (error) {
    console.error('Error starting chat session:', error);
    console.error('User object:', req.user);
    console.error('Database error details:', error.detail || error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Send message to OpenRouter chatbot (DeepSeek model)
router.post('/chat/message', isAuthenticated, async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Save user message to database
    const { rows: userMessage } = await db.query(
      `INSERT INTO chat_messages (session_id, user_id, role, content, created_at) 
       VALUES ($1, $2, 'user', $3, CURRENT_TIMESTAMP) RETURNING *`,
      [session_id, req.user.id, message.trim()]
    );

    // Get chat history for context (last 10 messages to maintain conversation memory)
    const { rows: chatHistory } = await db.query(
      `SELECT role, content FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC 
       LIMIT 10`,
      [session_id]
    );

    // Prepare messages for OpenRouter API with conversation memory
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI writing assistant. You help writers with creative writing, brainstorming, editing, and writing advice. Be encouraging, creative, and provide practical suggestions.

IMPORTANT: Always format your responses in a clear, readable way:
- Use bullet points (•) for lists and suggestions
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Use headers (#) for organizing different sections
- Use bold text (**bold**) for emphasis on key points
- Use blockquotes (>) for important tips or quotes
- Add proper spacing between paragraphs
- Structure your responses logically with clear sections

Remember the context of the conversation and build upon previous messages. Make your responses visually appealing and easy to read.`
      },
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenRouter API with DeepSeek model
    const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'WritersHub'
        }
      }
    );

    const aiResponse = openRouterResponse.data.choices?.[0]?.message?.content || 'No response from AI.';

    // Save AI response to database
    const { rows: aiMessage } = await db.query(
      `INSERT INTO chat_messages (session_id, user_id, role, content, created_at) 
       VALUES ($1, $2, 'assistant', $3, CURRENT_TIMESTAMP) RETURNING *`,
      [session_id, req.user.id, aiResponse]
    );

    res.json({
      message: aiResponse,
      session_id: session_id,
      timestamp: aiMessage[0].created_at
    });

  } catch (error) {
    console.error('OpenRouter error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'OpenRouter API key is invalid' });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// Get chat history
router.get('/chat/history/:sessionId', isAuthenticated, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { rows } = await db.query(
      `SELECT id, role, content, created_at 
       FROM chat_messages 
       WHERE session_id = $1 AND user_id = $2
       ORDER BY created_at ASC`,
      [sessionId, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's chat sessions
router.get('/chat/sessions', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cs.id, cs.created_at, 
              (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at ASC LIMIT 1) as first_message
       FROM chat_sessions cs
       WHERE cs.user_id = $1
       ORDER BY cs.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete chat session
router.delete('/chat/session/:sessionId', isAuthenticated, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Delete messages first
    await db.query(
      'DELETE FROM chat_messages WHERE session_id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    // Delete session
    const { rows } = await db.query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [sessionId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check OpenRouter API status
router.get('/status', async (req, res) => {
  try {
    console.log('Checking OpenRouter API status...');
    console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('API') || key.includes('ROUTER')));
    
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('OpenRouter API key not found in environment variables');
      return res.json({ 
        status: 'disconnected',
        error: 'OpenRouter API key not configured'
      });
    }

    console.log('OpenRouter API key found, testing connection...');

    // Test API with a simple request
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'WritersHub'
        }
      }
    );

    console.log('OpenRouter API test successful');

    res.json({ 
      status: 'connected',
      model: 'deepseek/deepseek-r1-0528:free',
      provider: 'OpenRouter'
    });
  } catch (error) {
    console.error('OpenRouter API test failed:', error);
    console.error('Error response:', error.response?.data);
    res.json({ 
      status: 'disconnected',
      error: 'OpenRouter API is not available',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
