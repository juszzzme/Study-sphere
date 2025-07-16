import React, { createContext, useState, useEffect } from 'react';
import axios from '../axiosConfig';

export const ChatWidgetContext = createContext();

export const ChatWidgetProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : false;
  });

  // Load messages from localStorage when widget opens
  useEffect(() => {
    if (isOpen) {
      try {
        const savedMessages = localStorage.getItem('chatWidgetMessages');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          // Add welcome message
          const welcomeMessage = {
            id: 'welcome-1',
            sender: 'system',
            text: 'Welcome to StudySphere Chat! How can we help you today?',
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
          localStorage.setItem('chatWidgetMessages', JSON.stringify([welcomeMessage]));
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load message history');
      }
    }
  }, [isOpen]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatWidgetMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Handle sending new messages
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Create message
      const userMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      // Add message to UI
      setMessages([...messages, userMessage]);
      setNewMessage('');

      // Send to backend
      await axios.post('/api/chat/messages', {
        content: userMessage.text,
        sender: 'user'
      });

      // Get system response
      const response = await axios.get('/api/chat/response', {
        params: { message: userMessage.text }
      });

      // Add system response
      const systemMessage = {
        id: `resp-${Date.now()}`,
        sender: 'system',
        text: response.data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Clear chat
  const clearChat = () => {
    const welcomeMessage = {
      id: 'welcome-1',
      sender: 'system',
      text: 'Welcome to StudySphere Chat! How can we help you today?',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('chatWidgetMessages', JSON.stringify([welcomeMessage]));
  };

  return (
    <ChatWidgetContext.Provider value={{
      isOpen,
      setIsOpen,
      messages,
      newMessage,
      setNewMessage,
      loading,
      error,
      isDarkMode,
      handleSendMessage,
      clearChat
    }}>
      {children}
    </ChatWidgetContext.Provider>
  );
};
