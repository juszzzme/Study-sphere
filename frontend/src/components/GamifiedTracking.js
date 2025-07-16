import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import '../css/GamifiedTracking.css';
import '../css/PomodoroHeatmap.css';
import { FaStar, FaTrophy, FaMedal, FaCrown, FaFire, FaHourglass, FaCalendarAlt } from 'react-icons/fa';
import { BiRefresh } from 'react-icons/bi';
import ThemeContext, { useTheme } from '../contexts/ThemeContext';
import PomodoroActivity from './PomodoroHeatmap';

// Chat widget styles
const chatStyles = {
  button: {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#ff6e40', // coral color
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: 99,
    fontSize: '24px',
    color: 'white',
    animation: 'pulse 2s ease infinite',
    transition: 'transform 0.3s ease, background-color 0.3s ease'
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ffc13b', // yellow color
    color: '#333',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    border: '2px solid white'
  },
  chatBox: {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '320px',
    height: '400px',
    backgroundColor: '#fff', // card color
    borderRadius: '16px',
    boxShadow: '0 5px 25px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 100,
    animation: 'slideUp 0.3s ease',
    border: '1px solid rgba(0,0,0,0.1)'
  },
  header: {
    padding: '15px',
    backgroundColor: '#1e3d59', // primary color
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  message: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff6e40', // coral color
    color: '#333', // text color
    padding: '10px 15px',
    borderRadius: '15px 15px 15px 0',
    maxWidth: '80%',
    wordBreak: 'break-word'
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff6e40', // coral color
    color: 'white',
    padding: '10px 15px',
    borderRadius: '15px 15px 0 15px',
    maxWidth: '80%',
    wordBreak: 'break-word'
  },
  input: {
    flex: 1,
    padding: '10px 15px',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: '20px',
    color: '#333', // text color
    outline: 'none'
  },
  sendButton: {
    backgroundColor: '#ff6e40', // coral color
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '10px',
    cursor: 'pointer',
    fontSize: '18px'
  }
};

const GamifiedTracking = () => {
  // Get theme from context
  const { theme, darkMode, toggleDarkMode } = useTheme();

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
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700'
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
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700'
    }
  };

  // Router navigation
  const navigate = useNavigate();

  // State management (darkMode is already available from useTheme hook above)
  // const [darkMode, setDarkMode] = useState(() => {
  //   const savedTheme = localStorage.getItem('darkMode');
  //   return savedTheme ? savedTheme === 'true' : false;
  // });
  const [userStats, setUserStats] = useState({
    studyHours: 0,
    streaks: 0,
    badges: [],
    lastStudyDate: null,
    level: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Chat widget state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'system', text: 'Welcome to StudySphere Chat! How can we help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Chat handlers
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      // Add user message
      const newMessage = {
        sender: 'user',
        text: chatInput.trim()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');

      // Send to backend
      await axios.post('/api/chat/messages', {
        content: chatInput.trim()
      });

      // Get system response
      const response = await axios.get('/api/chat/response', {
        params: { message: chatInput.trim() }
      });

      // Add system response
      setChatMessages(prev => [...prev, {
        sender: 'system',
        text: response.data.response
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, {
        sender: 'system',
        text: 'Sorry, there was an error sending your message. Please try again.'
      }]);
    }
  };

  // Mock badges data (in a real app, these would come from the backend)
  const badgeData = {
    '100-hours': {
      name: 'Century Scholar',
      description: 'Completed 100 hours of study',
      icon: '🕙',
      color: theme.bronze
    },
    '500-hours': {
      name: 'Dedicated Learner',
      description: 'Completed 500 hours of study',
      icon: '⏰',
      color: theme.silver
    },
    '1000-hours': {
      name: 'Master Scholar',
      description: 'Completed 1000 hours of study',
      icon: '🎓',
      color: theme.gold
    },
    '7-day-streak': {
      name: 'Weekly Warrior',
      description: 'Maintained a 7-day study streak',
      icon: '📅',
      color: theme.bronze
    },
    '30-day-streak': {
      name: 'Monthly Master',
      description: 'Maintained a 30-day study streak',
      icon: '📆',
      color: theme.silver
    },
    '100-day-streak': {
      name: 'Streak Centurion',
      description: 'Maintained a 100-day study streak',
      icon: '🔥',
      color: theme.gold
    },
    'pomodoro-beginner': {
      name: 'Pomodoro Novice',
      description: 'Completed 10 Pomodoro sessions',
      icon: '🍅',
      color: theme.bronze
    },
    'pomodoro-master': {
      name: 'Pomodoro Master',
      description: 'Completed 50 Pomodoro sessions',
      icon: '⏱️',
      color: theme.silver
    },
    'pomodoro-expert': {
      name: 'Pomodoro Expert',
      description: 'Completed 100 Pomodoro sessions',
      icon: '🎯',
      color: theme.gold
    }
  };

  // Calculate user level based on XP (simple formula for demonstration)
  const calculateLevel = (hours, streaks, pomodoros) => {
    // Convert hours to XP: 1 hour = 10 XP
    // Streaks to XP: 1 day streak = 5 XP
    // Pomodoros to XP: 1 pomodoro = 2 XP
    const xp = (hours * 10) + (streaks * 5) + (pomodoros * 2);
    
    // XP to level conversion (simple formula)
    // Level 1: 0-100 XP
    // Level 2: 101-300 XP
    // Level 3: 301-600 XP
    // Level 4: 601-1000 XP
    // Level 5+: 1000+ XP
    let level = 1;
    let currentXp = xp;
    let nextLevelXp = 100;
    
    if (xp > 1000) {
      level = 5 + Math.floor((xp - 1000) / 500);
      currentXp = (xp - 1000) % 500;
      nextLevelXp = 500;
    } else if (xp > 600) {
      level = 4;
      currentXp = xp - 600;
      nextLevelXp = 400;
    } else if (xp > 300) {
      level = 3;
      currentXp = xp - 300;
      nextLevelXp = 300;
    } else if (xp > 100) {
      level = 2;
      currentXp = xp - 100;
      nextLevelXp = 200;
    }
    
    const progress = (currentXp / nextLevelXp) * 100;
    
    return {
      level,
      currentXp,
      nextLevelXp: 1000,
      progress,
      totalXp: xp
    };
  };

  // Toggle menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Fetch user stats from API
  const fetchGamificationStats = async () => {
    try {
      setIsLoading(true);
      setError(null); // Always set error to null
      
      // Read local pomodoro sessions
      const localPomodoroSessions = localStorage.getItem('pomodoroSessions');
      const pomodoroCount = localPomodoroSessions ? parseInt(localPomodoroSessions, 10) : 0;
      
      // Generate mock data for demonstration
      const mockData = {
        studyHours: 120,
        streaks: 15,
        badges: ['100-hours', '7-day-streak', 'pomodoro-beginner'],
        lastStudyDate: new Date().toISOString(),
        level: 3,
        pomodoroSessions: Math.max(pomodoroCount, 20),
        // Add sample pomodoro heatmap data
        pomodoroData: [
          { date: '2025-03-01', count: 3 },
          { date: '2025-03-03', count: 5 },
          { date: '2025-03-05', count: 2 },
          { date: '2025-03-07', count: 4 },
          { date: '2025-03-10', count: 6 },
          { date: '2025-03-12', count: 2 },
          { date: '2025-03-15', count: 3 },
          { date: '2025-03-18', count: 7 },
          { date: '2025-03-20', count: 4 },
          { date: '2025-03-22', count: 5 },
          { date: '2025-03-25', count: 3 },
          { date: '2025-03-28', count: 4 },
          { date: '2025-04-01', count: 2 },
          { date: '2025-04-02', count: 3 },
          { date: '2025-04-04', count: 5 },
          { date: '2025-04-05', count: 8 },
          { date: '2025-04-06', count: 4 },
          { date: '2025-04-07', count: 6 },
        ]
      };
      
      // Use mock data instead of API call
      const response = { data: mockData };
      
      // For development: log the response
      console.log('Using mock data:', response.data);
      
      // Update state with mock data
      setUserStats({
        studyHours: response.data.studyHours,
        streaks: response.data.streaks,
        badges: response.data.badges,
        lastStudyDate: response.data.lastStudyDate,
        level: response.data.level,
        pomodoroSessions: response.data.pomodoroSessions
      });
      
      // Calculate achievements (for demonstration only)
      const earnedAchievements = [];
      
      // Hours achievements
      if (mockData.studyHours >= 100) earnedAchievements.push('100-hours');
      if (mockData.studyHours >= 500) earnedAchievements.push('500-hours');
      if (mockData.studyHours >= 1000) earnedAchievements.push('1000-hours');
      
      // Streak achievements
      if (mockData.streaks >= 7) earnedAchievements.push('7-day-streak');
      if (mockData.streaks >= 30) earnedAchievements.push('30-day-streak');
      if (mockData.streaks >= 100) earnedAchievements.push('100-day-streak');
      
      // Pomodoro achievements
      const pomodoros = mockData.pomodoroSessions;
      if (pomodoros >= 10) earnedAchievements.push('pomodoro-beginner');
      if (pomodoros >= 50) earnedAchievements.push('pomodoro-master');
      if (pomodoros >= 100) earnedAchievements.push('pomodoro-expert');
      
      // Update badges
      setUserStats(prev => ({
        ...prev,
        badges: earnedAchievements
      }));
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error in fetchGamificationStats:', err);
      
      // Use mock data as fallback
      const mockData = {
        studyHours: 120,
        streaks: 15,
        badges: ['100-hours', '7-day-streak', 'pomodoro-beginner'],
        lastStudyDate: new Date().toISOString(),
        level: 3,
        pomodoroSessions: 20,
        // Add sample pomodoro heatmap data
        pomodoroData: [
          { date: '2025-03-01', count: 3 },
          { date: '2025-03-03', count: 5 },
          { date: '2025-03-05', count: 2 },
          { date: '2025-03-07', count: 4 },
          { date: '2025-03-10', count: 6 },
          { date: '2025-03-12', count: 2 },
          { date: '2025-03-15', count: 3 },
          { date: '2025-03-18', count: 7 },
          { date: '2025-03-20', count: 4 },
          { date: '2025-03-22', count: 5 },
          { date: '2025-03-25', count: 3 },
          { date: '2025-03-28', count: 4 },
          { date: '2025-04-01', count: 2 },
          { date: '2025-04-02', count: 3 },
          { date: '2025-04-04', count: 5 },
          { date: '2025-04-05', count: 8 },
          { date: '2025-04-06', count: 4 },
          { date: '2025-04-07', count: 6 },
        ]
      };
      
      // Update with mock data even in error case
      setUserStats(mockData);
      setIsLoading(false);
      setError(null); // Set error to null to prevent error display
    }
  };
  
  // Fetch gamification stats on component mount
  useEffect(() => {
    fetchGamificationStats();
    
    // Refresh data periodically and when coming back to the page
    const refreshInterval = setInterval(fetchGamificationStats, 30000); // Every 30 seconds
    
    // Also refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchGamificationStats();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add event listener for Pomodoro completions
  useEffect(() => {
    const handlePomodoroCompleted = (event) => {
      // Refresh stats when a Pomodoro session is completed
      fetchGamificationStats();
    };
    
    window.addEventListener('pomodoroCompleted', handlePomodoroCompleted);
    
    return () => {
      window.removeEventListener('pomodoroCompleted', handlePomodoroCompleted);
    };
  }, []);

  // Update study hours
  const updateStudyHours = async (hours) => {
    try {
      const response = await axios.put('/api/gamification/study-hours', { hours });
      setUserStats({
        ...response.data,
        level: calculateLevel(response.data.studyHours, response.data.streaks, response.data.pomodoroSessions || 0).level
      });
      
      // Refresh stats to make sure everything is up to date
      fetchGamificationStats();
    } catch (err) {
      console.error('Error updating study hours:', err);
      // Use mock update for fallback
      setUserStats(prev => ({
        ...prev,
        studyHours: prev.studyHours + hours,
        level: calculateLevel(prev.studyHours + hours, prev.streaks, prev.pomodoroSessions || 0).level
      }));
    }
  };

  // Update streak
  const updateStreak = async () => {
    try {
      const response = await axios.put('/api/gamification/streak');
      setUserStats({
        ...response.data,
        level: calculateLevel(response.data.studyHours, response.data.streaks, response.data.pomodoroSessions || 0).level
      });
      
      // Refresh stats to make sure everything is up to date
      fetchGamificationStats();
    } catch (err) {
      console.error('Error updating streak:', err);
      // Use mock update for fallback
      const today = new Date();
      setUserStats(prev => ({
        ...prev,
        streaks: prev.streaks + 1,
        lastStudyDate: today.toISOString(),
        level: calculateLevel(prev.studyHours, prev.streaks + 1, prev.pomodoroSessions || 0).level
      }));
    }
  };

  // Manually refresh stats (for testing)
  const handleManualRefresh = () => {
    fetchGamificationStats();
  };

  // Go to SwipeMaster game
  const navigateToSwipeMaster = () => {
    navigate('/swipemaster');
  };

  // Get level and XP data
  const levelData = calculateLevel(
    userStats.studyHours, 
    userStats.streaks,
    userStats.pomodoroSessions || 0
  );

  return (
    <div className={`gamified-tracking ${darkMode ? 'dark-mode' : ''}`} style={{
      minHeight: '100vh',
      background: darkMode
        ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        : 'linear-gradient(135deg, #f5f0e1 0%, #fff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Add CSS for hover effects */}
      <style>{`
        .stat-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
        }
        .theme-toggle:hover {
          transform: scale(1.05) !important;
        }
        .back-link:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 6px 20px rgba(255,110,64,0.4) !important;
        }
        .action-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important;
        }
      `}</style>
      <div className="header" style={{
        background: darkMode
          ? 'linear-gradient(135deg, #1e3d59 0%, #2d4a6b 100%)'
          : 'linear-gradient(135deg, #1e3d59 0%, #2a4d73 100%)',
        padding: '2rem 3rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        borderBottom: `3px solid ${theme.coral}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: '700',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              background: 'linear-gradient(45deg, #fff, #ff6e40)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🎮 StudySphere Gamified Tracking
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.1rem',
              margin: '0.5rem 0 0 0',
              fontWeight: '300'
            }}>
              Level up your learning journey
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={toggleDarkMode}
              className="theme-toggle"
              style={{
                background: darkMode
                  ? 'linear-gradient(135deg, #ffc13b 0%, #ffb300 100%)'
                  : 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                color: darkMode ? '#333' : 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.5rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <Link
              to="/dashboard"
              className="back-link"
              style={{
                background: 'linear-gradient(135deg, #ff6e40 0%, #ff5722 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255,110,64,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-arrow-left"></i> Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* User Menu Overlay (similar to Dashboard) */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '300px',
          height: '100vh',
          backgroundColor: darkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.97)',
          boxShadow: '-5px 0 15px rgba(0,0,0,0.1)',
          zIndex: 1000,
          padding: '80px 30px 30px',
          transition: 'transform 0.3s ease',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        }}>
          {/* User Profile Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: theme.coral,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '15px',
              color: 'white',
              fontSize: '36px',
              fontWeight: 'bold',
            }}>
              U
            </div>
            <div style={{ fontWeight: '600', marginBottom: '5px', color: theme.text }}>
              User Name
            </div>
            <div style={{ fontSize: '14px', color: theme.text, opacity: 0.7, marginBottom: '10px' }}>
              user@example.com
            </div>
            <div style={{
              fontSize: '12px',
              padding: '3px 8px',
              backgroundColor: theme.yellow,
              color: '#333',
              borderRadius: '12px',
              fontWeight: '500',
            }}>
              Level {userStats.level}
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {['Profile', 'Settings', 'Logout'].map((item, index) => (
              <button
                key={index}
                onClick={() => alert(`${item} functionality will be implemented soon!`)}
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  padding: '12px 15px',
                  margin: '5px 0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: theme.text,
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        padding: '3rem 2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: darkMode
              ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)'
              : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '2rem',
              color: theme.primary,
              fontWeight: '600'
            }}>
              🚀 Loading your progress...
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto',
              border: `6px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderTop: `6px solid ${theme.coral}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px', 
            backgroundColor: theme.card,
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              fontSize: '22px', 
              marginBottom: '15px', 
              color: theme.coral,
              fontWeight: '600'
            }}>
              <span style={{ fontSize: '32px', marginRight: '10px' }}>⚠️</span>
              Connection Error
            </div>
            <div style={{ 
              fontSize: '16px', 
              marginBottom: '25px', 
              color: theme.text,
              maxWidth: '500px',
              margin: '0 auto 25px'
            }}>
              We couldn't connect to the server to fetch your latest stats. Your previous data is still available below.
            </div>
            <button 
              onClick={fetchGamificationStats}
              style={{
                backgroundColor: theme.coral,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 auto'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔄</span>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Level and XP Section */}
            <section style={{
              background: darkMode
                ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)'
                : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              borderRadius: '24px',
              padding: '3rem',
              marginBottom: '3rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                background: `linear-gradient(135deg, ${theme.coral}20, ${theme.yellow}20)`,
                borderRadius: '50%',
                opacity: 0.5
              }}></div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.yellow} 0%, #ffb300 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#333',
                  marginRight: '2rem',
                  boxShadow: '0 10px 30px rgba(255,193,59,0.4)',
                  border: '4px solid white',
                  position: 'relative'
                }}>
                  {levelData.level}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: theme.coral,
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(255,110,64,0.4)'
                  }}>
                    👑
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    margin: '0 0 1rem 0',
                    color: theme.primary,
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}>
                    Level {levelData.level} Scholar
                  </h2>
                  <div style={{
                    fontSize: '1.2rem',
                    color: theme.text,
                    opacity: 0.8,
                    marginBottom: '1.5rem',
                    fontWeight: '500'
                  }}>
                    {levelData.currentXp} / {levelData.nextLevelXp} XP to next level
                  </div>
                  <div style={{
                    width: '100%',
                    height: '16px',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '50px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: `${levelData.progress}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${theme.coral} 0%, #ff5722 100%)`,
                      borderRadius: '50px',
                      position: 'relative',
                      transition: 'width 0.8s ease-in-out'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: '10px',
                        transform: 'translateY(-50%)',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {Math.round(levelData.progress)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div className="stat-card" style={{
                  padding: '2rem',
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(255,110,64,0.1) 0%, rgba(255,110,64,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,110,64,0.05) 0%, rgba(255,110,64,0.02) 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `2px solid ${theme.coral}20`,
                  boxShadow: '0 10px 25px rgba(255,110,64,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `${theme.coral}10`,
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 1
                  }}>🕒</div>
                  <div style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: theme.text,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>Total Study Time</div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: theme.coral,
                    textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}>
                    {userStats.studyHours} hours
                  </div>
                </div>

                <div className="stat-card" style={{
                  padding: '2rem',
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(255,193,59,0.1) 0%, rgba(255,193,59,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,193,59,0.05) 0%, rgba(255,193,59,0.02) 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `2px solid ${theme.yellow}20`,
                  boxShadow: '0 10px 25px rgba(255,193,59,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `${theme.yellow}10`,
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 1
                  }}>🔥</div>
                  <div style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: theme.text,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>Current Streak</div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: theme.yellow,
                    textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}>
                    {userStats.streaks} days
                  </div>
                </div>

                <div className="stat-card" style={{
                  padding: '2rem',
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(30,61,89,0.1) 0%, rgba(30,61,89,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(30,61,89,0.05) 0%, rgba(30,61,89,0.02) 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `2px solid ${theme.primary}20`,
                  boxShadow: '0 10px 25px rgba(30,61,89,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `${theme.primary}10`,
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 1
                  }}>🏆</div>
                  <div style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: theme.text,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>Badges Earned</div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: theme.primary,
                    textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}>
                    {userStats.badges.length}
                  </div>
                </div>

                <div className="stat-card" style={{
                  padding: '2rem',
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(255,110,64,0.1) 0%, rgba(255,110,64,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,110,64,0.05) 0%, rgba(255,110,64,0.02) 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `2px solid ${theme.coral}20`,
                  boxShadow: '0 10px 25px rgba(255,110,64,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `${theme.coral}10`,
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 1
                  }}>🍅</div>
                  <div style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: theme.text,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>Pomodoro Sessions</div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: theme.coral,
                    textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}>
                    {userStats.pomodoroSessions || 0}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '3rem',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  className="action-button"
                  onClick={() => updateStudyHours(1)}
                  style={{
                    background: `linear-gradient(135deg, ${theme.coral} 0%, #ff5722 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '1rem 2rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 8px 25px rgba(255,110,64,0.3)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🕒</span>
                  Log Study Hours
                </button>

                <button
                  className="action-button"
                  onClick={updateStreak}
                  style={{
                    background: `linear-gradient(135deg, ${theme.yellow} 0%, #ffb300 100%)`,
                    color: '#333',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '1rem 2rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 8px 25px rgba(255,193,59,0.3)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🔥</span>
                  Check In Today
                </button>

                <Link to="/pomodoro" className="action-button" style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, #2a4d73 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 25px rgba(30,61,89,0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🍅</span>
                  Start Pomodoro
                </Link>
              </div>
            </section>

            {/* NEW: Interactive Games Section */}
            <section style={{
              backgroundColor: theme.card,
              borderRadius: '8px',
              padding: '30px',
              marginBottom: '40px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '30px', 
                color: theme.primary,
                fontSize: '22px' 
              }}>
                Interactive Learning Games
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '25px',
              }}>
                {/* SwipeMaster Game Card */}
                <div 
                  onClick={navigateToSwipeMaster}
                  style={{
                    backgroundColor: `${theme.primary}10`,
                    borderRadius: '8px',
                    padding: '20px',
                    border: `2px solid ${theme.primary}20`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    textAlign: 'center',
                    height: '200px',
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
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎮</div>
                  <h3 style={{ margin: '0 0 10px 0', color: theme.primary }}>
                    SwipeMaster
                  </h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
                    Truth or Trash Quiz Game
                  </p>
                  <button 
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.buttonText,
                      border: 'none',
                      borderRadius: '20px',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Play Now
                  </button>
                </div>
                
                {/* Coming Soon Game Card */}
                <div 
                  style={{
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    padding: '20px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    opacity: 0.7,
                    height: '200px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                  <h3 style={{ margin: '0 0 10px 0', color: theme.text }}>
                    Coming Soon
                  </h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
                    More games in development
                  </p>
                  <button 
                    style={{
                      backgroundColor: `${theme.primary}50`,
                      color: theme.buttonText,
                      border: 'none',
                      borderRadius: '20px',
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }}
                    disabled
                  >
                    Locked
                  </button>
                </div>
              </div>
            </section>
            
            {/* NEW: Pomodoro Activity Section */}
            <section style={{
              backgroundColor: theme.card,
              borderRadius: '8px',
              padding: '10px 15px',
              marginBottom: '40px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <h2 style={{ 
                  marginTop: 0, 
                  marginBottom: 0, 
                  color: theme.primary,
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaCalendarAlt style={{ opacity: 0.8 }} />
                    Pomodoro Activity Chart
                  </span>
                </h2>
                <span style={{ 
                  fontSize: '14px',
                  color: theme.primary,
                  opacity: 0.7,
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}>
                  {showHeatmap ? '▼' : '►'}
                </span>
              </div>
              
              {showHeatmap && (
                <div style={{ 
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  maxWidth: '550px',
                  margin: '0 auto',
                  background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                  boxShadow: 'inset 0 0 5px rgba(0,0,0,0.03)',
                  padding: '5px 0'
                }}>
                  <PomodoroActivity darkMode={darkMode} />
                </div>
              )}
            </section>

            {/* Badges Section */}
            <section>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '30px', 
                color: theme.primary,
                fontSize: '22px' 
              }}>
                Your Achievements
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '25px',
                marginBottom: '40px',
              }}>
                {Object.keys(badgeData).map(badgeId => {
                  const badge = badgeData[badgeId];
                  const earned = userStats.badges.includes(badgeId);
                  
                  return (
                    <div 
                      key={badgeId} 
                      style={{
                        backgroundColor: theme.card,
                        borderRadius: '8px',
                        padding: '20px',
                        border: `1px solid ${theme.border}`,
                        opacity: earned ? 1 : 0.4,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: earned ? badge.color + '30' : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '15px',
                        fontSize: '24px',
                      }}>
                        {badge.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: earned ? badge.color : theme.text }}>
                          {badge.name}
                        </h3>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          color: theme.text,
                          opacity: 0.7 
                        }}>
                          {badge.description}
                        </p>
                      </div>
                      {earned && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          backgroundColor: badge.color,
                          color: 'white',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Leaderboard Placeholder */}
            <section style={{
              backgroundColor: theme.card,
              borderRadius: '8px',
              padding: '30px',
              marginBottom: '40px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '20px', 
                color: theme.primary,
                fontSize: '22px' 
              }}>
                Global Leaderboard
              </h2>
              
              <p style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: theme.text,
                opacity: 0.7 
              }}>
                Leaderboard functionality coming soon! Compete with friends and fellow students to reach the top.
              </p>
            </section>
          </>
        )}
      </main>
      
      {/* Fixed Chat Widget from PomodoroTimer */}
      <div 
        onClick={toggleChat}
        style={chatStyles.button}
      >
        💬
        {!isChatOpen && (
          <div style={chatStyles.badge}>
            1
          </div>
        )}
      </div>

      {/* Chat Box */}
      {isChatOpen && (
        <div style={chatStyles.chatBox} >
          {/* Chat Header */}
          <div style={chatStyles.header}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span>💬</span> StudentChat
            </div>
            <button onClick={toggleChat} style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              width: '25px',
              height: '25px'
            }}>
              ×
            </button>
          </div>
          
          {/* Messages Container */}
          <div style={{
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {chatMessages.map((msg, index) => (
              <div style={msg.sender === 'user' ? chatStyles.userMessage : chatStyles.message}>
                {msg.text}
              </div>
            ))}
          </div>
          
          {/* Input Form */}
          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            padding: '10px',
            borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              style={chatStyles.input}
            />
            <button type="submit" style={chatStyles.sendButton}>
              →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default GamifiedTracking;
