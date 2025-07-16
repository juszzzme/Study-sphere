import { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import './ChatRoom.css';
import ChatWidget from '../ChatWidget/ChatWidget';

// Create a socket connection
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5006', {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const ChatRoom = ({ roomId: propRoomId }) => {
  // Get the roomId from URL params or props for better reliability
  const { roomId: paramRoomId } = useParams();
  const roomId = paramRoomId || propRoomId; // Use either params or props
  
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
  
  // State variables
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const socketRef = useRef(socket);
  
  // UI States
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isReplying, setIsReplying] = useState(null);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Room details
  const [roomName, setRoomName] = useState('');  
  const [roomDescription, setRoomDescription] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);
  
  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;

  // Sample chat room data
  const chatRooms = {
    'math': {
      name: 'Maths',
      color: '#4CAF50',
      icon: '📐',
      members: ['Zaheer', 'Charan', 'Priya', 'Miguel']
    },
    'design': {
      name: 'Design Project',
      color: '#9C27B0',
      icon: '🎨',
      members: ['Sarah', 'James', 'Lily', 'Tomas']
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

  // Get current room info
  const currentRoom = chatRooms[roomId] || {
    name: roomName || 'Chat Room',
    color: '#2196F3',
    icon: '💬',
    members: roomMembers || []
  };

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.body.classList.toggle('dark-mode', newMode);
  };

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    }
    // Apply class to body
    document.body.classList.toggle('dark-mode', darkMode);
    
    // Clean up
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [darkMode]);

  // Common emojis for reactions
  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🤔', '👀', '🙏', '💯'];

  // Define fetchMessages function
  const fetchMessages = async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/chat/messages/${roomId}`);
      
      if (response.data && Array.isArray(response.data)) {
        // Convert backend messages to format needed by the new UI
        const formattedMessages = response.data.map(msg => {
          let senderName = 'Unknown';
          let senderId = undefined;
          if (msg.sender) {
            if (typeof msg.sender === 'object') {
              senderName = msg.sender.name || (msg.sender.email ? msg.sender.email.split('@')[0] : 'Unknown');
              senderId = msg.sender._id || msg.sender.id;
            } else if (typeof msg.sender === 'string') {
              senderName = msg.sender;
              senderId = msg.sender;
            }
          }
          return {
            id: msg._id,
            sender: senderName,
            text: msg.content,
            timestamp: msg.createdAt,
            reactions: [],
            senderId,
            isMine: senderId === user?.id
          };
        });
        
        setMessages(formattedMessages);
        setFilteredMessages(formattedMessages);
      } else {
        // Add sample messages if no data
        addSampleMessages();
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Using sample messages instead.');
      addSampleMessages();
    } finally {
      setLoading(false);
    }
  };

  // Add sample messages for reference
  const addSampleMessages = () => {
    const now = new Date();
    const sampleMessages = [
      {
        id: 'sample-1',
        sender: 'Zaheer',
        text: 'Welcome to the chat room! Ask any questions about your project here.',
        timestamp: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
        reactions: ['👍', '🙏'],
        senderId: 'instructor'
      },
      {
        id: 'sample-2',
        sender: 'Charan',
        text: "I'm having trouble understanding how to approach this problem. Can someone help?",
        timestamp: new Date(now.getTime() - 1800000).toISOString(), // 30 minutes ago
        reactions: [],
        senderId: 'student1'
      },
      {
        id: 'sample-3',
        sender: 'You',
        text: "I can help with that. Let's start by breaking down the problem into steps.",
        timestamp: new Date(now.getTime() - 900000).toISOString(), // 15 minutes ago
        reactions: ['👍'],
        senderId: user?.id,
        isMine: true
      },
      {
        id: 'sample-4',
        sender: 'Charan',
        text: "Thanks! I'm specifically confused about the second part.",
        timestamp: new Date(now.getTime() - 600000).toISOString(), // 10 minutes ago
        reactions: [],
        senderId: 'student1'
      },
      {
        id: 'sample-5',
        sender: 'Priya',
        text: "I had the same issue. The key is to work through it step by step. I can share my approach if that helps!",
        timestamp: new Date(now.getTime() - 300000).toISOString(), // 5 minutes ago
        reactions: ['💯'],
        senderId: 'student2'
      }
    ];
    
    setMessages(sampleMessages);
    setFilteredMessages(sampleMessages);
  };

  // Socket connection and event listeners
  useEffect(() => {
    const socket = socketRef.current;
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      
      // Join the room when connected
      if (roomId) {
        socket.emit('join_room', roomId);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });
    
    // Message events
    const handleReceiveMessage = (message) => {
      setMessages(prevMessages => {
        // Check if message already exists
        const messageExists = prevMessages.some(msg => msg.id === message.id || 
          (msg.tempId && msg.tempId === message.tempId));
        
        if (!messageExists) {
          return [...prevMessages, message];
        }
        return prevMessages.map(msg => 
          (msg.id === message.id || msg.tempId === message.tempId) ? message : msg
        );
      });
    };
    
    socket.on('receive_message', handleReceiveMessage);
    
    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Connection error');
    });
    
    // Connect to the socket
    socket.connect();
    
    // Clean up on unmount
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.disconnect();
    };
  }, [roomId]);
  
  // Join room when roomId changes
  useEffect(() => {
    if (roomId && isConnected) {
      socketRef.current.emit('join_room', roomId);
    }
  }, [roomId, isConnected]);

  // Fetch room details and messages
  useEffect(() => {
    if (!roomId) {
      setError('No room ID specified');
      setLoading(false);
      return;
    }

    // Function to fetch room details
    const fetchRoomDetails = async () => {
      try {
        const response = await axios.get(`/api/chat/room/${roomId}`);
        if (response.data) {
          setRoomName(response.data.name || 'Chat Room');
          setRoomDescription(response.data.description || '');
          if (response.data.members) {
            setRoomMembers(['You', ...response.data.members.filter(m => m !== user?.id)]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch room details:', err);
        // Don't set error state for this - non-critical
      }
    };

    // Initial fetch of messages and room details
    fetchRoomDetails();
    fetchMessages();
    
    // Set up polling for new messages
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
      }
    }, 5000); // Poll every 5 seconds when tab is visible
    
    // Clean up polling on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [roomId, user?.id]);
  
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
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);
  
  // Show connection status
  useEffect(() => {
    if (isConnected) {
      setError(null);
    } else {
      setError('Disconnected from server. Reconnecting...');
    }
  }, [isConnected]);

  // Handle message input change with typing indicator
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Clear typing timeout if it exists
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set typing indicator
    if (value.trim()) {
      setIsTyping(true);
      // Clear typing indicator after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      setTypingTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  };
  
  // Handle key press in message input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Handle sending a message
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }
    
    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      tempId,
      sender: user?.name || 'You',
      text: messageText,
      timestamp: new Date().toISOString(),
      senderId: user?.id,
      roomId,
      isMine: true,
      pending: true,
      replyTo: isReplying
    };
    
    // Optimistically add to UI
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setIsReplying(null);
    
    try {
      // Send via WebSocket for real-time
      socketRef.current.emit('send_message', {
        roomId,
        content: messageText,
        senderId: user?.id,
        tempId
      });
      
      // Also send via HTTP for persistence
      const response = await axios.post('/api/chat/messages', {
        content: messageText,
        roomId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update message with server response
      if (response.data?._id) {
        setMessages(prev => prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, id: response.data._id, tempId: undefined, pending: false }
            : msg
        ));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, failed: true, pending: false }
          : msg
      ));
    }
  }, [newMessage, roomId, user, isConnected, isReplying]);

  // Add reaction to message
  const handleReaction = (messageId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        // Add reaction if not already present
        if (!msg.reactions.includes(emoji)) {
          return { ...msg, reactions: [...msg.reactions, emoji] };
        }
        // Remove reaction if already present
        return { ...msg, reactions: msg.reactions.filter(r => r !== emoji) };
      }
      return msg;
    }));
    
    setFilteredMessages(filteredMessages.map(msg => {
      if (msg.id === messageId) {
        // Add reaction if not already present
        if (!msg.reactions.includes(emoji)) {
          return { ...msg, reactions: [...msg.reactions, emoji] };
        }
        // Remove reaction if already present
        return { ...msg, reactions: msg.reactions.filter(r => r !== emoji) };
      }
      return msg;
    }));
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
            {currentRoom.name}
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
          {loading && <div style={{ textAlign: 'center', padding: '20px', color: theme.secondaryText }}>Loading messages...</div>}
          
          {error && (
            <div className="chat-error">
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && filteredMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: theme.secondaryText }}>
              No messages yet. Start a conversation!
            </div>
          )}
          
          {filteredMessages.map(msg => (
            <div 
              key={msg.id} 
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '10px',
                opacity: msg.pending ? 0.7 : 1,
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: msg.sender === 'You' || msg.isMine ? theme.coral : `hsl(${msg.sender.charCodeAt(0) * 10}, 70%, 60%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}>
                {msg.sender[0]}
              </div>
              <div style={{
                maxWidth: '70%',
              }}>
                {/* Reply reference */}
                {msg.replyTo && (
                  <div style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: theme.background,
                    marginBottom: '5px',
                    borderLeft: `3px solid ${theme.coral}`,
                    fontSize: '13px',
                    color: theme.secondaryText,
                  }}>
                    {messages.find(m => m.id === msg.replyTo)?.text?.substring(0, 50)}
                    {messages.find(m => m.id === msg.replyTo)?.text?.length > 50 ? '...' : ''}
                  </div>
                )}
                
                <div style={{
                  backgroundColor: theme.card,
                  padding: '12px 15px',
                  borderRadius: '12px',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '5px',
                    color: msg.sender === 'You' || msg.isMine ? theme.coral : `hsl(${msg.sender.charCodeAt(0) * 10}, 70%, 60%)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    {msg.sender}
                    {msg.pending && (
                      <span style={{ fontSize: '11px', color: theme.secondaryText }}>
                        sending...
                      </span>
                    )}
                    {msg.failed && (
                      <span style={{ fontSize: '11px', color: 'red' }}>
                        failed to send
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    lineHeight: '1.5',
                  }}>
                    {msg.text}
                  </div>
                </div>
                
                {/* Reactions */}
                {msg.reactions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '5px',
                    marginTop: '5px',
                  }}>
                    {[...new Set(msg.reactions)].map(emoji => (
                      <span 
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        style={{
                          backgroundColor: theme.background,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${theme.border}`,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {emoji} {msg.reactions.filter(r => r === emoji).length}
                      </span>
                    ))}
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '5px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: theme.secondaryText,
                  }}>
                    {formatTime(msg.timestamp)}
                  </span>
                  
                  {/* Message actions */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                  }}>
                    <button
                      onClick={() => setShowEmojiPicker(msg.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: theme.secondaryText,
                      }}
                    >
                      😊
                    </button>
                    <button
                      onClick={() => handleReply(msg.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: theme.secondaryText,
                      }}
                    >
                      ↩️
                    </button>
                  </div>
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker === msg.id && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    padding: '5px',
                    backgroundColor: theme.card,
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    marginTop: '5px',
                    position: 'absolute',
                    zIndex: 10,
                  }}>
                    {commonEmojis.map(emoji => (
                      <span 
                        key={emoji}
                        onClick={() => {
                          handleReaction(msg.id, emoji);
                          setShowEmojiPicker(null);
                        }}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '10px',
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: theme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
              }}>
                ...
              </div>
              <div style={{
                backgroundColor: theme.card,
                padding: '10px 15px',
                borderRadius: '12px',
                fontSize: '14px',
              }}>
                Someone is typing...
              </div>
            </div>
          )}
          
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
                    backgroundColor: `hsl(${member.charCodeAt(0) * 10}, 70%, 60%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                  }}>
                    {member[0]}
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
              {messages.find(m => m.id === isReplying)?.text.substring(0, 50)}
              {messages.find(m => m.id === isReplying)?.text.length > 50 ? '...' : ''}
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
          value={newMessage}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={isReplying ? "Type your reply..." : "Type your message..."}
          disabled={!roomId || loading}
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
          disabled={newMessage.trim() === '' || !roomId || loading}
          style={{
            marginLeft: '10px',
            padding: '12px 20px',
            backgroundColor: newMessage.trim() === '' || !roomId || loading ? theme.border : theme.coral,
            color: newMessage.trim() === '' || !roomId || loading ? theme.secondaryText : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: newMessage.trim() === '' || !roomId || loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s ease',
          }}
        >
          Send
        </button>
      </form>

      {/* Conditionally render ChatWidget for specific room IDs */}
      {['student', 'math', 'design'].includes(roomId) && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <ChatWidget />
        </div>
      )}
    </div>
  );
};

export default ChatRoom;