import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChatWidget from './ChatWidget/ChatWidget';
import axios from '../axiosConfig';

const InteractiveWhiteboard = () => {
  // WCAG AA Compliant Color System - InteractiveWhiteboard
  const colors = {
    light: {
      // Primary Colors from Reference Image
      creamWhite: '#faf5f5',      // Background
      warmIvory: '#f5f3f0',       // Secondary background
      parchment: '#e6e3dd',       // Borders and dividers
      antiqueGold: '#c9a96e',     // Accent color
      forestGreen: '#4a5d4a',     // Primary
      charcoal: '#2c2c2c',        // Primary text (WCAG AA: 12.6:1 contrast)

      // UI Application
      primary: '#4a5d4a',         // Forest Green
      secondary: '#6b7355',       // Aged Brass
      cream: '#faf5f5',           // Background
      coral: '#c9a96e',           // Antique Gold (accent)
      coralHover: '#b8956a',      // Darker antique gold
      yellow: '#c9a96e',          // Unified accent
      text: '#2c2c2c',            // High contrast text
      textSecondary: '#4a5d4a',   // Secondary text (WCAG AA: 7.8:1 contrast)
      background: '#faf5f5',      // Main background
      backgroundAlt: '#f5f3f0',   // Alternative background
      card: '#ffffff',            // Card background
      cardHover: '#f5f3f0',       // Card hover
      border: '#e6e3dd',          // Borders
      buttonText: '#ffffff',      // Button text
      shadow: 'rgba(44, 44, 44, 0.08)'
    },
    dark: {
      // Dark Colors from Reference Image
      deepBlack: '#1a1a1a',       // Background
      richCharcoal: '#252525',    // Secondary background
      slateGray: '#404040',       // Borders and dividers
      antiqueGoldDark: '#c9a96e', // Accent (same as light)
      mutedSage: '#5a6b5a',       // Primary
      softCream: '#e6e3dd',       // Primary text (WCAG AA: 11.8:1 contrast)

      // UI Application
      primary: '#5a6b5a',         // Muted Sage
      secondary: '#6d5a47',       // Worn Leather
      cream: '#1a1a1a',           // Background
      coral: '#c9a96e',           // Antique Gold
      coralHover: '#b8956a',      // Darker antique gold
      yellow: '#c9a96e',          // Unified accent
      text: '#e6e3dd',            // High contrast text
      textSecondary: '#c9a96e',   // Secondary text (WCAG AA: 6.2:1 contrast)
      background: '#1a1a1a',      // Main background
      backgroundAlt: '#252525',   // Alternative background
      card: '#252525',            // Card background
      cardHover: '#2a2a2a',       // Card hover
      border: '#404040',          // Borders
      buttonText: '#e6e3dd',      // Button text
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  };

  // State management
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : false;
  });
  
  // Whiteboard specific states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // pen, pencil, eraser
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState('#1e3d59'); // Default to primary color
  const [whiteboards, setWhiteboards] = useState([]);
  const [currentWhiteboard, setCurrentWhiteboard] = useState({
    id: 'default',
    name: 'Untitled Whiteboard',
    content: null,
    lastModified: new Date().toISOString()
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;

  // Tool colors
  const toolColors = [
    theme.primary, // Blue
    theme.coral,   // Coral
    theme.yellow,  // Yellow
    '#4CAF50',     // Green
    '#9C27B0',     // Purple
    '#000000',     // Black
    '#FF0000',     // Red
    '#FF9800'      // Orange
  ];

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Initialize canvas
  useEffect(() => {
    const initializeCanvas = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          setError('Failed to initialize canvas context');
          return;
        }

        // Set canvas size to fill container
        const container = canvas.parentElement;
        if (!container) {
          setError('Canvas container not found');
          return;
        }

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Set canvas background based on theme
        context.fillStyle = theme.card;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restore saved canvas content if available
        if (currentWhiteboard.content) {
          const image = new Image();
          image.onload = () => {
            context.drawImage(image, 0, 0);
          };
          image.src = currentWhiteboard.content;
        }
      }
    };

    initializeCanvas();

    // Add resize event listener
    const handleResize = () => {
      if (canvasRef.current) {
        // Save current canvas content
        const tempContent = canvasRef.current.toDataURL();
        
        // Resize canvas
        const container = canvasRef.current.parentElement;
        const minWidth = 300;
        const minHeight = 200;
        const width = Math.max(container.clientWidth, minWidth);
        const height = Math.max(container.clientHeight, minHeight);
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        // Restore content
        const context = canvasRef.current.getContext('2d');
        if (!context) {
          setError('Failed to restore canvas context');
          return;
        }

        const image = new Image();
        image.onload = () => {
          context.fillStyle = theme.card;
          context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          context.drawImage(image, 0, 0);
        };
        image.src = tempContent;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentWhiteboard.content, theme]);

  // Load whiteboards from backend
  useEffect(() => {
    const fetchWhiteboards = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/whiteboards');
        if (response.data && Array.isArray(response.data)) {
          setWhiteboards(response.data);
          
          // If there are whiteboards, set the most recent one as current
          if (response.data.length > 0) {
            const sortedBoards = [...response.data].sort((a, b) => 
              new Date(b.lastModified) - new Date(a.lastModified)
            );
            setCurrentWhiteboard(sortedBoards[0]);
          }
        }
      } catch (error) {
        setError('Failed to fetch whiteboards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWhiteboards();
  }, []);

  // Handle mouse events for drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
    
    // Set line style based on tool
    context.lineWidth = lineWidth;
    context.lineCap = tool === 'pencil' ? 'round' : 'square';
    context.lineJoin = 'round';
    
    if (tool === 'eraser') {
      context.strokeStyle = theme.card; // Match canvas background for eraser
      context.lineWidth = lineWidth * 2; // Bigger eraser
    } else {
      context.strokeStyle = color;
    }
    
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
    
    if (tool === 'pencil') {
      // Add texture for pencil
      const opacity = 0.1;
      const stepSize = 1;
      const jitter = 0.5;
      
      for (let i = 0; i < 3; i++) {
        context.globalAlpha = opacity;
        context.beginPath();
        context.moveTo(
          x + (Math.random() - 0.5) * jitter, 
          y + (Math.random() - 0.5) * jitter
        );
        context.lineTo(
          x + (Math.random() - 0.5) * jitter + stepSize, 
          y + (Math.random() - 0.5) * jitter + stepSize
        );
        context.stroke();
      }
      
      context.globalAlpha = 1;
    }
  };

  const endDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.closePath();
    setIsDrawing(false);
    
    // Save current state for undo functionality (would be implemented in a real app)
    updateCurrentWhiteboard({
      ...currentWhiteboard,
      content: canvas.toDataURL(),
      lastModified: new Date().toISOString()
    });
  };

  // Update current whiteboard
  const updateCurrentWhiteboard = (updatedBoard) => {
    setCurrentWhiteboard(updatedBoard);
  };

  // Save whiteboard to backend
  const saveWhiteboard = async () => {
    if (!canvasRef.current) return;
    
    setIsSaving(true);
    setError(null);
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    
    // Update whiteboard object
    const updatedWhiteboard = {
      ...currentWhiteboard,
      content: imageData,
      lastModified: new Date().toISOString()
    };
    
    try {
      if (currentWhiteboard.id === 'default') {
        // Create new whiteboard
        const response = await axios.post('/api/whiteboards', updatedWhiteboard);
        setCurrentWhiteboard(response.data);
        setWhiteboards([...whiteboards, response.data]);
      } else {
        // Update existing whiteboard
        await axios.put(`/api/whiteboards/${currentWhiteboard.id}`, updatedWhiteboard);
        // Update the whiteboard in the list
        setWhiteboards(whiteboards.map(board => 
          board.id === currentWhiteboard.id ? updatedWhiteboard : board
        ));
      }
      
      showNotificationWithMessage('Whiteboard saved successfully!');
    } catch (error) {
      setError('Failed to save whiteboard. Please try again.');
      
      // For demo purposes, still update local state
      const newId = `local-${Date.now()}`;
      const localSavedBoard = {
        ...updatedWhiteboard,
        id: currentWhiteboard.id === 'default' ? newId : currentWhiteboard.id
      };
      
      setCurrentWhiteboard(localSavedBoard);
      if (currentWhiteboard.id === 'default') {
        setWhiteboards([...whiteboards, localSavedBoard]);
      } else {
        setWhiteboards(whiteboards.map(board => 
          board.id === currentWhiteboard.id ? localSavedBoard : board
        ));
      }
      
      showNotificationWithMessage('Whiteboard saved locally (backend connection failed)');
    } finally {
      setIsSaving(false);
    }
  };

  // Create new whiteboard
  const createNewWhiteboard = () => {
    // Save current board first
    if (currentWhiteboard.content) {
      saveWhiteboard();
    }
    
    // Create new whiteboard
    const newBoard = {
      id: 'default',
      name: `Untitled Whiteboard ${whiteboards.length + 1}`,
      content: null,
      lastModified: new Date().toISOString()
    };
    
    setCurrentWhiteboard(newBoard);
    
    // Clear canvas
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = theme.card;
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Load a whiteboard
  const loadWhiteboard = (board) => {
    setCurrentWhiteboard(board);
    
    // Load content to canvas
    if (canvasRef.current && board.content) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const image = new Image();
      image.onload = () => {
        context.fillStyle = theme.card;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
      };
      image.src = board.content;
    }
  };

  // Clear whiteboard
  const clearWhiteboard = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.fillStyle = theme.card;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update current whiteboard
      updateCurrentWhiteboard({
        ...currentWhiteboard,
        content: canvas.toDataURL(),
        lastModified: new Date().toISOString()
      });
    }
  };

  // Rename whiteboard
  const renameWhiteboard = () => {
    const newName = prompt('Enter a new name for the whiteboard:', currentWhiteboard.name);
    if (newName && newName.trim() !== '') {
      updateCurrentWhiteboard({
        ...currentWhiteboard,
        name: newName.trim()
      });
    }
  };

  // Show notification
  const showNotificationWithMessage = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div style={{ 
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: theme.background,
      color: theme.text,
      minHeight: '100vh',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      position: 'relative',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.card,
        boxShadow: `0 2px 8px ${theme.shadow}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{ 
            color: theme.text, 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '14px',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: theme.coral,
            }
          }}>
            ← Dashboard
          </Link>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ 
              backgroundColor: `${theme.primary}15`, 
              color: theme.primary,
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: `0 2px 6px ${theme.shadow}`,
            }}>
              🖌️
            </span>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: theme.primary,
            }}>
              {currentWhiteboard.name}
            </h1>
            <button
              onClick={renameWhiteboard}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: theme.textSecondary,
                padding: '8px',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${theme.border}50`,
                }
              }}
              title="Rename whiteboard"
            >
              ✏️
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleDarkMode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${theme.border}50`,
              }
            }}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 65px)',
      }}>
        {/* Sidebar for saved whiteboards */}
        <div style={{
          width: '260px',
          borderRight: `1px solid ${theme.border}`,
          backgroundColor: darkMode ? `${theme.card}` : `${theme.card}dd`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          boxShadow: `2px 0 8px ${theme.shadow}`,
          zIndex: 1,
        }}>
          <button
            onClick={createNewWhiteboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: theme.coral,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '20px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
              boxShadow: `0 2px 8px ${theme.shadow}`,
              '&:hover': {
                backgroundColor: theme.coralHover,
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(1px)',
              }
            }}
          >
            + New Whiteboard
          </button>
          
          <div style={{ 
            marginBottom: '12px', 
            fontSize: '14px', 
            color: theme.textSecondary,
            fontWeight: '500',
            padding: '0 4px',
          }}>
            Your Whiteboards
          </div>
          
          <div style={{
            overflowY: 'auto',
            flex: 1,
            marginRight: '-8px',
            paddingRight: '8px',
          }}>
            {loading && <div className="whiteboard-loading">Loading whiteboards...</div>}
            {error && <div className="whiteboard-error">{error}</div>}
            {whiteboards.length === 0 ? (
              <div style={{
                padding: '16px',
                fontSize: '14px',
                color: theme.textSecondary,
                textAlign: 'center',
                backgroundColor: `${theme.backgroundAlt}80`,
                borderRadius: '8px',
                border: `1px dashed ${theme.border}`,
              }}>
                No saved whiteboards yet.
                <br />
                Create a new one to get started!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {whiteboards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => loadWhiteboard(board)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: currentWhiteboard.id === board.id ? 
                        `${theme.backgroundAlt}` : 
                        darkMode ? `${theme.card}90` : 'transparent',
                      border: `1px solid ${currentWhiteboard.id === board.id ? 
                        theme.border : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: currentWhiteboard.id === board.id ? 
                        `0 2px 8px ${theme.shadow}20` : 'none',
                      '&:hover': {
                        backgroundColor: currentWhiteboard.id === board.id ? 
                          `${theme.backgroundAlt}` : 
                          `${theme.backgroundAlt}50`,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <div style={{ 
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {board.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: theme.textSecondary,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>{new Date(board.lastModified).toLocaleDateString()}</span>
                      <span>{new Date(board.lastModified).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Main Canvas Area */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Floating Toolbar */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            backgroundColor: theme.card,
            padding: '10px',
            borderRadius: '16px',
            boxShadow: `0 4px 20px ${theme.shadow}`,
            zIndex: 10,
            gap: '8px',
            transition: 'all 0.3s ease',
            opacity: 0.9,
            '&:hover': {
              opacity: 1,
              transform: 'translateX(-50%) translateY(-2px)',
              boxShadow: `0 8px 30px ${theme.shadow}`,
            },
          }}>
            {/* Tool Selection */}
            <div style={{
              display: 'flex',
              gap: '4px',
              borderRight: `1px solid ${theme.border}`,
              paddingRight: '12px',
            }}>
              <button
                onClick={() => setTool('pen')}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: tool === 'pen' ? 
                    `${theme.coral}20` : 
                    'transparent',
                  color: tool === 'pen' ? theme.coral : theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: tool === 'pen' ? 
                      `${theme.coral}30` : 
                      `${theme.backgroundAlt}80`,
                    transform: 'translateY(-1px)',
                  }
                }}
                title="Pen"
              >
                ✍️
              </button>
              
              <button
                onClick={() => setTool('pencil')}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: tool === 'pencil' ? 
                    `${theme.coral}20` : 
                    'transparent',
                  color: tool === 'pencil' ? theme.coral : theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: tool === 'pencil' ? 
                      `${theme.coral}30` : 
                      `${theme.backgroundAlt}80`,
                    transform: 'translateY(-1px)',
                  }
                }}
                title="Pencil"
              >
                ✏️
              </button>
              
              <button
                onClick={() => setTool('eraser')}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: tool === 'eraser' ? 
                    `${theme.coral}20` : 
                    'transparent',
                  color: tool === 'eraser' ? theme.coral : theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: tool === 'eraser' ? 
                      `${theme.coral}30` : 
                      `${theme.backgroundAlt}80`,
                    transform: 'translateY(-1px)',
                  }
                }}
                title="Eraser"
              >
                🧽
              </button>
            </div>
            
            {/* Color Selection */}
            <div style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              paddingLeft: '12px',
              paddingRight: '12px',
              borderRight: `1px solid ${theme.border}`,
            }}>
              {toolColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: color === c ? 
                      `2px solid ${theme.coral}` : 
                      `1px solid ${theme.border}`,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: color === c ? 
                      `0 2px 8px ${theme.shadow}` : 
                      'none',
                    '&:hover': {
                      transform: color === c ? 
                        'scale(1.15)' : 
                        'scale(1.05)',
                      boxShadow: `0 2px 6px ${theme.shadow}`,
                    }
                  }}
                  title={c}
                />
              ))}
            </div>
            
            {/* Line Width */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '12px',
              paddingRight: '12px',
              borderRight: `1px solid ${theme.border}`,
            }}>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                style={{
                  width: '100px',
                  accentColor: theme.coral,
                }}
              />
              <span style={{ 
                fontSize: '14px', 
                minWidth: '24px',
                textAlign: 'center',
                fontWeight: '500',
              }}>
                {lineWidth}
              </span>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: '4px', paddingLeft: '12px' }}>
              <button
                onClick={clearWhiteboard}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: `${theme.backgroundAlt}80`,
                    transform: 'translateY(-1px)',
                    color: '#e74c3c',
                  }
                }}
                title="Clear whiteboard"
              >
                🗑️
              </button>
              
              <button
                onClick={saveWhiteboard}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: `${theme.backgroundAlt}80`,
                    transform: 'translateY(-1px)',
                    color: theme.coral,
                  }
                }}
                title="Save whiteboard"
              >
                💾
              </button>
            </div>
          </div>
          
          {/* Canvas Container */}
          <div style={{ 
            flex: 1, 
            padding: '20px',
            position: 'relative',
          }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseOut={endDrawing}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                backgroundColor: theme.card,
                boxShadow: `0 4px 16px ${theme.shadow}`,
                touchAction: 'none',
                transition: 'box-shadow 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Notification */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: theme.primary,
          color: 'white',
          padding: '14px 24px',
          borderRadius: '12px',
          boxShadow: `0 4px 16px ${theme.shadow}`,
          zIndex: 1000,
          animation: 'fadeInUp 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '500',
        }}>
          <span style={{ fontSize: '18px' }}>✓</span>
          {notificationMessage}
        </div>
      )}
      
      {/* ChatWidget */}
      <ChatWidget />
      
      {/* Add CSS animations */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default InteractiveWhiteboard; 