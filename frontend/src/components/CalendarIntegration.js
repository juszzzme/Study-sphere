import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatWidget from './ChatWidget/ChatWidget';
import axios from 'axios';

const CalendarIntegration = () => {
  // WCAG AA Compliant Color System - CalendarIntegration
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
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarDays, setCalendarDays] = useState([]);
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;

  // Months array for display
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days of the week
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Calculate days for the current month view
  useEffect(() => {
    const days = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    setCalendarDays(days);
    fetchEventsForMonth();
  }, [currentMonth, currentYear]);
  
  // Fetch events for the current month
  const fetchEventsForMonth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Instead of redirecting, use mock data for unauthenticated users
        console.log('No authentication token found. Using mock data instead.');
        
        // Create mock events to simulate calendar functionality
        const mockEvents = {};
        
        // Add a few sample events
        const todayDate = new Date();
        if (currentMonth === todayDate.getMonth() && currentYear === todayDate.getFullYear()) {
          const today = todayDate.getDate();
          mockEvents[today] = [{
            _id: 'mock1',
            title: 'Design project review',
            notes: 'Final design project review.',
            date: new Date(currentYear, currentMonth, today).toISOString(),
            color: theme.coral
          }];
          
          // Add another event a few days later
          const futureDayOffset = Math.min(today + 3, new Date(currentYear, currentMonth + 1, 0).getDate());
          mockEvents[futureDayOffset] = [{
            _id: 'mock2',
            title: 'Home',
            notes: 'Need to catch train at 4:00 pm',
            date: new Date(currentYear, currentMonth, futureDayOffset).toISOString(),
            color: theme.yellow
          }];
        }
        
        setEvents(mockEvents);
        setLoading(false);
        showNotification('Using demo mode. Login to save your events!', 'info');
        return;
      }
      
      const response = await axios.get(
        `/api/calendar/month/${currentYear}/${currentMonth + 1}`,
        { headers: { 'x-auth-token': token } }
      );
      
      // Organize events by date for easy lookup
      const eventsByDate = {};
      response.data.forEach(event => {
        const date = new Date(event.date);
        const day = date.getDate();
        
        if (!eventsByDate[day]) {
          eventsByDate[day] = [];
        }
        
        eventsByDate[day].push(event);
      });
      
      setEvents(eventsByDate);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
      showNotification('Failed to fetch calendar events', 'error');
    }
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (day) => {
    if (!day) return; // Don't select empty cells
    
    setSelectedDate(day);
    const selectedEvents = events[day] || [];
    
    if (selectedEvents.length > 0) {
      // Pre-fill form with the first event
      const firstEvent = selectedEvents[0];
      setNoteTitle(firstEvent.title);
      setNoteContent(firstEvent.notes);
    } else {
      // Clear form for new event
      setNoteTitle('');
      setNoteContent('');
    }
  };
  
  // Save note for selected date
  const saveNote = async () => {
    if (!selectedDate || !noteTitle.trim()) {
      showNotification('Please select a date and enter a title', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        showNotification('Please login to save your notes', 'info');
        return;
      }
      
      const selectedEvents = events[selectedDate] || [];
      const date = new Date(currentYear, currentMonth, selectedDate);
      
      if (selectedEvents.length > 0) {
        // Update existing event
        const eventId = selectedEvents[0]._id;
        await axios.put(
          `/api/calendar/${eventId}`,
          {
            title: noteTitle,
            notes: noteContent,
            date: date.toISOString()
          },
          { headers: { 'x-auth-token': token } }
        );
      } else {
        // Create new event
        await axios.post(
          '/api/calendar',
          {
            title: noteTitle,
            notes: noteContent,
            date: date.toISOString()
          },
          { headers: { 'x-auth-token': token } }
        );
      }
      
      showNotification('Note saved successfully!', 'success');
      fetchEventsForMonth(); // Refresh events
      setLoading(false);
    } catch (error) {
      console.error('Error saving note:', error);
      setLoading(false);
      showNotification('Failed to save note', 'error');
    }
  };
  
  // Delete note for selected date
  const deleteNote = async () => {
    if (!selectedDate) {
      showNotification('Please select a date', 'error');
      return;
    }
    
    const selectedEvents = events[selectedDate] || [];
    if (selectedEvents.length === 0) {
      showNotification('No note to delete', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        showNotification('Please login to delete notes', 'info');
        return;
      }
      
      const eventId = selectedEvents[0]._id;
      await axios.delete(
        `/api/calendar/${eventId}`,
        { headers: { 'x-auth-token': token } }
      );
      
      showNotification('Note deleted successfully!', 'success');
      setNoteTitle('');
      setNoteContent('');
      fetchEventsForMonth(); // Refresh events
      setLoading(false);
    } catch (error) {
      console.error('Error deleting note:', error);
      setLoading(false);
      showNotification('Failed to delete note', 'error');
    }
  };
  
  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
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
      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'success' ? theme.coral : '#ff4d4d',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: `0 4px 15px ${theme.shadow}`,
          zIndex: 1000,
          animation: 'fadeInDown 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '500',
        }}>
          <span>{notification.type === 'success' ? '✓' : 'ⓧ'}</span>
          <span>{notification.message}</span>
        </div>
      )}
      
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.card,
        boxShadow: `0 2px 8px ${theme.shadow}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ 
            color: theme.text, 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center',
            marginRight: '20px',
            fontSize: '14px',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: theme.coral,
            }
          }}>
            ← Dashboard
          </Link>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '24px', 
            color: theme.coral,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ 
              backgroundColor: `${theme.coral}15`, 
              color: theme.coral,
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: `0 2px 6px ${theme.shadow}`,
            }}>📅</span>
            Calendar Integration
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
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '30px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Calendar Container */}
        <div style={{
          backgroundColor: theme.card,
          borderRadius: '16px',
          padding: '28px',
          boxShadow: `0 4px 20px ${theme.shadow}`,
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: `0 6px 24px ${theme.shadow}`,
          }
        }}>
          {/* Calendar Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            {/* Month Navigation */}
            <button
              onClick={goToPreviousMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: theme.primary,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${theme.backgroundAlt}80`,
                  transform: 'translateX(-2px)',
                }
              }}
            >
              ◀
            </button>
            
            <h2 style={{ 
              margin: '0',
              color: theme.primary,
              fontSize: '24px',
              fontWeight: '600',
            }}>
              {months[currentMonth]} {currentYear}
            </h2>
            
            <button
              onClick={goToNextMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: theme.primary,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${theme.backgroundAlt}80`,
                  transform: 'translateX(2px)',
                }
              }}
            >
              ▶
            </button>
          </div>
          
          {/* Weekday Labels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
            marginBottom: '10px',
          }}>
            {weekdays.map(day => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  padding: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: theme.textSecondary,
                }}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
          }}>
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => day && handleDateSelect(day)}
                style={{
                  height: '90px',
                  borderRadius: '12px',
                  border: selectedDate === day 
                    ? `2px solid ${theme.coral}` 
                    : `1px solid ${theme.border}`,
                  backgroundColor: selectedDate === day 
                    ? `${theme.backgroundAlt}` 
                    : theme.card,
                  cursor: day ? 'pointer' : 'default',
                  padding: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': day ? {
                    boxShadow: `0 4px 12px ${theme.shadow}20`,
                    transform: 'translateY(-2px)',
                    border: selectedDate === day 
                      ? `2px solid ${theme.coral}` 
                      : `1px solid ${theme.primary}60`
                  } : {},
                }}
              >
                {day && (
                  <>
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      left: '8px',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: theme.text,
                    }}>
                      {day}
                    </span>
                    
                    {/* Event dots */}
                    <div style={{
                      marginTop: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: 'center',
                    }}>
                      {events[day] && (
                        <div style={{
                          width: '100%',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}>
                          {events[day].map((event, i) => (
                            <div 
                              key={i}
                              style={{
                                backgroundColor: event.color || theme.coral,
                                color: 'white',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                boxShadow: `0 2px 4px ${theme.shadow}20`,
                                fontWeight: '500',
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Note Editor - Always below the calendar */}
        <div style={{
          backgroundColor: theme.card,
          borderRadius: '16px',
          padding: '28px',
          boxShadow: `0 4px 20px ${theme.shadow}`,
          animation: selectedDate ? 'fadeIn 0.3s ease' : 'none',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: `0 6px 24px ${theme.shadow}`,
          }
        }}>
          {selectedDate ? (
            <>
              <h2 style={{ 
                margin: '0 0 24px 0',
                color: theme.primary,
                fontSize: '20px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ 
                  backgroundColor: `${theme.primary}15`, 
                  color: theme.primary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}>📝</span>
                Notes for {months[currentMonth]} {selectedDate}, {currentYear}
              </h2>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px',
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <label 
                    htmlFor="noteTitle"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: theme.textSecondary,
                      fontWeight: '500',
                    }}
                  >
                    Title
                  </label>
                  <input
                    id="noteTitle"
                    type="text"
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="Add a title"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      backgroundColor: theme.background,
                      color: theme.text,
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      '&:focus': {
                        outline: 'none',
                        borderColor: theme.primary,
                        boxShadow: `0 0 0 3px ${theme.primary}30`,
                      }
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label 
                    htmlFor="noteContent"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: theme.textSecondary,
                      fontWeight: '500',
                    }}
                  >
                    Note
                  </label>
                  <textarea
                    id="noteContent"
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Add your notes here..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      backgroundColor: theme.background,
                      color: theme.text,
                      fontSize: '16px',
                      minHeight: '160px',
                      resize: 'vertical',
                      transition: 'all 0.2s ease',
                      '&:focus': {
                        outline: 'none',
                        borderColor: theme.primary,
                        boxShadow: `0 0 0 3px ${theme.primary}30`,
                      }
                    }}
                  />
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                justifyContent: 'flex-end' 
              }}>
                <button
                  onClick={deleteNote}
                  disabled={loading || !(events[selectedDate] && events[selectedDate].length > 0)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: theme.background,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    cursor: (loading || !(events[selectedDate] && events[selectedDate].length > 0)) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !(events[selectedDate] && events[selectedDate].length > 0)) ? 0.7 : 1,
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    '&:hover': (loading || !(events[selectedDate] && events[selectedDate].length > 0)) ? {} : {
                      backgroundColor: `${theme.backgroundAlt}80`,
                      borderColor: theme.text,
                    }
                  }}
                >
                  Delete
                </button>
                
                <button
                  onClick={saveNote}
                  disabled={loading || !noteTitle.trim()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: theme.coral,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (loading || !noteTitle.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !noteTitle.trim()) ? 0.7 : 1,
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 2px 8px ${theme.shadow}`,
                    '&:hover': (loading || !noteTitle.trim()) ? {} : {
                      backgroundColor: theme.coralHover,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${theme.shadow}`,
                    },
                    '&:active': (loading || !noteTitle.trim()) ? {} : {
                      transform: 'translateY(1px)',
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Save Note
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              textAlign: 'center',
              color: theme.textSecondary,
              gap: '16px',
            }}>
              <div style={{ 
                fontSize: '64px', 
                animation: 'pulse 2s infinite ease-in-out',
              }}>
                📆
              </div>
              <p style={{
                fontSize: '16px',
                maxWidth: '300px',
                lineHeight: 1.5,
              }}>
                Select a date in the calendar above to add or edit notes
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* ChatWidget */}
      <ChatWidget />
      
      {/* Add CSS animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CalendarIntegration; 