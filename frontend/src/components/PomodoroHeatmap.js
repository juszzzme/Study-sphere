import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import '../css/PomodoroHeatmap.css';

const PomodoroActivity = ({ darkMode }) => {
  const [activityData, setActivityData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  
  // WCAG AA Compliant Color System - PomodoroHeatmap
  const colors = {
    light: {
      background: '#faf5f5',      // Cream White background
      text: '#2c2c2c',            // High contrast text (WCAG AA: 12.6:1)
      bars: ['#f5f3f0', '#e6e3dd', '#c9a96e', '#6b7355', '#4a5d4a'], // Gradient from warm ivory to forest green
      highlight: '#c9a96e',       // Antique Gold highlight
      gridLines: 'rgba(44, 44, 44, 0.1)'
    },
    dark: {
      background: '#1a1a1a',      // Deep Black background
      text: '#e6e3dd',            // High contrast text (WCAG AA: 11.8:1)
      bars: ['#252525', '#404040', '#6d5a47', '#c9a96e', '#5a6b5a'], // Gradient from charcoal to muted sage
      highlight: '#c9a96e',       // Antique Gold highlight
      gridLines: 'rgba(230, 227, 221, 0.1)'
    }
  };
  
  const theme = darkMode ? colors.dark : colors.light;

  // Function to fetch Pomodoro session data (mock data instead of API)
  const fetchPomodoroData = async () => {
    setIsLoading(true);
    try {
      // Generate mock data for demonstration - past 7 days
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const mockData = days.map(day => ({
        day,
        count: Math.floor(Math.random() * 8) + 1, // 1-8 sessions
        minutes: 0 // Will calculate below
      }));
      
      // Calculate minutes per day (25 mins per session)
      mockData.forEach(day => {
        day.minutes = day.count * 25;
      });
      
      setActivityData(mockData);
      setError(null);
    } catch (err) {
      console.error('Error with mock Pomodoro data:', err);
      // Even in case of error, provide mock data
      setActivityData([
        { day: 'Monday', count: 4, minutes: 100 },
        { day: 'Tuesday', count: 2, minutes: 50 },
        { day: 'Wednesday', count: 6, minutes: 150 },
        { day: 'Thursday', count: 3, minutes: 75 },
        { day: 'Friday', count: 5, minutes: 125 },
        { day: 'Saturday', count: 2, minutes: 50 },
        { day: 'Sunday', count: 1, minutes: 25 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPomodoroData();
  }, []);

  // Handle click on a day bar
  const handleBarClick = (day) => {
    setSelectedDay(day.day);
    
    // Mock day details instead of API call
    const mockDayDetails = {
      totalSessions: day.count,
      totalMinutes: day.minutes,
      sessions: Array.from({ length: day.count }, (_, i) => ({
        startTime: `2025-04-10T${10 + i}:00:00Z`,
        duration: 25,
        notes: i % 2 === 0 ? 'Study session' : 'Work on project'
      }))
    };
    
    setDayDetails(mockDayDetails);
  };

  // Calculate the maximum count for scaling
  const maxCount = activityData.length > 0 
    ? Math.max(...activityData.map(day => day.count))
    : 8;

  if (isLoading) {
    return <div className="pomodoro-activity-loading">Loading...</div>;
  }

  return (
    <div className="pomodoro-activity-container" style={{ color: theme.text, background: 'transparent' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '8px', marginTop: '2px', fontWeight: '500', textAlign: 'center' }}>
        Weekly Pomodoro Activity
      </h3>
      
      <div className="pomodoro-bar-graph">
        {/* Y-axis labels */}
        <div className="y-axis-labels">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="y-label">
              {Math.round((maxCount / 4) * (4 - i))}
            </div>
          ))}
        </div>
        
        {/* Grid lines */}
        <div className="grid-lines">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="grid-line" 
              style={{ 
                bottom: `${(i * 25)}%`, 
                borderColor: theme.gridLines 
              }}
            />
          ))}
        </div>
        
        {/* Bars */}
        <div className="bar-container">
          {activityData.map((day, index) => (
            <div 
              key={day.day} 
              className="day-bar-wrapper"
              onClick={() => handleBarClick(day)}
            >
              <div 
                className={`day-bar ${selectedDay === day.day ? 'selected' : ''}`}
                style={{ 
                  height: `${(day.count / maxCount) * 100}%`,
                  backgroundColor: selectedDay === day.day 
                    ? theme.highlight 
                    : theme.bars[index % theme.bars.length],
                  cursor: 'pointer'
                }}
                title={`${day.day}: ${day.count} sessions (${day.minutes} mins)`}
              />
              <div className="day-label">{day.day.slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="activity-legend">
        <span>Each bar represents the number of Pomodoro sessions completed that day</span>
      </div>
      
      {selectedDay && dayDetails && (
        <div className="day-details" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}` }}>
          <h4>{selectedDay}</h4>
          <p>{dayDetails.totalSessions} sessions ({dayDetails.totalMinutes} minutes)</p>
          <ul>
            {dayDetails.sessions.slice(0, 2).map((session, index) => (
              <li key={index}>
                {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                {session.notes && <span className="session-notes"> ({session.notes})</span>}
              </li>
            ))}
            {dayDetails.sessions.length > 2 && (
              <li style={{ fontStyle: 'italic', fontSize: '10px' }}>
                +{dayDetails.sessions.length - 2} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PomodoroActivity; 