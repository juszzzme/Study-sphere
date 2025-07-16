import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const StreakCalendar = ({ studyDates = [], currentStreak = 0, title }) => {
  const { theme, darkMode } = useTheme();
  const [calendarData, setCalendarData] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [year, setYear] = useState('');
  
  // Generate calendar data for the current month
  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of month and total days in month
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create array of day objects
    const days = [];
    
    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isStudyDay: false });
    }
    
    // Generate actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      date.setHours(0, 0, 0, 0);
      
      // Check if this day is in the study dates
      const isStudyDay = studyDates.some(studyDate => {
        if (!studyDate) return false;
        
        const d = new Date(studyDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      });
      
      days.push({
        day: i,
        date,
        isStudyDay,
        isToday: i === today.getDate() && 
                 currentMonth === today.getMonth() && 
                 currentYear === today.getFullYear(),
        isPast: date < today
      });
    }
    
    // Get month name and year
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    setMonthName(months[currentMonth]);
    setYear(currentYear);
    setCalendarData(days);
  }, [studyDates]);

  // Detect consecutive study days to highlight streaks
  const getStreakStatus = (day, index) => {
    if (!day.isStudyDay || !day.day) return false;
    
    // Look at the previous day
    const prevDay = index > 0 ? calendarData[index - 1] : null;
    const isPartOfStreak = prevDay && prevDay.isStudyDay;
    
    return isPartOfStreak ? 'middle' : 'start';
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
        marginBottom: '15px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          margin: 0
        }}>
          {title || `${monthName} ${year}`}
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
          <span style={{ 
            color: theme.yellow,
            fontSize: '16px'
          }}>🔥</span>
          <span style={{ fontWeight: 600 }}>
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
      
      {/* Weekday Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '8px',
        fontWeight: 600,
        fontSize: '13px',
        textAlign: 'center',
        color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
      }}>
        {calendarData.map((day, index) => {
          const streakStatus = getStreakStatus(day, index);
          
          return (
            <div 
              key={index} 
              style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                color: day.isStudyDay 
                  ? '#fff' 
                  : day.isPast 
                    ? darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                    : darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                fontWeight: day.isToday ? 600 : 400,
                fontSize: '14px',
                opacity: !day.day ? 0 : 1,
              }}
            >
              {/* Streak connector line */}
              {streakStatus && (
                <div style={{
                  position: 'absolute',
                  height: '4px',
                  backgroundColor: theme.coral,
                  left: streakStatus === 'middle' ? '-50%' : '50%',
                  width: streakStatus === 'middle' ? '100%' : '50%',
                  zIndex: 1,
                }} />
              )}
              
              {/* Day circle */}
              {day.day && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: day.isStudyDay 
                    ? theme.coral
                    : 'transparent',
                  border: day.isToday 
                    ? `2px solid ${theme.yellow}`
                    : 'none',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                }}>
                  {day.day}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div style={{
        marginTop: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        fontSize: '12px',
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: theme.coral,
          }} />
          <span>Study Day</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            border: `2px solid ${theme.yellow}`,
          }} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCalendar; 