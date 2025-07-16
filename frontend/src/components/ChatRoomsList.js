import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { Link } from 'react-router-dom';

const ChatRoomsList = () => {
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
      buttonText: '#fff'  // White text for buttons
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
      buttonText: '#fff'  // White text for buttons
    }
  };

  // Get dark mode preference from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : false;
  });
  
  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // State for chat rooms
  const [chatRooms, setChatRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Set fixed chat rooms as per requirement (only Math and Design Project)
  useEffect(() => {
    setIsLoading(true);
    // Only show two chat rooms as required
    setChatRooms([
      {
        id: 'math',
        name: 'Maths',
        color: '#4CAF50',
        icon: '📐'
      },
      {
        id: 'design',
        name: 'Design Project',
        color: '#9C27B0',
        icon: '🎨'
      }
    ]);
    setIsLoading(false);
  }, []);

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
        padding: '20px 40px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ 
            color: theme.text, 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center',
            marginRight: '20px',
            fontSize: '14px',
          }}>
            ← Dashboard
          </Link>
          <div style={{ fontWeight: '700', fontSize: '24px', color: theme.coral }}>
            Chat Rooms
          </div>
        </div>
        
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px' }}>
        <section>
          <h1 style={{ 
            marginTop: 0, 
            marginBottom: '10px', 
            color: theme.primary,
            fontSize: '28px' 
          }}>
            Study Chat Rooms
          </h1>
          <p style={{ 
            marginTop: 0, 
            marginBottom: '30px', 
            color: theme.text,
            opacity: 0.7,
            fontSize: '16px'
          }}>
            Join subject-specific chat rooms to connect with other students and discuss your studies.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '25px',
            maxWidth: '100%',
            margin: '0 auto',
          }}>
            {chatRooms.map(room => (
              <Link 
                key={room.id} 
                to={`/chat/${room.id}`} 
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  backgroundColor: theme.card,
                  borderRadius: '8px',
                  padding: '25px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  border: `1px solid ${theme.border}`,
                  borderLeft: `5px solid ${room.color}`,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    backgroundColor: room.color + '20', // 12% opacity
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '22px',
                  }}>
                    {room.icon}
                  </div>
                  <h3 style={{ 
                    margin: 0, 
                    color: theme.text,
                    fontSize: '18px',
                    fontWeight: '600',
                    flex: 1
                  }}>
                    {room.name}
                  </h3>
                  <div style={{
                    backgroundColor: room.color + '15', // 10% opacity
                    color: darkMode ? '#fff' : room.color, // Use white in dark mode, room color in light mode
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginLeft: '10px'
                  }}>
                    Join
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Chat functionality is available within individual chat rooms */}
    </div>
  );
};

export default ChatRoomsList;
