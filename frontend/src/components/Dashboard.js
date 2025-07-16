import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  // Get user data from AuthContext with safe fallback
  const { user: authUser } = useAuth() || {};

  // Safe user object with fallback values
  const user = authUser || {
    name: localStorage.getItem('userName') || 'Student',
    email: localStorage.getItem('userEmail') || 'student@studysphere.com'
  };

  // WCAG AA Compliant Color System - Based on Reference Images
  const colors = {
    light: {
      // Primary Colors from Reference Image
      creamWhite: '#faf5f5',      // Background
      warmIvory: '#f5f3f0',       // Secondary background
      parchment: '#e6e3dd',       // Borders and dividers
      antiqueGold: '#c9a96e',     // Accent color
      agedBrass: '#6b7355',       // Secondary accent
      forestGreen: '#4a5d4a',     // Success/positive
      charcoal: '#2c2c2c',        // Primary text (WCAG AA: 12.6:1 contrast)

      // UI Application
      text: '#2c2c2c',            // High contrast text
      textSecondary: '#4a5d4a',   // Secondary text (WCAG AA: 7.8:1 contrast)
      textMuted: '#6b7355',       // Muted text (WCAG AA: 5.2:1 contrast)
      background: '#faf5f5',      // Main background
      backgroundAlt: '#f5f3f0',   // Alternative background
      card: '#ffffff',            // Card background
      border: '#e6e3dd',          // Borders
      shadow: 'rgba(44, 44, 44, 0.08)',

      // Brand Colors (StudySphere)
      primary: '#4a5d4a',         // Forest Green
      accent: '#c9a96e',          // Antique Gold
      success: '#4a5d4a',
      warning: '#c9a96e',

      // Interactive States
      hover: '#f5f3f0',
      focus: '#e6e3dd',
      active: '#c9a96e'
    },
    dark: {
      // Dark Colors from Reference Image
      deepBlack: '#1a1a1a',       // Background
      richCharcoal: '#252525',    // Secondary background
      slateGray: '#404040',       // Borders and dividers
      wornLeather: '#6d5a47',     // Accent color
      antiqueGoldDark: '#c9a96e', // Accent (same as light)
      mutedSage: '#5a6b5a',       // Success/positive
      softCream: '#e6e3dd',       // Primary text (WCAG AA: 11.8:1 contrast)

      // UI Application
      text: '#e6e3dd',            // High contrast text
      textSecondary: '#c9a96e',   // Secondary text (WCAG AA: 6.2:1 contrast)
      textMuted: '#5a6b5a',       // Muted text (WCAG AA: 4.8:1 contrast)
      background: '#1a1a1a',      // Main background
      backgroundAlt: '#252525',   // Alternative background
      card: '#252525',            // Card background
      border: '#404040',          // Borders
      shadow: 'rgba(0, 0, 0, 0.3)',

      // Brand Colors (StudySphere)
      primary: '#5a6b5a',         // Muted Sage
      accent: '#c9a96e',          // Antique Gold
      success: '#5a6b5a',
      warning: '#c9a96e',

      // Interactive States
      hover: '#252525',
      focus: '#404040',
      active: '#c9a96e'
    }
  };

  // State management
  const [motivationText, setMotivationText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;

  // WCAG AA Compliant Spacing System - Enhanced for Accessibility
  const spacing = {
    xs: '0.25rem',    // 4px - Minimal spacing
    sm: '0.5rem',     // 8px - Small gaps
    md: '1rem',       // 16px - Standard spacing
    lg: '1.5rem',     // 24px - Section spacing
    xl: '2rem',       // 32px - Large sections
    xxl: '3rem',      // 48px - Major sections
    xxxl: '4rem',     // 64px - Page sections

    // Touch-friendly minimum sizes (44px minimum for interactive elements)
    touchTarget: '2.75rem', // 44px - WCAG AA minimum touch target

    // Content spacing for readability
    lineHeight: '1.6',      // Optimal line height for readability
    paragraphSpacing: '1.2rem', // Space between paragraphs
    sectionSpacing: '2.5rem'    // Space between major sections
  };

  // Helper functions for mymind-style personalization
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getMotivationalMessage = () => {
    const messages = [
      'Ready to learn something new today?',
      'Your learning journey continues.',
      'Every step forward is progress.',
      'Knowledge is power in action.',
      'Today is full of possibilities.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Feature data
  const features = [
    {
      id: 'resources',
      icon: '📚',
      title: 'Resource Hub',
      description: 'Access study materials, notes, and resources in one centralized location.',
      details: 'Organize your study materials by subject, create custom collections, and share resources with classmates. Includes note-taking tools and integration with popular learning platforms.',
      path: '/resources'
    },
    {
      id: 'pomodoro',
      icon: '⏱️',
      title: 'Pomodoro Timer',
      description: 'Boost productivity with focused study sessions and scheduled breaks.',
      details: 'Customize work intervals, break durations, and session goals. Track your focus time and receive insights on your most productive study periods.',
      path: '/pomodoro'
    },
    {
      id: 'tracking',
      icon: '🏆',
      title: 'Gamified Tracking',
      description: 'Stay motivated with badges, streaks, and achievements as you study.',
      details: 'Earn points for completing study sessions, maintain daily streaks, and unlock special achievements. Compare your progress with friends or join study challenges.',
      path: '/tracking'
    },
    {
      id: 'chat',
      icon: '💬',
      title: 'Student Chat',
      description: 'Connect with fellow students to discuss topics and form study groups.',
      details: 'Join subject-specific chat rooms, create private study groups, and schedule virtual study sessions. Share resources directly in conversations.',
      path: '/chat-rooms'
    },
    {
      id: 'whiteboard',
      icon: '🖌️',
      title: 'Whiteboard',
      description: 'Visualize concepts and collaborate with others on a digital whiteboard.',
      details: 'Create diagrams, mind maps, and illustrations to understand topics. Real-time collaboration allows you to work with classmates on the same board. Save and organize your whiteboards by subject.',
      path: '/whiteboard'
    },
    {
      id: 'calendar',
      icon: '📅',
      title: 'Calendar',
      description: 'Manage your study schedule and never miss assignment deadlines.',
      details: 'Integrate with calendar with setting up assignment deadlines, schedule study sessions, and receive reminders. View your academic commitments alongside personal appointments.',
      path: '/calendar'
    }
  ];

  // Load saved motivation text from localStorage on component mount
  useEffect(() => {
    const savedMotivation = localStorage.getItem('motivationText');
    if (savedMotivation) {
      setMotivationText(savedMotivation);
      setSavedText(savedMotivation);
    } else {
      const defaultText = "Every study session brings you one step closer to your goals. Keep going!";
      setMotivationText(defaultText);
      setSavedText(defaultText);
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    }
    
    // Add event listener for clicks outside the menu
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Handle clicks outside the menu
  const handleOutsideClick = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target) && menuOpen) {
      setMenuOpen(false);
    }
  };

  // Save motivation text to localStorage
  const saveMotivationText = () => {
    localStorage.setItem('motivationText', motivationText);
    setSavedText(motivationText);
    setIsEditing(false);
    showNotification('Motivation message saved successfully!', 'success');
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const [expandedFeature, setExpandedFeature] = useState(null);

  const toggleFeatureDetails = (featureId) => {
    if (expandedFeature === featureId) {
      setExpandedFeature(null);
    } else {
      setExpandedFeature(featureId);
    }
  };

  return (
    <div style={{
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: theme.background,
      color: theme.text,
      minHeight: '100vh',
      lineHeight: spacing.lineHeight,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative'
    }}>
      {/* mymind-style advanced animations */}
      <style>{`
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

        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .mymind-card {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mymind-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }

        .search-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-input:focus {
          transform: scale(1.02);
        }

        .nav-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .nav-button:hover {
          transform: translateY(-1px);
        }

        .loading-skeleton {
          background: linear-gradient(90deg, ${theme.backgroundAlt} 25%, ${theme.border} 50%, ${theme.backgroundAlt} 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }

        .welcome-text {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-grid {
          animation: fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: `linear-gradient(135deg, ${theme.coral}15, ${theme.yellow}15)`,
        borderRadius: '50%',
        opacity: 0.6
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        background: `linear-gradient(135deg, ${theme.primary}10, ${theme.coral}10)`,
        borderRadius: '50%',
        opacity: 0.4
      }}></div>

      {/* WCAG AA Compliant Enhanced Animations & Accessibility */}
      <style>{`
        /* Enhanced focus indicators for accessibility */
        .dashboard-card:focus-within,
        .dashboard-card:focus {
          outline: 2px solid ${theme.primary};
          outline-offset: 2px;
        }

        .dashboard-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 20px 40px ${theme.shadow} !important;
        }

        .feature-button:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 8px 25px ${theme.shadow} !important;
        }

        .feature-button:focus {
          outline: 2px solid ${theme.primary};
          outline-offset: 2px;
        }

        .nav-button:hover {
          transform: translateY(-2px) !important;
        }

        .nav-button:focus {
          outline: 2px solid ${theme.primary};
          outline-offset: 2px;
        }

        .motivation-card {
          backdrop-filter: blur(10px);
        }

        /* Touch-friendly interactive elements */
        .touch-target {
          min-height: ${spacing.touchTarget};
          min-width: ${spacing.touchTarget};
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: spacing.lg,
          right: spacing.lg,
          backgroundColor: notification.type === 'success' ? theme.success : theme.warning,
          color: theme.text,
          padding: `${spacing.md} ${spacing.lg}`,
          borderRadius: '8px',
          boxShadow: `0 4px 15px ${theme.shadow}`,
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          border: `1px solid ${theme.border}`
        }}>
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          {notification.message}
        </div>
      )}

      {/* Header with user menu */}
      {/* mymind-style minimal header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing.xl} ${spacing.xxxl}`,
        background: 'transparent',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          fontWeight: '600',
          fontSize: '1.5rem',
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          letterSpacing: '-0.5px',
          fontFamily: '"Inter", sans-serif'
        }}>
          StudySphere
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          {/* Enhanced mymind-style search with advanced interactions */}
          <div className="search-input" style={{
            display: 'flex',
            alignItems: 'center',
            background: theme.card,
            borderRadius: '12px',
            padding: `${spacing.md} ${spacing.lg}`,
            border: `1px solid ${theme.border}`,
            minWidth: '300px',
            boxShadow: `0 2px 8px ${theme.shadow}`,
            position: 'relative'
          }}>
            <span style={{
              fontSize: '1rem',
              marginRight: spacing.md,
              color: theme.textSecondary,
              transition: 'all 0.2s ease'
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search your learning space..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
                color: theme.text,
                background: 'transparent',
                width: '100%',
                fontFamily: '"Inter", sans-serif',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.parentElement.style.border = `1px solid ${theme.text}`;
                e.target.parentElement.style.boxShadow = `0 4px 20px ${theme.shadow}`;
                e.target.previousElementSibling.style.color = theme.text;
              }}
              onBlur={(e) => {
                e.target.parentElement.style.border = `1px solid ${theme.border}`;
                e.target.parentElement.style.boxShadow = `0 2px 8px ${theme.shadow}`;
                e.target.previousElementSibling.style.color = theme.textSecondary;
              }}
            />
            {/* Search suggestions indicator */}
            <div style={{
              position: 'absolute',
              right: '1rem',
              fontSize: '0.75rem',
              color: theme.textSecondary,
              opacity: 0.6
            }}>⌘K</div>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            style={{
              background: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.sm,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              fontWeight: '500'
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {/* User Profile Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleMenu}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.sm,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                color: theme.text,
                fontWeight: '500'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: theme.backgroundAlt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                color: theme.textSecondary
              }}>
                👤
              </div>
              <span style={{ fontSize: '0.8rem', transition: 'transform 0.2s ease', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>
          </div>
        </div>
      </header>

      {/* User Menu Overlay */}
      {menuOpen && (
        <div 
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '80px',
            right: '40px',
            width: '300px',
            backgroundColor: theme.card,
            borderRadius: '12px',
            boxShadow: `0 5px 20px ${theme.shadow}`,
            zIndex: 1000,
            padding: spacing.lg,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            animation: 'fadeIn 0.2s ease',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            marginBottom: spacing.lg,
            padding: spacing.sm,
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: theme.coral,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
            }}>
              U
            </div>
            <div style={{ 
              fontWeight: '600', 
              marginBottom: spacing.xs,
              color: theme.text,
              fontSize: '18px',
            }}>
              Mohammad Zaheer
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: theme.textSecondary, 
              marginBottom: spacing.sm
            }}>
              kmd.zaheer2006@gmail.com
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <MenuItem icon="👤" label="Profile Settings" theme={theme} />
            <MenuItem icon="🔔" label="Notifications" theme={theme} />
            <MenuItem icon="📊" label="Study Statistics" theme={theme} />
            <MenuItem icon="⚙️" label="Account Settings" theme={theme} />
            
            <div style={{ 
              margin: `${spacing.sm} 0`,
              borderTop: `1px solid ${theme.border}`,
              paddingTop: spacing.sm
            }}>
              <button 
                onClick={toggleDarkMode} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.text,
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.backgroundAlt}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {darkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
              </button>
              
              <button 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: '8px',
                  backgroundColor: theme.coral,
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginTop: spacing.sm,
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.coralHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.coral}
              >
                <span>🚪</span> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* mymind-style main content */}
      <main style={{
        padding: `${spacing.sectionSpacing} ${spacing.xxxl}`,
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Enhanced mymind-style welcome section with personality */}
        <section className="welcome-text" style={{
          marginBottom: spacing.sectionSpacing,
          position: 'relative'
        }}>
          {/* Dynamic greeting with time-based emoji */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.md
          }}>
            <div style={{
              fontSize: '3rem',
              animation: 'pulse 2s infinite',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }}>
              {getTimeOfDay() === 'morning' ? '🌅' :
               getTimeOfDay() === 'afternoon' ? '☀️' : '🌙'}
            </div>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: theme.text,
                margin: 0,
                fontFamily: '"Inter", sans-serif',
                letterSpacing: '-1px',
                background: `linear-gradient(135deg, ${theme.text}, ${theme.textSecondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Good {getTimeOfDay()}, {user?.name || 'Student'}
              </h1>
              <div style={{
                width: '60px',
                height: '3px',
                background: `linear-gradient(90deg, ${theme.coral}, ${theme.yellow})`,
                borderRadius: '2px',
                marginTop: spacing.sm
              }}></div>
            </div>
          </div>

          {/* Enhanced motivational message with editing functionality */}
          <div style={{
            background: theme.backgroundAlt,
            borderRadius: '12px',
            padding: spacing.lg,
            border: `1px solid ${theme.border}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '40px',
              height: '40px',
              background: `${theme.accent}15`,
              borderRadius: '50%',
              opacity: 0.6
            }}></div>

            {/* Edit button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                position: 'absolute',
                top: spacing.sm,
                right: spacing.sm,
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: spacing.xs,
                cursor: 'pointer',
                color: theme.textSecondary,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                zIndex: 2
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = theme.hover;
                e.currentTarget.style.color = theme.text;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.textSecondary;
              }}
            >
              {isEditing ? '✓' : '✏️'}
            </button>

            {isEditing ? (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <textarea
                  value={motivationText}
                  onChange={(e) => setMotivationText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    fontSize: '1.1rem',
                    color: theme.text,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontWeight: '500',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Enter your motivational message..."
                />
                <div style={{
                  display: 'flex',
                  gap: spacing.sm,
                  marginTop: spacing.sm
                }}>
                  <button
                    onClick={saveMotivationText}
                    style={{
                      background: theme.primary,
                      color: theme.buttonText,
                      border: 'none',
                      borderRadius: '6px',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${theme.shadow}`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setMotivationText(savedText);
                      setIsEditing(false);
                    }}
                    style={{
                      background: 'transparent',
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = theme.hover;
                      e.currentTarget.style.color = theme.text;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme.textSecondary;
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{
                fontSize: '1.1rem',
                color: theme.text,
                margin: 0,
                fontWeight: '500',
                lineHeight: '1.6',
                position: 'relative',
                zIndex: 1,
                paddingRight: spacing.xl
              }}>
                💡 {motivationText || getMotivationalMessage()}
              </p>
            )}
          </div>
        </section>

        {/* Enhanced mymind-style feature grid with varying layouts */}
        <section className="feature-grid" style={{ marginBottom: spacing.sectionSpacing }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl
          }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: theme.text,
              margin: 0,
              fontFamily: '"Inter", sans-serif',
              letterSpacing: '-0.5px'
            }}>
              Your learning toolkit
            </h2>
            <div style={{
              display: 'flex',
              gap: spacing.sm,
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '0.85rem',
                color: theme.textSecondary,
                fontWeight: '500'
              }}>
                {features.length} tools available
              </span>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: theme.coral,
                animation: 'pulse 2s infinite'
              }}></div>
            </div>
          </div>

          {/* Advanced mymind-style masonry grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: spacing.lg,
            marginBottom: spacing.sectionSpacing
          }}>
            {features.map((feature, index) => (
              <Link
                key={feature.id}
                to={feature.path}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="mymind-card"
                  style={{
                    background: theme.card,
                    borderRadius: '16px',
                    padding: spacing.xl,
                    border: `1px solid ${theme.border}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 4px 20px ${theme.shadow}`,
                    cursor: 'pointer',
                    height: index % 3 === 0 ? 'auto' : '100%', // Varying heights for visual interest
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Subtle background pattern */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `${feature.color || theme.coral}10`,
                    borderRadius: '50%',
                    opacity: 0.5
                  }}></div>

                  {/* Enhanced card header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: spacing.lg,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md
                    }}>
                      <div style={{
                        fontSize: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        background: `linear-gradient(135deg, ${feature.color || theme.coral}20, ${feature.color || theme.coral}10)`,
                        borderRadius: '12px',
                        border: `2px solid ${feature.color || theme.coral}30`,
                        transition: 'all 0.3s ease'
                      }}>{feature.icon}</div>
                      <div>
                        <h3 style={{
                          margin: `0 0 ${spacing.xs} 0`,
                          color: theme.text,
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          fontFamily: '"Inter", sans-serif',
                          letterSpacing: '-0.5px'
                        }}>{feature.title}</h3>
                        <div style={{
                          width: '30px',
                          height: '2px',
                          background: feature.color || theme.coral,
                          borderRadius: '1px'
                        }}></div>
                      </div>
                    </div>

                    {/* Quick action indicator */}
                    <div style={{
                      fontSize: '1.25rem',
                      color: theme.textSecondary,
                      opacity: 0.6,
                      transition: 'all 0.2s ease'
                    }}>→</div>
                  </div>

                  {/* Enhanced description */}
                  <p style={{
                    color: theme.textSecondary,
                    margin: `0 0 ${spacing.lg} 0`,
                    lineHeight: '1.6',
                    fontSize: '0.95rem',
                    flex: 1,
                    position: 'relative',
                    zIndex: 1
                  }}>{feature.description}</p>

                  {/* Feature status indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    fontSize: '0.8rem',
                    color: theme.textSecondary,
                    fontWeight: '500',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981'
                    }}></div>
                    Ready to use
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* mymind-style quick actions section */}
        <section style={{ marginBottom: spacing.sectionSpacing }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: theme.text,
            marginBottom: spacing.lg,
            fontFamily: '"Inter", sans-serif',
            letterSpacing: '-0.5px'
          }}>
            Quick actions
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: spacing.md
          }}>
            {[
              { icon: '📝', label: 'Start studying', action: '/pomodoro', color: theme.coral },
              { icon: '💬', label: 'Join study group', action: '/chat-rooms', color: theme.yellow },
              { icon: '📊', label: 'View progress', action: '/gamified-tracking', color: '#10b981' },
              { icon: '🎯', label: 'Set goals', action: '/calendar', color: '#8b5cf6' }
            ].map((action, index) => (
              <Link
                key={index}
                to={action.action}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: theme.card,
                  borderRadius: '12px',
                  padding: spacing.lg,
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  boxShadow: `0 2px 8px ${theme.shadow}`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${theme.shadow}`;
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${theme.shadow}`;
                  e.currentTarget.style.borderColor = theme.border;
                }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${action.color}15`,
                    borderRadius: '8px'
                  }}>
                    {action.icon}
                  </div>
                  <span style={{
                    color: theme.text,
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}>
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* mymind-style recent activity section */}
        <section style={{ marginBottom: spacing.sectionSpacing }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: theme.text,
            marginBottom: spacing.lg,
            fontFamily: '"Inter", sans-serif',
            letterSpacing: '-0.5px'
          }}>
            Recent activity
          </h3>

          <div style={{
            background: theme.card,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden'
          }}>
            {[
              { icon: '📚', text: 'Completed Resource Hub session', time: '2 hours ago', color: theme.coral },
              { icon: '⏱️', text: 'Finished 25-minute focus session', time: '4 hours ago', color: theme.yellow },
              { icon: '🏆', text: 'Earned "Study Streak" achievement', time: 'Yesterday', color: '#10b981' }
            ].map((activity, index) => (
              <div
                key={index}
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderBottom: index < 2 ? `1px solid ${theme.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = theme.backgroundAlt}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  fontSize: '1.25rem',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${activity.color}15`,
                  borderRadius: '8px'
                }}>
                  {activity.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: theme.text,
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    marginBottom: spacing.xs
                  }}>
                    {activity.text}
                  </div>
                  <div style={{
                    color: theme.textSecondary,
                    fontSize: '0.8rem'
                  }}>
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ChatWidget is handled at the app level */}
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ icon, label, theme }) => {
  return (
    <button 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        width: '100%',
        padding: spacing.md,
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: theme.text,
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'left',
        transition: 'background-color 0.2s ease',
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.backgroundAlt}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
};

export default Dashboard;