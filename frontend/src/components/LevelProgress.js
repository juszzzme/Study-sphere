import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LevelProgress = ({ 
  level = 1, 
  currentXp = 0, 
  nextLevelXp = 1000, 
  progress = 0,
  showLevelBenefits = true,
  showXpSources = true,
  animated = true
}) => {
  const { theme, darkMode } = useTheme();
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Animation effect
  useEffect(() => {
    if (animated) {
      setAnimationProgress(0);
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [level, currentXp, animated]);
  
  // Level badges/icons
  const getLevelIcon = (lvl) => {
    if (lvl >= 20) return '🏆';
    if (lvl >= 15) return '🥇';
    if (lvl >= 10) return '🥈';
    if (lvl >= 5) return '🥉';
    return '🎓';
  };
  
  // Level titles
  const getLevelTitle = (lvl) => {
    if (lvl >= 20) return 'Grand Master';
    if (lvl >= 15) return 'Master Scholar';
    if (lvl >= 10) return 'Scholar';
    if (lvl >= 5) return 'Advanced Student';
    return 'Novice';
  };
  
  // Calculate animated values
  const animatedProgress = progress * animationProgress;

  return (
    <div style={{
      backgroundColor: theme.card,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      color: theme.text,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Main section with level and progress */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        marginBottom: showLevelBenefits || showXpSources ? '20px' : '0',
      }}>
        {/* Level Badge */}
        <div style={{
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          backgroundColor: `${theme.yellow}20`,
          color: theme.yellow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          marginRight: '20px',
          position: 'relative',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '20px' }}>{level}</span>
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-5px',
            backgroundColor: theme.yellow,
            color: darkMode ? '#333' : '#fff',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}>
            {getLevelIcon(level)}
          </div>
        </div>
        
        {/* Level Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '8px',
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: theme.primary,
            }}>
              Level {level} {getLevelTitle(level)}
            </h3>
            
            <div style={{
              fontSize: '14px',
              opacity: 0.7,
            }}>
              {currentXp} / {nextLevelXp} XP
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            height: '10px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            borderRadius: '5px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${animatedProgress}%`,
              backgroundColor: theme.coral,
              borderRadius: '5px',
              transition: animated ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              position: 'relative',
            }}>
              {/* Shimmer Effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite',
              }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Optional info panels */}
      {(showLevelBenefits || showXpSources) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: showLevelBenefits && showXpSources ? '1fr 1fr' : '1fr',
          gap: '15px',
          marginTop: '20px',
        }}>
          {/* Level Benefits */}
          {showLevelBenefits && (
            <div style={{
              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '10px',
                color: theme.coral,
              }}>
                Level Benefits
              </div>
              
              <ul style={{
                margin: 0,
                padding: '0 0 0 20px',
                fontSize: '13px',
                opacity: 0.9,
              }}>
                <li style={{ marginBottom: '5px' }}>Unlock new badges</li>
                <li style={{ marginBottom: '5px' }}>Access to advanced resources</li>
                <li style={{ marginBottom: '5px' }}>Leaderboard ranking</li>
                {level >= 5 && <li style={{ marginBottom: '5px' }}>Create study groups</li>}
                {level >= 10 && <li>Mentor other students</li>}
              </ul>
            </div>
          )}
          
          {/* XP Sources */}
          {showXpSources && (
            <div style={{
              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '10px',
                color: theme.coral,
              }}>
                How to Earn XP
              </div>
              
              <ul style={{
                margin: 0,
                padding: '0 0 0 20px',
                fontSize: '13px',
                opacity: 0.9,
              }}>
                <li style={{ marginBottom: '5px' }}>Study hours: 10 XP/hr</li>
                <li style={{ marginBottom: '5px' }}>Daily streaks: 50 XP/day</li>
                <li style={{ marginBottom: '5px' }}>Pomodoro sessions: 5 XP each</li>
                <li style={{ marginBottom: '5px' }}>Resource uploads: 20 XP each</li>
                <li>Group study: 15 XP/session</li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default LevelProgress; 