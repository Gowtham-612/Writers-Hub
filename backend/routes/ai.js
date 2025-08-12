const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');
const axios = require('axios');

// Get user's writing samples for AI training
router.get('/samples', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, content, created_at
       FROM posts
       WHERE user_id = $1 AND is_published = true
       ORDER BY created_at DESC
       LIMIT 3`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching writing samples:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate content using Ollama
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const { plot, samples } = req.body;

    if (!plot) {
      return res.status(400).json({ error: 'Plot is required' });
    }

    // Get user's writing samples if not provided
    let writingSamples = samples;
    if (!writingSamples || writingSamples.length === 0) {
      const { rows } = await db.query(
        `SELECT title, content
         FROM posts
         WHERE user_id = $1 AND is_published = true
         ORDER BY created_at DESC
         LIMIT 3`,
        [req.user.id]
      );
      writingSamples = rows;
    }

    // Prepare few-shot prompt
    let prompt = `You are an AI writing assistant. Based on the following writing samples and a new plot idea, generate content in the same style and voice as the samples.

Writing Samples:
`;

    writingSamples.forEach((sample, index) => {
      prompt += `\nSample ${index + 1} - ${sample.title}:\n${sample.content}\n`;
    });

    prompt += `\nNew Plot/Idea: ${plot}\n\nGenerate content in the same style as the samples above:`;

    // Call Ollama API
    const ollamaResponse = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      model: process.env.OLLAMA_MODEL || 'llama3',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      }
    });

    const generatedContent = ollamaResponse.data.response;

    res.json({
      content: generatedContent,
      samples_used: writingSamples.length
    });

  } catch (error) {
    console.error('Error generating content:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Ollama service is not running. Please start Ollama and try again.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Save AI writing sample
router.post('/samples', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;

    const { rows } = await db.query(
      `INSERT INTO ai_writing_samples (user_id, title, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, title, content]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error saving AI sample:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI writing samples
router.get('/samples/all', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, content, created_at
       FROM ai_writing_samples
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching AI samples:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete AI writing sample
router.delete('/samples/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      'DELETE FROM ai_writing_samples WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    res.json({ message: 'Sample deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI sample:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check Ollama status
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.OLLAMA_BASE_URL}/api/tags`);
    res.json({ 
      status: 'connected',
      models: response.data.models || []
    });
  } catch (error) {
    res.json({ 
      status: 'disconnected',
      error: 'Ollama service is not available'
    });
  }
});

module.exports = router;
