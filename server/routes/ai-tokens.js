const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt, maskToken } = require('../utils/encryption');
const llmService = require('../services/llm-service');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/ai-tokens - Get all user's AI tokens (masked)
router.get('/', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT id, service, is_active, last_used, created_at FROM ai_tokens WHERE user_id = ? ORDER BY service',
    [userId],
    (err, tokens) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching tokens' });
      }

      // Return tokens without exposing actual values
      const sanitizedTokens = tokens.map(token => ({
        id: token.id,
        service: token.service,
        is_active: token.is_active === 1,
        last_used: token.last_used,
        created_at: token.created_at,
        status: token.is_active === 1 ? 'active' : 'inactive',
        has_token: true
      }));

      res.json(sanitizedTokens);
    }
  );
});

// POST /api/ai-tokens - Add or update AI token
router.post('/', (req, res) => {
  const { userId } = req.user;
  const { service, token } = req.body;

  // Validate input
  const validServices = ['groq', 'huggingface', 'together', 'openrouter', 'anthropic'];

  if (!service || !token) {
    return res.status(400).json({ error: 'Service and token are required' });
  }

  if (!validServices.includes(service)) {
    return res.status(400).json({ error: 'Invalid service. Must be one of: ' + validServices.join(', ') });
  }

  if (token.length < 10) {
    return res.status(400).json({ error: 'Token appears to be invalid (too short)' });
  }

  try {
    // Encrypt the token
    const encryptedToken = encrypt(token);

    // Check if token already exists for this user/service
    db.get(
      'SELECT id FROM ai_tokens WHERE user_id = ? AND service = ?',
      [userId, service],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
          // Update existing token
          db.run(
            'UPDATE ai_tokens SET token_encrypted = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND service = ?',
            [encryptedToken, userId, service],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Error updating token' });
              }

              res.json({
                message: `${service} token updated successfully`,
                service,
                masked_token: maskToken(token)
              });
            }
          );
        } else {
          // Insert new token
          const id = uuidv4();

          db.run(
            'INSERT INTO ai_tokens (id, user_id, service, token_encrypted, is_active) VALUES (?, ?, ?, ?, 1)',
            [id, userId, service, encryptedToken],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Error saving token' });
              }

              res.status(201).json({
                message: `${service} token added successfully`,
                service,
                id,
                masked_token: maskToken(token)
              });
            }
          );
        }
      }
    );

  } catch (error) {
    console.error('Token encryption error:', error);
    res.status(500).json({ error: 'Failed to encrypt token' });
  }
});

// PUT /api/ai-tokens/:id/toggle - Toggle token active status
router.put('/:id/toggle', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.get(
    'SELECT is_active FROM ai_tokens WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, token) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      const newStatus = token.is_active === 1 ? 0 : 1;

      db.run(
        'UPDATE ai_tokens SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [newStatus, id, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error updating token status' });
          }

          res.json({
            message: `Token ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
            is_active: newStatus === 1
          });
        }
      );
    }
  );
});

// DELETE /api/ai-tokens/:id - Delete AI token
router.delete('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run(
    'DELETE FROM ai_tokens WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting token' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }

      res.json({ message: 'Token deleted successfully' });
    }
  );
});

// POST /api/ai-tokens/test - Test token connection
router.post('/test', async (req, res) => {
  const { service, token } = req.body;

  if (!service || !token) {
    return res.status(400).json({ error: 'Service and token are required' });
  }

  try {
    const result = await llmService.testConnection(service, token);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Test failed: ${error.message}`,
      provider: service
    });
  }
});

// GET /api/ai-tokens/links - Get signup links for all services
router.get('/links', (req, res) => {
  res.json({
    services: [
      {
        name: 'groq',
        display_name: 'Groq',
        description: 'Ultra-fast LLaMA 2 70B inference (up to 500 tokens/sec)',
        signup_url: 'https://console.groq.com/keys',
        cost: 'FREE',
        models: ['LLaMA 2 70B', 'Mixtral 8x7B', 'Gemma 7B'],
        recommended: true,
        speed: 'fastest'
      },
      {
        name: 'huggingface',
        display_name: 'Hugging Face',
        description: 'Access to 400,000+ open source models',
        signup_url: 'https://huggingface.co/settings/tokens',
        cost: 'FREE',
        models: ['Mistral 7B', 'LLaMA 2', 'Falcon', 'BLOOM'],
        recommended: true,
        speed: 'medium'
      },
      {
        name: 'together',
        display_name: 'Together AI',
        description: 'Fast inference for 100+ open source models',
        signup_url: 'https://api.together.xyz/settings/api-keys',
        cost: '$0.20 per million tokens',
        models: ['LLaMA 2 70B', 'Mistral', 'CodeLlama'],
        recommended: false,
        speed: 'fast'
      },
      {
        name: 'openrouter',
        display_name: 'OpenRouter',
        description: 'Unified API for 100+ models from multiple providers',
        signup_url: 'https://openrouter.ai/keys',
        cost: 'Varies by model',
        models: ['LLaMA 2', 'Mistral', 'Claude', 'GPT-4'],
        recommended: false,
        speed: 'medium'
      },
      {
        name: 'anthropic',
        display_name: 'Anthropic Claude',
        description: 'Claude 3 family - state-of-the-art reasoning',
        signup_url: 'https://console.anthropic.com/settings/keys',
        cost: '$3-$75 per million tokens',
        models: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
        recommended: false,
        speed: 'fast'
      }
    ],
    instructions: {
      groq: [
        '1. Visit https://console.groq.com/keys',
        '2. Sign in or create a free account',
        '3. Click "Create API Key"',
        '4. Copy the key (starts with "gsk_")',
        '5. Paste it here and click "Save & Test"'
      ],
      huggingface: [
        '1. Visit https://huggingface.co/settings/tokens',
        '2. Log in or create a free account',
        '3. Click "New token"',
        '4. Select "Read" permission',
        '5. Copy the token (starts with "hf_")',
        '6. Paste it here and click "Save & Test"'
      ],
      together: [
        '1. Visit https://api.together.xyz/settings/api-keys',
        '2. Create an account',
        '3. Add payment method (required)',
        '4. Generate API key',
        '5. Copy and paste here'
      ],
      openrouter: [
        '1. Visit https://openrouter.ai/keys',
        '2. Sign in with Google or email',
        '3. Click "Create Key"',
        '4. Set monthly budget (optional)',
        '5. Copy the key (starts with "sk-or-")',
        '6. Paste it here'
      ]
    }
  });
});

// GET /api/ai-tokens/status - Get overall AI service status
router.get('/status', async (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT service, is_active, last_used FROM ai_tokens WHERE user_id = ?',
    [userId],
    (err, tokens) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching status' });
      }

      const status = {
        total_tokens: tokens.length,
        active_tokens: tokens.filter(t => t.is_active === 1).length,
        services: {},
        has_free_token: false,
        ready_for_ai: false
      };

      tokens.forEach(token => {
        status.services[token.service] = {
          configured: true,
          active: token.is_active === 1,
          last_used: token.last_used
        };
      });

      // Check if user has at least one free service token (Groq or HuggingFace)
      status.has_free_token = tokens.some(t =>
        (t.service === 'groq' || t.service === 'huggingface') && t.is_active === 1
      );

      status.ready_for_ai = status.active_tokens > 0;

      res.json(status);
    }
  );
});

module.exports = router;
