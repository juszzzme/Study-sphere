import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axiosConfig';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';
import '../css/PomodoroTimer.css';

const PomodoroTimer = () => {
  // Audio reference for notification sounds
  const audioRef = useRef(null);

  // Get socket and auth context
  const { socket, connected, emit } = useSocket();
  const { user } = useAuth();

  // WCAG AA Compliant Color System - PomodoroTimer
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
      cream: '#faf5f5',           // Background
      coral: '#c9a96e',           // Accent (changed from coral to antique gold)
      yellow: '#c9a96e',          // Accent (unified with coral)
      text: '#2c2c2c',            // High contrast text
      background: '#faf5f5',      // Main background
      card: '#ffffff',            // Card background
      border: '#e6e3dd',          // Borders
      buttonText: '#ffffff'       // Button text
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
      cream: '#1a1a1a',           // Background
      coral: '#c9a96e',           // Accent
      yellow: '#c9a96e',          // Accent (unified)
      text: '#e6e3dd',            // High contrast text
      background: '#1a1a1a',      // Main background
      card: '#252525',            // Card background
      border: '#404040',          // Borders
      buttonText: '#e6e3dd'       // Button text
    }
  };

  // Default timer settings and state management (unchanged)
  const defaultSettings = {
    focusTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4
  };

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : false;
  });

  const [timerSettings, setTimerSettings] = useState(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    const savedState = localStorage.getItem('pomodoroTimerState');
    if (savedState) {
      const { remainingTime, lastActiveTime, active, isBreakTime } = JSON.parse(savedState);
      if (active) {
        const now = Date.now();
        const elapsed = Math.floor((now - lastActiveTime) / 1000);
        const newTimeLeft = Math.max(0, remainingTime - elapsed);
        return newTimeLeft;
      }
      return remainingTime;
    }
    return timerSettings.focusTime * 60;
  });

  const [isActive, setIsActive] = useState(() => {
    const savedState = localStorage.getItem('pomodoroTimerState');
    return savedState ? JSON.parse(savedState).active : false;
  });

  const [isBreak, setIsBreak] = useState(() => {
    const savedState = localStorage.getItem('pomodoroTimerState');
    return savedState ? JSON.parse(savedState).isBreakTime : false;
  });

  const [completedSessions, setCompletedSessions] = useState(() => {
    const savedSessions = localStorage.getItem('pomodoroSessions');
    return savedSessions ? parseInt(savedSessions, 10) : 0;
  });

  const [sessionHistory, setSessionHistory] = useState(() => {
    const savedHistory = localStorage.getItem('pomodoroHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [todaySessions, setTodaySessions] = useState(() => {
    const savedToday = localStorage.getItem('pomodoroSessionsToday');
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('pomodoroSessionsDate');
    if (savedToday && savedDate === today) {
      return parseInt(savedToday, 10);
    } else {
      localStorage.setItem('pomodoroSessionsDate', today);
      localStorage.setItem('pomodoroSessionsToday', '0');
      return 0;
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ ...timerSettings });
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  const [achievement, setAchievement] = useState({ show: false, title: '', description: '', icon: '' });
  const [motivationMessage, setMotivationMessage] = useState("The secret of your future is hidden in your daily routine.");

  // Add state for chat widget
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'system', text: 'Welcome to StudySphere Chat! How can we help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Add real-time functionality state
  const [friendSessions, setFriendSessions] = useState([]);
  const [groupStudy, setGroupStudy] = useState(false);
  const [showFriendActivity, setShowFriendActivity] = useState(true);

  const theme = darkMode ? colors.dark : colors.light;

  // Calculate progress for the circular timer (unchanged)
  const totalDuration = isBreak ? timerSettings.breakTime * 60 : timerSettings.focusTime * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Determine if timer is nearing completion (less than 10% left)
  const isNearingCompletion = progress < 0.1;

  // Format time as mm:ss
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, []);

  // Format timestamp for display
  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }, []);

  // Event handlers (unchanged)
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (!showSettings) setSettingsForm({ ...timerSettings });
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    let newValue = parseInt(value, 10);
    if (name === 'focusTime') {
      newValue = Math.max(5, Math.min(60, newValue));
    } else if (name === 'breakTime') {
      newValue = Math.max(1, Math.min(30, newValue));
    } else if (name === 'longBreakTime') {
      newValue = Math.max(5, Math.min(60, newValue));
    }
    setSettingsForm({ ...settingsForm, [name]: newValue });
  };

  const saveSettings = () => {
    setTimerSettings(settingsForm);
    localStorage.setItem('pomodoroSettings', JSON.stringify(settingsForm));
    setTimeLeft(isBreak ? settingsForm.breakTime * 60 : settingsForm.focusTime * 60);
    setShowSettings(false);
    showNotification('Timer settings updated!');
  };

  const resetAllProgress = () => {
    if (window.confirm('Are you sure you want to reset all your Pomodoro progress? This cannot be undone.')) {
      localStorage.removeItem('pomodoroSessions');
      localStorage.removeItem('pomodoroSessionsToday');
      localStorage.removeItem('pomodoroHistory');
      setCompletedSessions(0);
      setTodaySessions(0);
      setSessionHistory([]);
      try {
        axios.post('/api/gamification/reset');
      } catch (error) {
        console.error('Error resetting gamification stats on server:', error);
      }
      showNotification('All progress has been reset!');
    }
  };

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  const triggerCompletionEffect = (message) => {
    setCompletionMessage(message);
    setShowCompletionEffect(true);
    setTimeout(() => setShowCompletionEffect(false), 3000);
    try {
      const audio = new Audio(isBreak ? '/break-complete.mp3' : '/focus-complete.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Set up Socket.IO connection and event listeners
  useEffect(() => {
    if (connected && socket) {
      // Listen for friend Pomodoro sessions
      socket.on('friend_pomodoro_completed', (data) => {
        console.log('Friend completed Pomodoro:', data);
        
        // Add to friendSessions with animation flag
        const friendSession = {
          ...data,
          isNew: true,
          id: Date.now() // unique identifier for the session
        };
        
        setFriendSessions(prev => [friendSession, ...prev.slice(0, 9)]);
        
        // Remove the animation flag after animation completes
        setTimeout(() => {
          setFriendSessions(prev => 
            prev.map(session => 
              session.id === friendSession.id ? { ...session, isNew: false } : session
            )
          );
        }, 3000);
        
        // Show notification if enabled
        if (showFriendActivity) {
          const friendName = data.userName || 'A friend';
          showNotification(`${friendName} just completed a Pomodoro session!`);
        }
      });
      
      // Clean up listeners on unmount
      return () => {
        socket.off('friend_pomodoro_completed');
      };
    }
  }, [connected, socket, showFriendActivity]);

  // Modified function to handle session completion
  const handleSessionComplete = useCallback(() => {
    // Play sound notification
    try {
      audioRef.current?.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
    
    // Update completed sessions count
    const newCount = completedSessions + 1;
    setCompletedSessions(newCount);
    localStorage.setItem('pomodoroSessions', newCount.toString());
    
    // Update today's sessions
    const newTodaySessions = todaySessions + 1;
    setTodaySessions(newTodaySessions);
    localStorage.setItem('pomodoroSessionsToday', newTodaySessions.toString());
    
    // Add to session history
    const sessionData = {
      timestamp: new Date().toISOString(),
      duration: isBreak ? timerSettings.breakTime : timerSettings.focusTime,
      type: isBreak ? 'break' : 'focus'
    };
    
    const updatedHistory = [sessionData, ...sessionHistory.slice(0, 49)];
    setSessionHistory(updatedHistory);
    localStorage.setItem('pomodoroHistory', JSON.stringify(updatedHistory));
    
    // Show completion message
    const message = isBreak
      ? `Break complete! Time to focus for ${timerSettings.focusTime} minutes.`
      : `Great job! You've completed a ${timerSettings.focusTime} minute focus session.`;
    
    triggerCompletionEffect(message);
    
    // Check for achievements
    checkAchievements(newCount);
    
    // Update gamification API
    try {
      axios.post('/api/pomodoro/complete', {
        duration: isBreak ? timerSettings.breakTime : timerSettings.focusTime,
        completed: true
      });
    } catch (error) {
      console.error('Error updating pomodoro stats on server:', error);
    }
    
    // Emit socket event for real-time updates
    if (connected) {
      emit('pomodoro_completed', {
        sessionLength: isBreak ? timerSettings.breakTime : timerSettings.focusTime,
        userName: user?.name || 'Student',
        shareWithGroup: groupStudy,
        groupId: groupStudy ? 'study-group-1' : null, // This would be dynamic in a real app
        timestamp: new Date().toISOString()
      });
    }
    
    // Switch timer type and reset
    setIsBreak(!isBreak);
    
    // If we just finished a focus session and need a long break
    if (!isBreak && (newCount % timerSettings.longBreakInterval === 0)) {
      setTimeLeft(timerSettings.longBreakTime * 60);
      showNotification(`Time for a longer break (${timerSettings.longBreakTime} minutes)!`);
    } else {
      // Set the timer based on the next phase
      setTimeLeft(
        isBreak
          ? timerSettings.focusTime * 60
          : timerSettings.breakTime * 60
      );
    }
    
    // Automatically start the next session if the setting is enabled
    // This would be a new setting you might add to improve UX
    if (localStorage.getItem('autoStartNextSession') === 'true') {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [
    completedSessions,
    todaySessions,
    isBreak,
    timerSettings,
    sessionHistory,
    connected,
    emit,
    user,
    groupStudy
  ]);

  // Timer logic and keyboard shortcuts
  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      // Store the current time and timeLeft when starting the timer
      const startTime = Date.now();
      const initialTimeLeft = timeLeft;
      
      interval = setInterval(() => {
        // Calculate elapsed time since interval started (in seconds)
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, initialTimeLeft - elapsed);
        
        // Only update the state if the time has changed
        if (newTimeLeft !== timeLeft) {
          setTimeLeft(newTimeLeft);
          
          // Update saved state
          const currentState = {
            remainingTime: newTimeLeft,
            lastActiveTime: Date.now(),
            active: true,
            isBreakTime: isBreak
          };
          localStorage.setItem('pomodoroTimerState', JSON.stringify(currentState));
        }
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleSessionComplete, isBreak]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(isBreak ? timerSettings.breakTime * 60 : timerSettings.focusTime * 60);
    localStorage.setItem('pomodoroTimerState', JSON.stringify({
      remainingTime: isBreak ? timerSettings.breakTime * 60 : timerSettings.focusTime * 60,
      lastActiveTime: Date.now(),
      active: false,
      isBreakTime: isBreak
    }));
  }, [isBreak, timerSettings]);

  const toggleTimer = useCallback(() => {
    const newState = !isActive;
    if (newState) {
      localStorage.setItem('pomodoroTimerState', JSON.stringify({
        remainingTime: timeLeft,
        lastActiveTime: Date.now(),
        active: true,
        isBreakTime: isBreak
      }));
    } else {
      localStorage.setItem('pomodoroTimerState', JSON.stringify({
        remainingTime: timeLeft,
        lastActiveTime: Date.now(),
        active: false,
        isBreakTime: isBreak
      }));
    }
    setIsActive(prev => !prev);
  }, [isActive, timeLeft, isBreak]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'r') {
        resetTimer();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleTimer, resetTimer]);

  // Calculate sand heights based on timer progress
  const topSandHeight = `${progress * 100}%`;
  const bottomSandHeight = `${(1 - progress) * 100}%`;

  // Create sand particles with staggered animation delays
  const renderSandParticles = () => {
    const particles = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate random horizontal positions for more natural look
      const randomOffset = Math.random() * 2.5;
      const randomSize = 2 + (Math.random() * 3);
      const leftPosition = (i % 2 === 0) 
        ? 2 + (i * 0.4) + randomOffset
        : 2 + (i * 0.4) - randomOffset;
      
      // Vary animation delay for more realistic flow
      const delay = (i * 0.07) + (Math.random() * 0.12);
      
      // Different opacity for visual depth
      const opacity = 0.65 + (Math.random() * 0.35);
      
      // Add slight color variation to sand particles
      const colorVariation = Math.random() * 15;
      const baseColor = isBreak ? '#9fe3ff' : '#ffd54f';
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      
      const adjustedColor = isBreak
        ? `rgba(${r + colorVariation}, ${g + colorVariation}, ${b}, ${opacity})`
        : `rgba(${r}, ${g - colorVariation}, ${b - colorVariation}, ${opacity})`;
      
      particles.push(
        <div 
          key={i}
          className="sand-particle" 
          style={{
            left: `${leftPosition}px`,
            width: `${randomSize}px`,
            height: `${randomSize}px`,
            backgroundColor: adjustedColor,
            animationDelay: `${delay}s`,
            animationDuration: `${1.3 + (Math.random() * 0.4)}s`
          }}
        />
      );
    }
    
    return particles;
  };

  // Toggle chat widget
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Handle sending chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    
    // Add user message
    setChatMessages([...chatMessages, { sender: 'user', text: chatInput }]);
    setChatInput('');
    
    // Simulate response after 1 second
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        sender: 'system', 
        text: 'Thanks for your message! This is a prototype. In the full version, this will connect to StudentChat.' 
      }]);
    }, 1000);
  };

  // New method to render friend activity
  const renderFriendActivity = () => {
    if (friendSessions.length === 0) {
      return (
        <div className="friend-activity-empty">
          <p>No recent activity from friends.</p>
          <p>When friends complete Pomodoro sessions, you'll see them here!</p>
        </div>
      );
    }
    
    return friendSessions.map((session, index) => (
      <div key={session.id || index} className={`friend-activity-item ${session.isNew ? 'new-activity' : ''}`}>
        <div className="friend-activity-icon">👤</div>
        <div className="friend-activity-content">
          <p className="friend-name">{session.userName || 'Someone'}</p>
          <p className="friend-action">Completed a {session.sessionLength || 25} minute session</p>
          <p className="friend-time">{session.timestamp ? formatTime(session.timestamp) : 'Just now'}</p>
        </div>
      </div>
    ));
  };

  // Toggle group study mode
  const toggleGroupStudy = () => {
    setGroupStudy(!groupStudy);
    showNotification(
      !groupStudy
        ? 'Group study mode enabled! Friends will see your progress.'
        : 'Group study mode disabled.'
    );
  };

  // Toggle friend activity notifications
  const toggleFriendActivity = () => {
    setShowFriendActivity(!showFriendActivity);
    localStorage.setItem('showFriendActivity', (!showFriendActivity).toString());
  };

  // Add CSS classes for animations
  const timerClasses = [
    'timer-display',
    isActive ? 'timer-active' : '',
    timeLeft < 10 ? 'timer-ending' : '',
    isBreak ? 'timer-break' : 'timer-focus'
  ].filter(Boolean).join(' ');

  const checkAchievements = (completedCount) => {
    // Check for achievements based on session count
    if (completedCount === 5) {
      setAchievement({
        show: true,
        title: 'Getting Started',
        description: 'Complete 5 Pomodoro sessions',
        icon: '🔥'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    } else if (completedCount === 10) {
      setAchievement({
        show: true,
        title: 'Focus Master',
        description: 'Complete 10 Pomodoro sessions',
        icon: '⭐'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    } else if (completedCount === 25) {
      setAchievement({
        show: true,
        title: 'Productivity Champion',
        description: 'Complete 25 Pomodoro sessions',
        icon: '🏆'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    } else if (completedCount === 50) {
      setAchievement({
        show: true,
        title: 'Pomodoro Expert',
        description: 'Complete 50 Pomodoro sessions',
        icon: '👑'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    } else if (completedCount === 100) {
      setAchievement({
        show: true,
        title: 'Pomodoro Master',
        description: 'Complete 100 Pomodoro sessions',
        icon: '🎖️'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    }
    
    // Check for daily achievements
    if (todaySessions === 4) {
      setAchievement({
        show: true,
        title: 'Daily Dedication',
        description: 'Complete 4 sessions in a single day',
        icon: '📅'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    } else if (todaySessions === 8) {
      setAchievement({
        show: true,
        title: 'Full Study Day',
        description: 'Complete 8 sessions in a single day',
        icon: '🌟'
      });
      setTimeout(() => setAchievement({ show: false, title: '', description: '', icon: '' }), 5000);
    }
  };

  return (
    <div className="pomodoro-container" style={{ backgroundColor: theme.background, color: theme.text }}>
      {/* Dynamic Background Gradient */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        background: `linear-gradient(45deg, ${theme.background}, ${isBreak ? theme.yellow : theme.coral})`,
        backgroundSize: '200% 200%',
        animation: 'gradientShift 15s ease infinite'
      }} />

      {/* Notification (unchanged) */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: theme.coral,
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          animation: 'slideIn 0.5s ease'
        }}>
          {notification.message}
        </div>
      )}

      {/* Achievement Notification - inspired by gamifiedtrackinglast.js */}
      {achievement.show && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: theme.card,
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          maxWidth: '300px',
          animation: 'slideIn 0.5s ease, fadeOut 0.5s ease 4.5s'
        }}>
          <div style={{ 
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: `${theme.yellow}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {achievement.icon}
          </div>
          <div>
            <div style={{ 
              fontWeight: 'bold', 
              color: theme.yellow,
              marginBottom: '5px' 
            }}>
              Achievement Unlocked!
            </div>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '2px', 
              color: theme.primary 
            }}>
              {achievement.title}
            </div>
            <div style={{ 
              fontSize: '14px',
              color: theme.text,
              opacity: 0.8
            }}>
              {achievement.description}
            </div>
          </div>
        </div>
      )}

      {/* Completion Effect (unchanged) */}
      {showCompletionEffect && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isBreak ? 'rgba(255, 193, 59, 0.7)' : 'rgba(255, 110, 64, 0.7)',
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease, fadeOut 0.3s ease 2.7s'
        }}>
          <div style={{
            backgroundColor: theme.card,
            padding: '30px 50px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'scaleUp 0.3s ease, pulse 2s ease infinite',
            maxWidth: '500px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>
              {isBreak ? '☕' : '🎉'}
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '5px',
              color: theme.primary
            }}>
              {completionMessage}
            </div>
            {!isBreak && (
              <div style={{ fontSize: '16px', opacity: 0.8 }}>
                You've completed {todaySessions} sessions today!
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden'
            }}>
              {[...Array(20)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  backgroundColor: isBreak ? theme.yellow : theme.coral,
                  borderRadius: '50%',
                  top: '-10px',
                  left: `${Math.random() * 100}%`,
                  animation: `confetti 2s ease-in-out ${Math.random()}s infinite`
                }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header with Tomato Icon */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)' // Added shadow for depth
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ 
            color: theme.text, 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center',
            marginRight: '20px',
            fontSize: '14px'
          }}>
            ← Dashboard
          </Link>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '24px', 
            color: theme.coral, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <span style={{ fontSize: '28px' }}>🍅</span> Pomodoro Timer
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/tracking" style={{ 
            color: theme.text, 
            textDecoration: 'none', 
            marginRight: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span>🏆</span> View Progress
          </Link>

          <button onClick={toggleSettings} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            marginRight: '15px',
            color: theme.text,
            transition: 'transform 0.2s ease'
          }}>
            ⚙️
          </button>

          <button onClick={toggleDarkMode} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            marginRight: '15px',
            transition: 'transform 0.3s ease'
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button onClick={toggleMenu} style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: theme.coral,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease'
          }}>
            U
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1500,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '8px',
            padding: '30px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.5s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: theme.primary }}>Timer Settings</h2>
              <button onClick={toggleSettings} style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '24px', 
                cursor: 'pointer',
                color: theme.text
              }}>
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: theme.text }}>
                Focus Time (minutes)
              </label>
              <input
                type="number"
                name="focusTime"
                value={settingsForm.focusTime}
                onChange={handleSettingsChange}
                min="5"
                max="60"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#3d3d3d' : '#fff',
                  color: theme.text,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: theme.text }}>
                Break Time (minutes)
              </label>
              <input
                type="number"
                name="breakTime"
                value={settingsForm.breakTime}
                onChange={handleSettingsChange}
                min="1"
                max="30"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#3d3d3d' : '#fff',
                  color: theme.text,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: theme.text }}>
                Long Break Time (minutes)
              </label>
              <input
                type="number"
                name="longBreakTime"
                value={settingsForm.longBreakTime}
                onChange={handleSettingsChange}
                min="5"
                max="60"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#3d3d3d' : '#fff',
                  color: theme.text,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button onClick={saveSettings} style={{
                flex: 1,
                backgroundColor: theme.coral,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}>
                Save Settings
              </button>

              <button onClick={resetAllProgress} style={{
                flex: 1,
                backgroundColor: 'transparent',
                color: '#e74c3c',
                border: '1px solid #e74c3c',
                borderRadius: '4px',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}>
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pomodoro-main">
        <div className="timer-section">
          <div className={timerClasses}>
            {/* Ornate Hourglass */}
            <div className="ornate-hourglass">
              {/* Top cap */}
              <div className="hourglass-cap top-cap"></div>
              
              {/* Top chamber */}
              <div className="hourglass-chamber top-chamber">
                <div 
                  className="chamber-sand top-sand" 
                  style={{ 
                    height: `${100 - progress}%`,
                    backgroundColor: isBreak ? '#9fe3ff' : '#ffd54f',
                    opacity: 1 - (progress / 200)
                  }}
                >
                  {/* Add sand texture */}
                  {isActive && Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i}
                      className="sand-grain"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${2 + Math.random() * 3}px`,
                        height: `${2 + Math.random() * 3}px`,
                        backgroundColor: isBreak ? 'rgba(173, 216, 230, 0.6)' : 'rgba(255, 235, 153, 0.6)'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Middle part with ornament */}
              <div className="hourglass-middle">
                <div className="middle-ornament"></div>
              </div>
              
              {/* Bottom chamber */}
              <div className="hourglass-chamber bottom-chamber">
                <div 
                  className="chamber-sand bottom-sand" 
                  style={{ 
                    height: `${progress}%`,
                    backgroundColor: isBreak ? '#9fe3ff' : '#ffd54f',
                    opacity: 0.6 + (progress / 200)
                  }}
                >
                  {/* Add sand texture to bottom chamber too */}
                  {isActive && progress > 5 && Array.from({ length: Math.ceil(progress / 10) }).map((_, i) => (
                    <div 
                      key={i}
                      className="sand-grain"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${2 + Math.random() * 3}px`,
                        height: `${2 + Math.random() * 3}px`,
                        backgroundColor: isBreak ? 'rgba(173, 216, 230, 0.6)' : 'rgba(255, 235, 153, 0.6)'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Bottom cap */}
              <div className="hourglass-cap bottom-cap"></div>
              
              {/* Decorative elements */}
              <div className="ornate-decorations left-decorations"></div>
              <div className="ornate-decorations right-decorations"></div>
              
              {/* Falling sand animation */}
              {isActive && (
                <div className="falling-sand">
                  {renderSandParticles()}
                </div>
              )}
            </div>

            {/* Small clock display at the bottom of the hourglass */}
            <div className="small-clock">
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="timer-controls">
            <button 
              className="timer-button" 
              onClick={toggleTimer}
              aria-label={isActive ? "Pause" : "Start"}
            >
              {isActive ? <FaPause /> : <FaPlay />}
            </button>
            
            <button 
              className="timer-button" 
              onClick={resetTimer}
              aria-label="Reset"
            >
              <FaRedo />
            </button>
            
            <button 
              className={`mode-button ${isBreak ? 'break-mode' : 'focus-mode'}`} 
              onClick={() => {
                setIsActive(false);
                setIsBreak(!isBreak);
                setTimeLeft(isBreak ? timerSettings.focusTime * 60 : timerSettings.breakTime * 60);
              }}
              aria-label={isBreak ? "Switch to Focus Mode" : "Switch to Break Mode"}
            >
              {isBreak ? "Focus Mode" : "Break Mode"}
            </button>
          </div>
          
          <div className="session-info">
            <div className="session-type">
              <span className="session-label">Current: </span>
              <span className="session-value" style={{ color: isBreak ? theme.yellow : theme.coral }}>
                {isBreak ? 'Break' : 'Focus'} Session
              </span>
            </div>
            
            <div className="session-count">
              <span className="session-label">Completed Today: </span>
              <span className="session-value" style={{ color: theme.yellow }}>
                {todaySessions} sessions
              </span>
            </div>
            
            <div className="total-sessions">
              <span className="session-label">Total: </span>
              <span className="session-value" style={{ color: theme.coral }}>
                {completedSessions} sessions
              </span>
            </div>
          </div>
          
          {/* New group study toggle */}
          <div className="group-study-toggle">
            <button 
              onClick={toggleGroupStudy}
              className={`toggle-button ${groupStudy ? 'active' : ''}`}
              style={{
                backgroundColor: groupStudy ? theme.coral : 'transparent',
                color: groupStudy ? theme.buttonText : theme.text,
                border: `1px solid ${groupStudy ? theme.coral : theme.border}`
              }}
            >
              {groupStudy ? 'Group Study On' : 'Group Study Off'}
            </button>
            
            <div className="toggle-description">
              {groupStudy 
                ? 'Your friends will see when you complete sessions' 
                : 'Turn on to share your progress with friends'}
            </div>
          </div>
        </div>
        
        <div className="side-section">
          {/* Friend activity section */}
          <div className="friend-activity-section" style={{ backgroundColor: theme.card }}>
            <div className="section-header">
              <h3>Friend Activity</h3>
              <button 
                onClick={toggleFriendActivity}
                className="notification-toggle"
                title={showFriendActivity ? 'Turn off notifications' : 'Turn on notifications'}
              >
                {showFriendActivity ? '🔔' : '🔕'}
              </button>
            </div>
            
            <div className="friend-activity-feed">
              {renderFriendActivity()}
            </div>
          </div>
          
          {/* Motivation Card with enhanced design */}
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: '100%',
            marginTop: '20px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative corner accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80px',
              height: '80px',
              background: `linear-gradient(45deg, transparent 50%, ${theme.primary}15 50%)`,
              zIndex: 0
            }} />
            
            <div style={{ 
              fontSize: '22px', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              color: theme.primary,
              position: 'relative'
            }}>
              {/* Decorative underlining */}
              <span style={{
                display: 'inline-block',
                position: 'relative',
                zIndex: 1
              }}>
                💪 Stay Motivated!
                <div style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  height: '6px',
                  background: `linear-gradient(90deg, transparent, ${theme.yellow}30, ${theme.yellow}50, ${theme.yellow}30, transparent)`,
                  borderRadius: '3px'
                }} />
              </span>
            </div>
            <div style={{ 
              fontSize: '15px', 
              color: theme.text, 
              opacity: 0.9,
              lineHeight: 1.5,
              fontStyle: 'italic',
              padding: '0 15px',
              position: 'relative',
              zIndex: 1
            }}>
              {motivationMessage}
            </div>
          </div>
          
          {/* Session History with enhanced design */}
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: '100%',
            flex: '1',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative corner element */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '70px',
              height: '70px',
              borderRadius: '0 70px 0 0',
              backgroundColor: `${theme.primary}08`,
              zIndex: 0
            }} />
            
            <h2 style={{ 
              margin: '0 0 20px 0', 
              color: theme.primary, 
              fontSize: '22px',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '24px' }}>📝</span> Recent Sessions
            </h2>

            {sessionHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: theme.text, 
                opacity: 0.7,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px' }}>📊</div>
                Complete your first pomodoro session to see history
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                maxHeight: '350px', 
                overflowY: 'auto',
                paddingRight: '8px',
                position: 'relative',
                zIndex: 1
              }}>
                {sessionHistory.map((session, index) => (
                  <div key={index} style={{
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px', 
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    borderLeft: `3px solid ${session.type === 'break' ? theme.yellow : theme.coral}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ 
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      backgroundColor: session.type === 'break' ? `${theme.yellow}30` : `${theme.coral}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      boxShadow: `0 3px 10px ${session.type === 'break' ? theme.yellow : theme.coral}20`
                    }}>
                      {session.type === 'break' ? '☕' : '📚'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: session.type === 'break' ? theme.yellow : theme.coral,
                        fontSize: '15px',
                        marginBottom: '3px'
                      }}>
                        {session.type === 'break' ? 'Break' : 'Focus'} Session
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        opacity: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ fontSize: '12px' }}>⏳</span>
                        {formatDate(session.timestamp)}
                      </div>
                    </div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: theme.text,
                      backgroundColor: session.type === 'break' ? `${theme.yellow}15` : `${theme.coral}15`,
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {session.duration} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Chat Widget - Interactive */}
      <div onClick={toggleChat} style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: theme.coral,
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
      }}>
        💬
        {!isChatOpen && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: theme.yellow,
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
          }}>
            1
          </div>
        )}
      </div>

      {/* Chat Box */}
      {isChatOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '320px',
          height: '400px',
          backgroundColor: theme.card,
          borderRadius: '16px',
          boxShadow: '0 5px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 100,
          animation: 'slideUp 0.3s ease',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '15px',
            backgroundColor: theme.primary,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
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
              <div key={index} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? theme.coral : (darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                color: msg.sender === 'user' ? 'white' : theme.text,
                padding: '10px 15px',
                borderRadius: msg.sender === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                maxWidth: '80%',
                wordBreak: 'break-word'
              }}>
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
              style={{
                flex: 1,
                padding: '10px 15px',
                border: 'none',
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '20px',
                color: theme.text,
                outline: 'none'
              }}
            />
            <button type="submit" style={{
              backgroundColor: theme.coral,
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
            }}>
              →
            </button>
          </form>
        </div>
      )}

      {/* CSS Animations with Responsiveness */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          
          @keyframes scaleUp {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }

          button:hover {
            transform: scale(1.05);
          }

          [style*="transition: transform"] {
            transition: transform 0.2s ease;
          }

          [style*="transition: all"] {
            transition: all 0.3s ease;
          }

          div[style*="transition: transform"]:hover {
            transform: translateY(-5px) !important;
            box-shadow: 0 6px 15px rgba(0,0,0,0.1) !important;
          }

          /* Responsive Adjustments */
          @media (max-width: 992px) {
            main {
              flex-direction: column !important;
              padding: 20px;
            }
            
            main > div {
              width: 100%;
            }
          }
          
          @media (max-width: 768px) {
            .stats-container {
              grid-template-columns: 1fr;
            }
            
            div[style*="width: '300px'"][style*="height: '300'"] {
              width: 250px;
              height: 250px;
            }
            
            svg[width="300"][height="300"] {
              width: 250px;
              height: 250px;
            }
            
            header {
              padding: 15px !important;
            }
            
            header div:nth-child(2) {
              gap: 5px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PomodoroTimer;
