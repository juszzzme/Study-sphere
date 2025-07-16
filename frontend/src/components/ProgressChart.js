import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ProgressChart = ({ data, title, height = 300, animated = true }) => {
  const { theme, darkMode } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [maxValue, setMaxValue] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Default data structure
  const defaultData = [
    { label: 'Mon', value: 2.5, color: theme.coral },
    { label: 'Tue', value: 3.0, color: theme.coral },
    { label: 'Wed', value: 1.5, color: theme.coral },
    { label: 'Thu', value: 4.0, color: theme.coral },
    { label: 'Fri', value: 2.0, color: theme.coral },
    { label: 'Sat', value: 0.5, color: theme.coral },
    { label: 'Sun', value: 1.0, color: theme.coral },
  ];

  // Handle data initialization
  useEffect(() => {
    // Use provided data or default
    const dataToUse = data || defaultData;
    
    // Find maximum value for scaling
    const max = Math.max(...dataToUse.map(item => item.value));
    setMaxValue(max === 0 ? 1 : max); // Avoid division by zero
    
    setChartData(dataToUse);
    
    // Reset animation
    setAnimationProgress(0);
    
    // Trigger animation
    if (animated) {
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [data, defaultData, animated]);

  return (
    <div className="chart-container" style={{
      backgroundColor: theme.card,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      height: height ? `${height}px` : 'auto',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Chart Title */}
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '20px',
        color: theme.text,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{title || 'Study Hours'}</span>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 400,
          opacity: 0.7,
        }}>
          Max: {maxValue.toFixed(1)}h
        </span>
      </div>
      
      {/* Chart Grid */}
      <div style={{
        height: 'calc(100% - 60px)',
        position: 'relative',
        paddingBottom: '30px',
      }}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
          <div 
            key={tick} 
            style={{
              position: 'absolute',
              width: '100%',
              borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              left: 0,
              bottom: `calc(${tick * 100}% + 30px)`,
              zIndex: 1,
            }}
          />
        ))}
        
        {/* Y-axis labels */}
        <div style={{
          position: 'absolute',
          left: 0,
          bottom: '30px',
          top: 0,
          display: 'flex',
          flexDirection: 'column-reverse',
          justifyContent: 'space-between',
          paddingRight: '10px',
          zIndex: 2,
        }}>
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <div 
              key={tick} 
              style={{
                fontSize: '12px',
                color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                transform: 'translateY(50%)',
              }}
            >
              {(tick * maxValue).toFixed(1)}
            </div>
          ))}
        </div>
        
        {/* Bars Container */}
        <div style={{
          display: 'flex',
          height: '100%',
          alignItems: 'flex-end',
          paddingLeft: '30px',
          position: 'relative',
          zIndex: 3,
        }}>
          {chartData.map((item, index) => {
            const barHeight = item.value / maxValue * 100;
            const animatedHeight = barHeight * animationProgress;
            
            return (
              <div 
                key={index} 
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  position: 'relative',
                }}
              >
                {/* Bar */}
                <div style={{
                  width: '60%',
                  height: `${animatedHeight}%`,
                  backgroundColor: item.color || theme.coral,
                  borderRadius: '4px 4px 0 0',
                  transition: animated ? 'height 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                  position: 'relative',
                  minHeight: item.value > 0 ? '4px' : '0',
                }}>
                  {/* Value Label */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: item.color || theme.coral,
                    opacity: animationProgress,
                    transition: 'opacity 0.3s ease',
                  }}>
                    {item.value.toFixed(1)}
                  </div>
                </div>
                
                {/* X-axis Label */}
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: theme.text,
                  position: 'absolute',
                  bottom: '-25px',
                  textAlign: 'center',
                }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart; 