import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';
import './AIChat.css';

function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI financial assistant. Ask me about your spending, income, savings, bills, or net worth!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAPI.chat(input);
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(response.data.timestamp)
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'How much did I spend last month?',
    'What\'s my total income?',
    'What\'s my net worth?',
    'How much am I saving?',
    'Show me my bills'
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          className="ai-chat-button"
          onClick={() => setIsOpen(true)}
          title="AI Financial Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 13.82 2.59 15.49 3.58 16.89L2.05 21.71C1.97 21.95 2.05 22.2 2.25 22.39C2.38 22.51 2.55 22.58 2.72 22.58C2.79 22.58 2.87 22.57 2.94 22.55L7.76 21.02C9.16 22.01 10.83 22.6 12.65 22.6C18.17 22.6 22.65 18.12 22.65 12.6C22.65 6.48 18.17 2 12.65 2H12Z" fill="currentColor"/>
            <circle cx="8" cy="12" r="1.5" fill="white"/>
            <circle cx="12" cy="12" r="1.5" fill="white"/>
            <circle cx="16" cy="12" r="1.5" fill="white"/>
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div>
              <h3>AI Financial Assistant</h3>
              <span className="ai-chat-status">Online</span>
            </div>
            <button
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
              title="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-chat-message ${message.role}`}
              >
                <div className="ai-chat-message-content">
                  {message.content}
                </div>
                <div className="ai-chat-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-chat-message assistant">
                <div className="ai-chat-message-content">
                  <div className="ai-chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="ai-chat-quick-questions">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Try asking:
              </p>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="ai-chat-quick-question"
                  onClick={() => {
                    setInput(question);
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-chat-input-container">
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Ask me anything about your finances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className="ai-chat-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 10L17.5 2.5L10 17.5L8.33333 11.6667L2.5 10Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChat;
