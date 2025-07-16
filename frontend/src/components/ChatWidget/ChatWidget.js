import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';
import { io } from 'socket.io-client';

const ChatWidget = ({ roomId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5006');
    setSocket(socketInstance);

    // Join room if roomId is provided
    if (roomId) {
      socketInstance.emit('joinRoom', roomId);
    }

    // Listen for new messages
    socketInstance.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Clean up
    return () => {
      socketInstance.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/chat/messages/${roomId}`);
        setMessages(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to fetch chat messages');
        setLoading(false);
      }
    };

    if (roomId) {
      fetchMessages();
    } else {
      // If no roomId is provided, set loading to false immediately
      setLoading(false);
    }
  }, [roomId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post('/api/chat/messages', {
        roomId,
        message: newMessage,
        userName
      });

      // Clear input
      setNewMessage('');

      // Emit message to other clients
      socket?.emit('sendMessage', {
        roomId,
        message: newMessage,
        userName,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Don't render anything if no roomId is provided
  if (!roomId) {
    return null;
  }

  if (loading) {
    return <div>Loading chat...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="chat-widget">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.userName === userName ? 'sent' : 'received'}`}>
            <div className="message-header">
              <span className="username">{message.userName}</span>
              <span className="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="message-content">{message.message}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!roomId}
        />
        <button type="submit" disabled={!newMessage.trim() || !roomId}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
