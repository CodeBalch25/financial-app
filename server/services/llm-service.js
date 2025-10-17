const Groq = require('groq-sdk');
const axios = require('axios');
const db = require('../models/database');
const { decrypt } = require('../utils/encryption');

/**
 * LLM Service - Unified interface for multiple AI providers
 * Supports: Groq (FREE), Hugging Face (FREE), Together AI, OpenRouter
 */

class LLMService {
  constructor() {
    this.clients = {};
    this.lastProvider = null;
  }

  /**
   * Get decrypted tokens for a user
   * @param {string} userId
   * @returns {Promise<Object>} tokens by service name
   */
  async getUserTokens(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT service, token_encrypted FROM ai_tokens WHERE user_id = ? AND is_active = 1',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const tokens = {};
            rows.forEach(row => {
              try {
                tokens[row.service] = decrypt(row.token_encrypted);
              } catch (error) {
                console.error(`Failed to decrypt ${row.service} token:`, error.message);
              }
            });
            resolve(tokens);
          }
        }
      );
    });
  }

  /**
   * Update last used timestamp for a token
   * @param {string} userId
   * @param {string} service
   */
  async updateLastUsed(userId, service) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE ai_tokens SET last_used = CURRENT_TIMESTAMP WHERE user_id = ? AND service = ?',
        [userId, service],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Call Groq API (FREE - LLaMA 2 70B)
   * @param {string} token
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>} AI response
   */
  async callGroq(token, prompt, options = {}) {
    try {
      const groq = new Groq({ apiKey: token });

      const response = await groq.chat.completions.create({
        model: options.model || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful financial advisor assistant. Provide clear, actionable advice based on the data provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1500,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9
      });

      this.lastProvider = 'groq';
      return response.choices[0]?.message?.content || '';

    } catch (error) {
      console.error('Groq API error:', error.message);
      throw new Error(`Groq API failed: ${error.message}`);
    }
  }

  /**
   * Call Hugging Face Inference API (FREE)
   * @param {string} token
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>} AI response
   */
  async callHuggingFace(token, prompt, options = {}) {
    try {
      const model = options.model || 'meta-llama/Llama-3.2-3B-Instruct';
      const url = `https://api-inference.huggingface.co/models/${model}`;

      const response = await axios.post(
        url,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.9,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      this.lastProvider = 'huggingface';

      if (Array.isArray(response.data)) {
        return response.data[0]?.generated_text || '';
      } else if (response.data.generated_text) {
        return response.data.generated_text;
      } else {
        throw new Error('Unexpected response format from Hugging Face');
      }

    } catch (error) {
      console.error('Hugging Face API error:', error.message);
      throw new Error(`Hugging Face API failed: ${error.message}`);
    }
  }

  /**
   * Call Together AI API
   * @param {string} token
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>} AI response
   */
  async callTogether(token, prompt, options = {}) {
    try {
      const response = await axios.post(
        'https://api.together.xyz/v1/completions',
        {
          model: options.model || 'togethercomputer/llama-2-70b-chat',
          prompt: prompt,
          max_tokens: options.maxTokens || 1500,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      this.lastProvider = 'together';
      return response.data.choices[0]?.text || '';

    } catch (error) {
      console.error('Together AI API error:', error.message);
      throw new Error(`Together AI API failed: ${error.message}`);
    }
  }

  /**
   * Call OpenRouter API (unified interface for many models)
   * @param {string} token
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>} AI response
   */
  async callOpenRouter(token, prompt, options = {}) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: options.model || 'meta-llama/llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: options.systemPrompt || 'You are a helpful financial advisor assistant.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 1500,
          temperature: options.temperature || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://financial-app.local',
            'X-Title': 'Financial Growth Tracker'
          },
          timeout: 30000
        }
      );

      this.lastProvider = 'openrouter';
      return response.data.choices[0]?.message?.content || '';

    } catch (error) {
      console.error('OpenRouter API error:', error.message);
      throw new Error(`OpenRouter API failed: ${error.message}`);
    }
  }

  /**
   * Generate AI completion with automatic fallback
   * Priority: Groq (FREE) → Hugging Face (FREE) → Together → OpenRouter
   * @param {string} userId
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<Object>} { text, provider }
   */
  async generateCompletion(userId, prompt, options = {}) {
    const tokens = await this.getUserTokens(userId);

    // Priority order: Groq (fastest & free) → HuggingFace (free) → Together → OpenRouter
    const providers = [
      { name: 'groq', method: this.callGroq.bind(this) },
      { name: 'huggingface', method: this.callHuggingFace.bind(this) },
      { name: 'together', method: this.callTogether.bind(this) },
      { name: 'openrouter', method: this.callOpenRouter.bind(this) }
    ];

    let lastError = null;

    for (const provider of providers) {
      if (tokens[provider.name]) {
        try {
          console.log(`Attempting ${provider.name} API...`);
          const text = await provider.method(tokens[provider.name], prompt, options);
          await this.updateLastUsed(userId, provider.name);

          return {
            text: text.trim(),
            provider: provider.name,
            model: options.model || 'default',
            tokenCount: text.length / 4 // Rough estimate
          };

        } catch (error) {
          console.error(`${provider.name} failed:`, error.message);
          lastError = error;
          // Continue to next provider
          continue;
        }
      }
    }

    // All providers failed or no tokens available
    throw new Error(
      lastError
        ? `All AI providers failed. Last error: ${lastError.message}`
        : 'No AI tokens configured. Please add at least one token in AI Settings.'
    );
  }

  /**
   * Generate financial insights using AI
   * @param {string} userId
   * @param {Object} financialData
   * @returns {Promise<Object>} AI-generated insights
   */
  async generateFinancialInsights(userId, financialData) {
    const prompt = this.buildFinancialPrompt(financialData);

    const options = {
      systemPrompt: 'You are an expert financial advisor. Analyze the provided financial data and generate 3-5 specific, actionable insights. Focus on spending patterns, savings opportunities, and financial health. Format your response as a JSON array of insight objects with fields: type (warning/success/info), title, message, recommendation, and impact (high/medium/low).',
      maxTokens: 2000,
      temperature: 0.3 // Lower temperature for more consistent financial advice
    };

    const result = await this.generateCompletion(userId, prompt, options);

    try {
      // Try to parse as JSON
      const insightsText = result.text;
      const jsonMatch = insightsText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return {
          insights,
          provider: result.provider,
          generated_at: new Date().toISOString()
        };
      } else {
        // Fallback: parse natural language response
        return {
          insights: this.parseNaturalLanguageInsights(insightsText),
          provider: result.provider,
          generated_at: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to parse AI insights:', error.message);
      // Return raw text as single insight
      return {
        insights: [{
          type: 'info',
          title: 'AI Financial Analysis',
          message: result.text,
          recommendation: 'Review the analysis above for financial guidance.',
          impact: 'medium'
        }],
        provider: result.provider,
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Build a comprehensive financial prompt
   * @param {Object} data
   * @returns {string} formatted prompt
   */
  buildFinancialPrompt(data) {
    return `Analyze this financial data and provide specific insights:

INCOME:
- Monthly Income: $${data.income || 0}
- Income Sources: ${data.income_sources || 0}

EXPENSES:
- Monthly Expenses: $${data.expenses || 0}
- Top Categories: ${JSON.stringify(data.top_categories || [])}

SAVINGS:
- Savings Rate: ${data.savings_rate || 0}%
- Emergency Fund: $${data.emergency_fund || 0} (${data.months_of_expenses || 0} months)

NET WORTH:
- Total: $${data.net_worth || 0}
- Trend: ${data.net_worth_trend || 'N/A'}

BILLS:
- Monthly Bills: $${data.total_bills || 0}
- Average vs Target: ${data.bills_variance || 'N/A'}

Provide 3-5 actionable insights with specific recommendations.`;
  }

  /**
   * Parse natural language AI response into structured insights
   * @param {string} text
   * @returns {Array} insights
   */
  parseNaturalLanguageInsights(text) {
    const insights = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentInsight = null;

    lines.forEach(line => {
      // Look for numbered items or bullet points
      if (/^[\d\*\-\•]/.test(line)) {
        if (currentInsight) {
          insights.push(currentInsight);
        }
        currentInsight = {
          type: 'info',
          title: line.replace(/^[\d\*\-\•\.\)]\s*/, '').substring(0, 80),
          message: line,
          recommendation: '',
          impact: 'medium'
        };
      } else if (currentInsight) {
        currentInsight.message += ' ' + line;
      }
    });

    if (currentInsight) {
      insights.push(currentInsight);
    }

    return insights.length > 0 ? insights : [{
      type: 'info',
      title: 'AI Analysis',
      message: text,
      recommendation: 'Review the analysis for financial guidance.',
      impact: 'medium'
    }];
  }

  /**
   * Test API connection for a specific service
   * @param {string} service
   * @param {string} token
   * @returns {Promise<Object>} { success, message, model }
   */
  async testConnection(service, token) {
    const testPrompt = 'Hello! Please respond with "Connection successful" to confirm API access.';

    try {
      let response;

      switch (service) {
        case 'groq':
          response = await this.callGroq(token, testPrompt, { maxTokens: 50 });
          break;
        case 'huggingface':
          response = await this.callHuggingFace(token, testPrompt, { maxTokens: 50 });
          break;
        case 'together':
          response = await this.callTogether(token, testPrompt, { maxTokens: 50 });
          break;
        case 'openrouter':
          response = await this.callOpenRouter(token, testPrompt, { maxTokens: 50 });
          break;
        default:
          throw new Error('Unknown service');
      }

      return {
        success: true,
        message: 'Connection successful! Token is valid.',
        response: response.substring(0, 100),
        provider: service
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        provider: service
      };
    }
  }
}

// Export singleton instance
module.exports = new LLMService();
