import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { GAMIFICATION } from '../config';

const BadgeDisplay = ({ earnedBadges = [], allBadges, title, layout = 'grid' }) => {
  const { theme, darkMode } = useTheme();
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Get badge data either from props or config
  const badgeData = allBadges || {
    // Study hours badges
    '100-hours': {
      name: 'Century Scholar',
      description: 'Completed 100 hours of study time',
      icon: '🕒',
      color: theme.bronze || '#cd7f32',
      category: 'hours',
      requirement: '100 study hours'
    },
    '500-hours': {
      name: 'Dedicated Learner',
      description: 'Completed 500 hours of study time',
      icon: '⏰',
      color: theme.silver || '#c0c0c0',
      category: 'hours',
      requirement: '500 study hours'
    },
    '1000-hours': {
      name: 'Master Scholar',
      description: 'Completed 1000 hours of study time',
      icon: '🎓',
      color: theme.gold || '#ffd700',
      category: 'hours',
      requirement: '1000 study hours'
    },
    
    // Streak badges
    '7-day-streak': {
      name: 'Weekly Warrior',
      description: 'Maintained a 7-day study streak',
      icon: '📅',
      color: theme.bronze || '#cd7f32',
      category: 'streaks',
      requirement: '7-day streak'
    },
    '30-day-streak': {
      name: 'Monthly Master',
      description: 'Maintained a 30-day study streak',
      icon: '📆',
      color: theme.silver || '#c0c0c0',
      category: 'streaks',
      requirement: '30-day streak'
    },
    '100-day-streak': {
      name: 'Streak Centurion',
      description: 'Maintained a 100-day study streak',
      icon: '🔥',
      color: theme.gold || '#ffd700',
      category: 'streaks',
      requirement: '100-day streak'
    },
    
    // Pomodoro badges
    'pomodoro-beginner': {
      name: 'Pomodoro Novice',
      description: 'Completed 10 Pomodoro sessions',
      icon: '🍅',
      color: theme.bronze || '#cd7f32',
      category: 'pomodoro',
      requirement: '10 sessions'
    },
    'pomodoro-master': {
      name: 'Pomodoro Master',
      description: 'Completed 50 Pomodoro sessions',
      icon: '⏱️',
      color: theme.silver || '#c0c0c0',
      category: 'pomodoro',
      requirement: '50 sessions'
    },
    'pomodoro-expert': {
      name: 'Pomodoro Expert',
      description: 'Completed 100 Pomodoro sessions',
      icon: '🎯',
      color: theme.gold || '#ffd700',
      category: 'pomodoro',
      requirement: '100 sessions'
    }
  };
  
  // Handle badge click to view details
  const handleBadgeClick = (badgeId) => {
    setSelectedBadge(selectedBadge === badgeId ? null : badgeId);
  };
  
  // Group badges by category
  const getBadgesByCategory = () => {
    const categories = {};
    
    Object.keys(badgeData).forEach(badgeId => {
      const badge = badgeData[badgeId];
      const category = badge.category || 'other';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push({ id: badgeId, ...badge });
    });
    
    return categories;
  };
  
  const badgesByCategory = getBadgesByCategory();
  
  // Layout settings
  const gridTemplateColumns = {
    grid: 'repeat(auto-fill, minmax(220px, 1fr))',
    list: '1fr'
  };

  return (
    <div style={{
      backgroundColor: theme.card,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      color: theme.text,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          margin: 0
        }}>
          {title || 'Achievements'}
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '14px',
        }}>
          <span style={{ fontSize: '16px' }}>🏆</span>
          <span style={{ fontWeight: 600 }}>
            {earnedBadges.length} / {Object.keys(badgeData).length}
          </span>
        </div>
      </div>
      
      {/* Badges by Category */}
      {Object.keys(badgesByCategory).map(category => (
        <div key={category} style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 12px 0',
            color: theme.primary,
            textTransform: 'capitalize',
          }}>
            {category} Badges
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridTemplateColumns[layout],
            gap: '15px',
          }}>
            {badgesByCategory[category].map(badge => {
              const isEarned = earnedBadges.includes(badge.id);
              
              return (
                <div 
                  key={badge.id}
                  onClick={() => handleBadgeClick(badge.id)}
                  style={{
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    opacity: isEarned ? 1 : 0.5,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    border: selectedBadge === badge.id 
                      ? `2px solid ${badge.color}` 
                      : '2px solid transparent',
                    transform: selectedBadge === badge.id 
                      ? 'scale(1.02)' 
                      : 'scale(1)',
                  }}
                >
                  {/* Badge Icon */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: `${badge.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '24px',
                  }}>
                    {badge.icon}
                  </div>
                  
                  {/* Badge Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      marginBottom: '5px',
                      color: isEarned ? badge.color : theme.text,
                    }}>
                      {badge.name}
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      opacity: 0.8,
                    }}>
                      {selectedBadge === badge.id ? badge.description : badge.requirement}
                    </div>
                  </div>
                  
                  {/* Badge Status */}
                  {isEarned && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: badge.color,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeDisplay; 