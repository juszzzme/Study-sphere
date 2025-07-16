import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from '../axiosConfig';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import '../css/ChatRoom.css'; // We'll create this file later

const ChatRoom = () => {
  // Get the room ID from URL params
  const { roomId } = useParams();
  
  // Use socket and auth contexts
  const { socket, connected, emit } = useSocket();
  const { user } = useAuth();

  // Color schemes
  const colors = {
    light: {
      primary: '#1e3d59',
      cream: '#f5f0e1',
      coral: '#ff6e40',
      yellow: '#ffc13b',
      text: '#333',
      background: '#f5f0e1',
      card: '#fff',
      border: '#eaeaea',
      buttonText: '#fff',
      messageText: '#333',
      secondaryText: '#666'
    },
    dark: {
      primary: '#5d89ba', // Lightened primary color for dark mode
      cream: '#2d2d2d',
      coral: '#ff6e40',
      yellow: '#ffc13b',
      text: '#e0e0e0',
      background: '#1a1a1a',
      card: '#2d2d2d',
      border: '#3d3d3d',
      buttonText: '#fff',
      messageText: '#e0e0e0',
      secondaryText: '#aaa'
    }
  };

  // Get dark mode preference from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;

  // Chat room data (expanded mock data)
  const chatRooms = {
    'math': {
      name: 'Maths',
      color: '#4CAF50',
      icon: '📐',
      members: ['Zaheer', 'Charan', 'Priya', 'Sriram']
    },
    'design': {
      name: 'Design Project',
      color: '#9C27B0',
      icon: '🎨',
      members: ['Ganesh', 'Charan', 'Vamsi', 'Reddy']
    },
    'general': {
      name: 'General Chat',
      color: '#2196F3',
      icon: '💬',
      members: ['Everyone']
    },
    'coding': {
      name: 'Coding Help',
      color: '#FF9800',
      icon: '💻',
      members: ['Alex', 'Jordan', 'Sam', 'Taylor']
    }
  };

  // Current room
  const currentRoom = chatRooms[roomId] || {
    name: 'Unknown Room',
    color: '#999',
    icon: '❓',
    members: []
  };

  // UI States
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isReplying, setIsReplying] = useState(null);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Add new state for real-time features
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMessageAnimation, setNewMessageAnimation] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  
  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Join chat room when component mounts or room changes
  useEffect(() => {
    if (connected && roomId) {
      // Join the room
      emit('join_room', roomId);
      
      // Listen for new messages
      socket.on('new_message', (message) => {
        // Add animation class to new messages
        const animatedMessage = {
          ...message,
          isNew: true
        };
        
        setMessages(prev => [...prev, animatedMessage]);
        setFilteredMessages(prev => [...prev, animatedMessage]);
        
        // Clear the "new" flag after animation completes
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => msg.id === message.id ? { ...msg, isNew: false } : msg)
          );
          setFilteredMessages(prev => 
            prev.map(msg => msg.id === message.id ? { ...msg, isNew: false } : msg)
          );
        }, 1000);
      });
      
      // Listen for reactions
      socket.on('new_reaction', (reaction) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === reaction.messageId 
              ? { 
                  ...msg, 
                  reactions: [...(msg.reactions || []), { 
                    emoji: reaction.emoji, 
                    userId: reaction.userId 
                  }] 
                } 
              : msg
          )
        );
        setFilteredMessages(prev => 
          prev.map(msg => 
            msg.id === reaction.messageId 
              ? { 
                  ...msg, 
                  reactions: [...(msg.reactions || []), { 
                    emoji: reaction.emoji, 
                    userId: reaction.userId 
                  }] 
                } 
              : msg
          )
        );
      });
      
      // Listen for typing indicators
      socket.on('user_typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });
      
      // Listen for users joining/leaving
      socket.on('user_joined', (data) => {
        setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), { 
          userId: data.userId, 
          timestamp: data.timestamp 
        }]);
        
        // Show notification
        setNewMessageAnimation({
          type: 'joined',
          userId: data.userId,
          timestamp: data.timestamp
        });
        
        // Clear notification after timeout
        setTimeout(() => setNewMessageAnimation(null), 3000);
      });
      
      socket.on('user_left', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        
        // Show notification
        setNewMessageAnimation({
          type: 'left',
          userId: data.userId,
          timestamp: data.timestamp
        });
        
        // Clear notification after timeout
        setTimeout(() => setNewMessageAnimation(null), 3000);
      });
      
      // Cleanup when leaving the room
      return () => {
        emit('leave_room', roomId);
        socket.off('new_message');
        socket.off('new_reaction');
        socket.off('user_typing');
        socket.off('user_joined');
        socket.off('user_left');
      };
    }
  }, [connected, roomId, socket, emit]);

  // Handle typing indicator with debounce
  const handleTyping = () => {
    if (connected) {
      emit('typing', { roomId, isTyping: true });
      
      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to clear typing status
      const timeout = setTimeout(() => {
        emit('typing', { roomId, isTyping: false });
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  // Update message input handler to trigger typing indicator
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/chat/messages/${roomId}?limit=50`);
        const fetchedMessages = response.data.map(msg => {
          // Safely handle sender data which might be in different formats
          let senderName = 'Unknown User';
          if (msg.sender) {
            if (typeof msg.sender === 'object') {
              // Extract name from sender object, with fallbacks
              senderName = msg.sender.name || 
                (msg.sender.email ? msg.sender.email.split('@')[0] : 'Unknown User');
            } else if (typeof msg.sender === 'string') {
              senderName = msg.sender;
            }
          }
          
          return {
            id: msg._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: senderName,
            text: msg.text || msg.content || '',
            timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
            reactions: msg.reactions || [],
            replyTo: msg.replyTo
          };
        });
        
        setMessages(fetchedMessages);
        setFilteredMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Fallback to empty messages if API fails
        setMessages([]);
        setFilteredMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (roomId) {
      fetchMessages();
    }
  }, [roomId]);

  // Filter messages when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(msg => 
        msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchTerm, messages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Modified function to handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    emit('typing', { roomId, isTyping: false });
    
    // Prepare message data - ensure we use both content and text fields for compatibility
    const messageData = {
      roomId,
      text: message,
      content: message, // Add content field to match backend expectation
      replyTo: isReplying ? isReplying.id : null,
      senderName: user?.name || 'You',
      senderEmail: user?.email || 'user@example.com'
    };
    
    // Create temporary message for immediate display
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: 'You',
      text: message,
      content: message, // Add content field for consistency
      timestamp: new Date().toISOString(),
      reactions: [],
      replyTo: isReplying,
      isNew: true,
      pending: true
    };
    
    // Add to UI immediately for better UX
    setMessages([...messages, tempMessage]);
    setFilteredMessages([...messages, tempMessage]);
    setMessage('');
    setIsReplying(null);
    
    // Use Socket.IO for real-time
    if (connected) {
      console.log('Sending message via socket:', messageData);
      emit('send_message', messageData);
      
      // Update UI to remove pending status
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? { ...msg, pending: false } : msg
          )
        );
        setFilteredMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? { ...msg, pending: false } : msg
          )
        );
      }, 500);
    } else {
      // Fallback to REST API if socket not connected
      try {
        const response = await axios.post('/api/chat/messages', {
          roomId,
          text: message,
          content: message, // Add content field to match backend expectation
          replyTo: isReplying ? isReplying.id : null
        });
        
        // Update message with server data
        const serverMessage = response.data;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { 
                  ...msg, 
                  id: serverMessage._id,
                  pending: false 
                } 
              : msg
          )
        );
        setFilteredMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { 
                  ...msg, 
                  id: serverMessage._id,
                  pending: false 
                } 
              : msg
          )
        );
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Show error state for the message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { 
                  ...msg, 
                  error: true,
                  pending: false 
                } 
              : msg
          )
        );
        setFilteredMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { 
                  ...msg, 
                  error: true,
                  pending: false 
                } 
              : msg
          )
        );
      }
    }
  };

  // Update handleReaction to use Socket.IO
  const handleReaction = async (messageId, emoji) => {
    // Using Socket.IO for real-time reactions
    if (connected) {
      emit('message_reaction', {
        messageId,
        roomId,
        emoji
      });
    } else {
      // Fallback to optimistic update if socket not connected
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), {
              emoji,
              userId: user?._id || 'local-user'
            }]
          };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
      setFilteredMessages(
        searchTerm.trim() === ''
          ? updatedMessages
          : updatedMessages.filter(msg => 
              msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
              msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
            )
      );
    }
  };

  // Handle replying to a message
  const handleReply = (messageId) => {
    setIsReplying(messageId);
    messageInputRef.current?.focus();
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Common emojis for reactions
  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🤔', '👀', '🙏', '💯'];

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <div className="typing-indicator">
        <span className="dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </span>
        <span>
          {typingUsers.length === 1 
            ? 'Someone is typing...' 
            : `${typingUsers.length} people are typing...`}
        </span>
      </div>
    );
  };

  // Replace the message rendering part with this enhanced version
  const renderMessage = (msg) => {
    const isCurrentUser = msg.sender === 'You' || msg.sender?._id === user?._id;
    const messageClasses = [
      'message',
      isCurrentUser ? 'message-sent' : 'message-received',
      msg.isNew ? 'message-new' : '',
      msg.pending ? 'message-pending' : '',
      msg.error ? 'message-error' : ''
    ].filter(Boolean).join(' ');
    
    // Check if this is a reply
    const replyingTo = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
    
    return (
      <div key={msg.id} className={messageClasses}>
        {replyingTo && (
          <div className="reply-content">
            <div className="reply-indicator">↩ Reply to {replyingTo.sender}</div>
            <div className="reply-text">{replyingTo.text.substring(0, 50)}{replyingTo.text.length > 50 ? '...' : ''}</div>
          </div>
        )}
        <div className="message-header">
          <span className="message-sender">{msg.sender}</span>
          <span className="message-time">{formatTime(msg.timestamp)}</span>
        </div>
        <div className="message-content">{msg.text}</div>
        
        <div className="message-footer">
          <div className="message-reactions">
            {(msg.reactions || []).map((reaction, index) => (
              <span key={index} className="reaction">{reaction.emoji}</span>
            ))}
          </div>
          
          <div className="message-actions">
            <button 
              className="action-button emoji-button" 
              onClick={() => showEmojiPicker && setShowEmojiPicker(msg.id)}>
              😊
            </button>
            <button 
              className="action-button reply-button" 
              onClick={() => handleReply(msg)}>
              ↩️
            </button>
          </div>
        </div>
        
        {showEmojiPicker === msg.id && (
          <div className="emoji-picker">
            {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
              <button 
                key={emoji} 
                onClick={() => {
                  handleReaction(msg.id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="emoji-option">
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add notification for users joining/leaving
  const renderUserNotification = () => {
    if (!newMessageAnimation) return null;
    
    return (
      <div className={`user-notification ${newMessageAnimation.type}`}>
        <span>{newMessageAnimation.type === 'joined' ? '👋 User joined the chat' : '👋 User left the chat'}</span>
      </div>
    );
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: theme.background,
      color: theme.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.card,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/chat-rooms" style={{ 
            color: theme.text, 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center',
            marginRight: '20px',
            fontSize: '14px',
          }}>
            ← Back to Rooms
          </Link>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontWeight: '600', 
            fontSize: '18px', 
            color: currentRoom.color 
          }}>
            <span style={{ 
              marginRight: '10px',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: currentRoom.color + '20', // 12% opacity
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              {currentRoom.icon}
            </span>
            {currentRoom.name} Chat Room
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            🔍
          </button>
          
          {/* Members Toggle */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              position: 'relative',
            }}
          >
            👥
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: theme.coral,
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {currentRoom.members.length}
            </span>
          </button>
          
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Search Bar (conditionally rendered) */}
      {showSearch && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: theme.card,
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.background,
              color: theme.text,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Chat Messages Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}>
          {filteredMessages.map(msg => renderMessage(msg))}
          
          {renderTypingIndicator()}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Members Sidebar (conditionally rendered) */}
        {showMembers && (
          <div style={{
            width: '200px',
            backgroundColor: theme.card,
            borderLeft: `1px solid ${theme.border}`,
            padding: '15px',
            overflowY: 'auto',
          }}>
            <h3 style={{
              fontSize: '16px',
              marginBottom: '15px',
              color: theme.text,
            }}>
              Members ({currentRoom.members.length})
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {currentRoom.members.map((member, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: typeof member === 'string' && member.length > 0 ? `hsl(${member.charCodeAt(0) * 10}, 70%, 60%)` : theme.yellow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                  }}>
                    {typeof member === 'string' && member.length > 0 ? member[0] : '?'}
                  </div>
                  <span style={{
                    fontSize: '14px',
                  }}>
                    {member}
                    {member === 'You' && ' (You)'}
                  </span>
                  
                  {/* Online indicator */}
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: Math.random() > 0.3 ? '#4CAF50' : '#999',
                    marginLeft: 'auto',
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply preview (conditionally rendered) */}
      {isReplying && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: theme.card,
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{
              color: theme.secondaryText,
              fontSize: '14px',
            }}>
              Replying to:
            </span>
            <span style={{
              color: theme.text,
              fontSize: '14px',
              fontStyle: 'italic',
            }}>
              {messages.find(m => m.id === isReplying)?.text ? messages.find(m => m.id === isReplying).text.substring(0, 50) : 'Message not found'}
              {messages.find(m => m.id === isReplying)?.text && messages.find(m => m.id === isReplying).text.length > 50 ? '...' : ''}
            </span>
          </div>
          <button
            onClick={() => setIsReplying(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: theme.secondaryText,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Message Input Area */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          padding: '15px 20px',
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.card,
        }}
      >
        <input
          ref={messageInputRef}
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder={isReplying ? "Type your reply..." : "Type your message..."}
          style={{
            flex: 1,
            padding: '12px 15px',
            borderRadius: '4px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.background,
            color: theme.text,
            fontSize: '15px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={message.trim() === ''}
          style={{
            marginLeft: '10px',
            padding: '12px 20px',
            backgroundColor: message.trim() === '' ? theme.border : theme.coral,
            color: message.trim() === '' ? theme.secondaryText : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: message.trim() === '' ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s ease',
          }}
        >
          Send
        </button>
      </form>

      {renderUserNotification()}
    </div>
  );
};

export default ChatRoom;
