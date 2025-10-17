/**
 * Enterprise AI Configuration for Timu Financial Growth Tracker
 *
 * This configuration supports multiple AI providers and models based on research
 * of what tech leaders are using in 2025:
 *
 * OPEN-SOURCE LLM OPTIONS:
 * 1. DeepSeek R1 - Reasoning model for complex financial calculations
 * 2. Qwen 2.5 (72B) - Excellent for structured outputs, multilingual, math
 * 3. Llama 3.3 (70B) - Meta's flagship, great general-purpose model
 * 4. Mistral Large - 123B params, excellent coding & agentic capabilities
 * 5. Gemma 2 - Google's lightweight but powerful model
 *
 * AGENTIC AI FRAMEWORKS:
 * 1. LangGraph - Production-ready (14k stars, 4.2M downloads/month)
 * 2. Microsoft Agent Framework - Enterprise-grade, AutoGen + Semantic Kernel
 * 3. OpenAI Agents SDK - Provider-agnostic, works with 100+ LLMs
 * 4. CrewAI - Multi-agent collaboration
 *
 * ARCHITECTURE DECISION:
 * - Use LangGraph for agent orchestration (proven in enterprise: Klarna, KPMG)
 * - Support multiple LLM providers (OpenAI, Anthropic, local models via Ollama)
 * - Enable MCP (Model Context Protocol) for external tool integration
 * - Implement RAG for personalized financial insights
 */

module.exports = {
  // Primary AI Provider Configuration
  provider: process.env.AI_PROVIDER || 'openai', // openai | anthropic | ollama | azure

  // Model Selection by Use Case
  models: {
    // For complex reasoning and financial analysis
    reasoning: {
      openai: 'gpt-4-turbo-preview',
      anthropic: 'claude-3-opus-20240229',
      ollama: 'deepseek-r1:70b', // Local deployment option
      azure: 'gpt-4'
    },

    // For quick insights and chat responses
    chat: {
      openai: 'gpt-4-turbo-preview',
      anthropic: 'claude-3-sonnet-20240229',
      ollama: 'llama3.3:70b',
      azure: 'gpt-4'
    },

    // For structured data extraction and analysis
    structured: {
      openai: 'gpt-4-turbo-preview',
      anthropic: 'claude-3-sonnet-20240229',
      ollama: 'qwen2.5:72b', // Best for structured outputs
      azure: 'gpt-4'
    },

    // For embeddings (RAG/semantic search)
    embeddings: {
      openai: 'text-embedding-3-large',
      anthropic: null, // Anthropic doesn't provide embeddings
      ollama: 'nomic-embed-text',
      azure: 'text-embedding-3-large'
    }
  },

  // API Configuration
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    azure: process.env.AZURE_OPENAI_KEY
  },

  // Azure-specific configuration
  azure: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: '2024-02-15-preview',
    deployment: process.env.AZURE_DEPLOYMENT_NAME
  },

  // Ollama configuration (for local/self-hosted models)
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    models: {
      installed: [], // Will be populated by API call
      recommended: [
        'deepseek-r1:70b',  // For reasoning
        'qwen2.5:72b',       // For structured outputs
        'llama3.3:70b',      // General purpose
        'mistral-large',     // For agentic tasks
        'nomic-embed-text'   // For embeddings
      ]
    }
  },

  // Agent Configuration (LangGraph-style)
  agents: {
    // Financial Advisor Agent
    financialAdvisor: {
      name: 'Financial Advisor',
      description: 'Analyzes user financial data and provides personalized advice',
      model: 'reasoning',
      temperature: 0.3, // Lower for more consistent financial advice
      maxTokens: 2000,
      systemPrompt: `You are an expert financial advisor specializing in wealth growth strategies.
You analyze user financial data including net worth, income, expenses, and investments.
Provide actionable, personalized advice based on proven wealth-building principles used by high-net-worth individuals.
Always consider risk tolerance, current financial position, and growth potential.
Be specific with numbers and actionable steps.`
    },

    // Opportunity Scout Agent
    opportunityScout: {
      name: 'Opportunity Scout',
      description: 'Identifies wealth growth opportunities based on financial profile',
      model: 'reasoning',
      temperature: 0.5, // Moderate for creative but grounded suggestions
      maxTokens: 3000,
      systemPrompt: `You are a wealth growth opportunity analyst.
Identify concrete, actionable opportunities for users to increase their income and net worth.
Consider: investment opportunities, side businesses, passive income streams, skill development, real estate.
Each opportunity must include: title, description, initial investment, potential return, risk level, timeline, action steps.
Personalize recommendations based on user's current net worth, income, and financial goals.`
    },

    // Budget Analyzer Agent
    budgetAnalyzer: {
      name: 'Budget Analyzer',
      description: 'Analyzes spending patterns and suggests optimizations',
      model: 'structured',
      temperature: 0.2, // Very low for precise analysis
      maxTokens: 2000,
      systemPrompt: `You are a budget optimization specialist.
Analyze transaction data, identify spending patterns, find opportunities to reduce expenses.
Calculate metrics: savings rate, expense ratios, wasteful spending.
Provide specific, actionable recommendations with exact dollar amounts.
Format responses as structured data when possible.`
    },

    // Chat Assistant Agent
    chatAssistant: {
      name: 'Chat Assistant',
      description: 'Conversational financial assistant for user questions',
      model: 'chat',
      temperature: 0.7, // Higher for natural conversation
      maxTokens: 1500,
      systemPrompt: `You are a friendly, knowledgeable financial assistant.
Answer user questions about their finances, provide explanations, and offer guidance.
Use the user's actual financial data when available to give personalized responses.
Be conversational but professional. Use clear language, avoid jargon unless explaining it.
If you don't have enough information, ask clarifying questions.`
    }
  },

  // RAG (Retrieval-Augmented Generation) Configuration
  rag: {
    enabled: true,
    embeddingModel: 'embeddings',
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5, // Number of relevant documents to retrieve
    similarityThreshold: 0.7,
    vectorStore: 'memory' // 'memory' | 'chromadb' | 'pinecone' | 'weaviate'
  },

  // MCP (Model Context Protocol) Configuration
  mcp: {
    enabled: true,
    servers: [
      // Financial data MCP server
      {
        name: 'financial-data',
        description: 'Access to user financial data (transactions, accounts, budgets)',
        tools: [
          'get_transactions',
          'get_accounts',
          'get_net_worth',
          'get_income_summary',
          'get_budget_analysis'
        ]
      },
      // External financial APIs MCP server
      {
        name: 'market-data',
        description: 'Access to market data, stock prices, crypto prices',
        tools: [
          'get_stock_price',
          'get_crypto_price',
          'get_market_trends',
          'get_interest_rates'
        ]
      }
    ]
  },

  // Agentic Workflow Configuration
  workflows: {
    // Wealth Growth Analysis Workflow
    wealthGrowthAnalysis: {
      agents: ['financialAdvisor', 'opportunityScout'],
      steps: [
        'Gather user financial data',
        'Analyze current financial position',
        'Identify wealth growth opportunities',
        'Generate personalized action plan'
      ],
      maxIterations: 3
    },

    // Budget Optimization Workflow
    budgetOptimization: {
      agents: ['budgetAnalyzer', 'financialAdvisor'],
      steps: [
        'Analyze transaction history',
        'Identify spending patterns',
        'Calculate optimization opportunities',
        'Generate savings recommendations'
      ],
      maxIterations: 2
    },

    // Financial Health Check Workflow
    financialHealthCheck: {
      agents: ['financialAdvisor', 'budgetAnalyzer'],
      steps: [
        'Calculate financial health metrics',
        'Compare to benchmarks',
        'Identify risk areas',
        'Provide improvement recommendations'
      ],
      maxIterations: 2
    }
  },

  // Performance & Reliability
  performance: {
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour cache for AI responses
      maxSize: 100 // Max cached responses
    },
    rateLimit: {
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 500
    },
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  },

  // Security & Privacy
  security: {
    dataAnonymization: true, // Anonymize PII before sending to AI
    auditLogging: true, // Log all AI interactions
    userConsent: true, // Require user consent for AI features
    dataRetention: 30 // Days to retain AI interaction logs
  },

  // Cost Management
  costManagement: {
    budgetAlertThreshold: 100, // USD per month
    maxCostPerRequest: 0.50, // USD
    fallbackToLocalModel: true, // Fall back to Ollama if API costs too high
    trackUsagePerUser: true
  },

  // Feature Flags
  features: {
    chatAssistant: true,
    wealthGrowthOpportunities: true,
    budgetInsights: true,
    transactionCategorization: true,
    predictiveAnalytics: false, // Coming soon
    voiceAssistant: false, // Coming soon
    multiAgentCollaboration: true
  }
};
