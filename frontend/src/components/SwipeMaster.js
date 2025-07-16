import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import '../css/SwipeMaster.css';

const SwipeMaster = ({ darkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Optimized colors to match updated CSS theme
  const colors = {
    light: {
      primary: '#1e3d59',     // Deep blue (primary brand color)
      secondary: '#5d89ba',   // Medium blue (secondary brand color) 
      accent: '#ff6e40',      // Vibrant coral (accent color)
      yellow: '#ffc13b',      // Warm yellow (highlight color)
      red: '#d81e5b',         // Rich red (special emphasis)
      blue: '#3498db',        // Info blue (informational elements)
      text: '#333333',        // Near black (light mode text)
      background: '#f5f0e1',  // Cream background (main background)
      card: '#ffffff',        // White (light mode cards)
      border: '#eaeaea',      // Light border (light mode borders)
      correct: '#2ecc71',     // Success green (positive feedback)
      incorrect: '#e74c3c'    // Error red (negative feedback)
    },
    dark: {
      primary: '#5d89ba',     // Medium blue
      secondary: '#1e3d59',   // Deep blue
      accent: '#ff6e40',      // Vibrant coral
      yellow: '#ffc13b',      // Warm yellow
      red: '#d81e5b',         // Rich red
      blue: '#3498db',        // Info blue
      text: '#e0e0e0',        // Off-white (dark mode text)
      background: '#1a1a1a',  // Nearly black (dark mode background)
      card: '#2d2d2d',        // Dark gray (dark mode cards)
      border: '#3d3d3d',      // Medium gray (dark mode borders)
      correct: '#2ecc71',     // Success green
      incorrect: '#e74c3c'    // Error red
    }
  };
  
  const theme = darkMode ? colors.dark : colors.light;
  
  // Apply dark mode class to body if darkMode is true
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode-active');
      document.documentElement.classList.add('dark-mode-active');
    } else {
      document.body.classList.remove('dark-mode-active');
      document.documentElement.classList.remove('dark-mode-active');
    }
    
    return () => {
      document.body.classList.remove('dark-mode-active');
      document.documentElement.classList.remove('dark-mode-active');
    };
  }, [darkMode]);

  // Game states
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('loading'); // 'loading', 'ready', 'playing', 'finished'
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [highScore, setHighScore] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [themeVariation, setThemeVariation] = useState('default'); // 'default', 'crypto', 'history', 'science'
  const [showRadialWave, setShowRadialWave] = useState(false);
  
  const cardRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const dragThreshold = 100;

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await axios.get('/api/swipemaster/cards');
        if (response.data && response.data.length > 0) {
          // Shuffle the cards
          const shuffledCards = [...response.data].sort(() => Math.random() - 0.5);
          setCards(shuffledCards);
          setGameState('ready');
          
          // Set theme variation based on first card category if available
          if (shuffledCards[0]?.category) {
            const category = shuffledCards[0].category.toLowerCase();
            if (category.includes('crypto') || category.includes('tech')) {
              setThemeVariation('crypto');
            } else if (category.includes('history')) {
              setThemeVariation('history');
            } else if (category.includes('science') || category.includes('biology') || category.includes('physics')) {
              setThemeVariation('science');
            }
          }
        } else {
          setGameState('error');
          setFeedbackMessage('No cards available. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
        setGameState('error');
        setFeedbackMessage('Error loading game. Please try again.');
      }
    };
    
    fetchCards();
    
    // Fetch user's high score
    const fetchHighScore = async () => {
      try {
        const response = await axios.get('/api/swipemaster/highscore');
        if (response.data && response.data.score) {
          setHighScore(response.data.score);
        }
      } catch (error) {
        console.error('Error fetching high score:', error);
      }
    };
    
    fetchHighScore();
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setCurrentCardIndex(0);
    setFeedbackMessage('');
    setFeedbackType('');
  };

  // End the game
  const endGame = async () => {
    setGameState('finished');
    
    // Save score if it's a high score
    if (score > highScore) {
      setHighScore(score);
      try {
        await axios.post('/api/swipemaster/score', { score });
      } catch (error) {
        console.error('Error saving score:', error);
      }
    }
  };

  // Generate confetti particles
  const generateConfetti = () => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newConfetti = [];
    
    for (let i = 0; i < 30; i++) {
      const colors = ['#ff2d71', '#03e9f4', '#39ff14', '#9d4edd', '#fff'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 5;
      const x = Math.random() * containerRect.width;
      const delay = Math.random() * 3;
      const duration = Math.random() * 2 + 3;
      
      newConfetti.push({
        id: i,
        color: randomColor,
        size,
        x,
        duration,
        delay
      });
    }
    
    setConfetti(newConfetti);
    
    // Clear confetti after animation
    setTimeout(() => {
      setConfetti([]);
    }, 5000);
  };

  // Display radial wave effect
  const showRadialWaveEffect = () => {
    setShowRadialWave(true);
    setTimeout(() => setShowRadialWave(false), 1000);
  };

  // Handle card swipe
  const handleSwipe = (isRight) => {
    if (gameState !== 'playing' || isCardAnimating) return;
    
    const currentCard = cards[currentCardIndex];
    const isCorrect = (isRight === currentCard.isCorrect);
    
    setIsCardAnimating(true);
    
    // Animate card exit
    setCardPosition({
      x: isRight ? 1500 : -1500,
      y: 0,
      rotation: isRight ? 30 : -30
    });
    
    // Show feedback
    if (isCorrect) {
      setFeedbackMessage('Correct!');
      setFeedbackType('correct');
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        // Show streak animation for streaks of 3 or more
        if (newStreak >= 3) {
          setShowStreakAnimation(true);
          setTimeout(() => setShowStreakAnimation(false), 1500);
        }
        return newStreak;
      });
      
      // Show only radial wave for correct answers in vintage style
      showRadialWaveEffect();
    } else {
      setFeedbackMessage('Wrong!');
      setFeedbackType('incorrect');
      setScore(prev => Math.max(0, prev - 1));
      setStreak(0);
    }
    
    // Move to next card after animation
    setTimeout(() => {
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setCardPosition({ x: 0, y: 0, rotation: 0 });
        setFeedbackMessage('');
        setFeedbackType('');
        
        // Update theme variation based on next card category
        const nextCard = cards[currentCardIndex + 1];
        if (nextCard?.category) {
          const category = nextCard.category.toLowerCase();
          if (category.includes('crypto') || category.includes('tech')) {
            setThemeVariation('crypto');
          } else if (category.includes('history')) {
            setThemeVariation('history');
          } else if (category.includes('science') || category.includes('biology') || category.includes('physics')) {
            setThemeVariation('science');
          } else {
            setThemeVariation('default');
          }
        }
      } else {
        endGame();
      }
      setIsCardAnimating(false);
    }, 500);
  };

  // Mouse/Touch handlers for drag
  const handleDragStart = (e) => {
    if (gameState !== 'playing') return;
    
    setIsDragging(true);
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    setStartPoint({ x: clientX, y: clientY });
  };

  const handleDragMove = (e) => {
    if (!isDragging || gameState !== 'playing') return;
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const deltaX = clientX - startPoint.x;
    const deltaY = clientY - startPoint.y;
    
    // Calculate rotation based on drag distance
    const rotation = deltaX * 0.1;
    
    setCardPosition({
      x: deltaX,
      y: deltaY,
      rotation
    });
    
    // Change card border color based on swipe direction
    if (cardRef.current) {
      if (deltaX > 50) {
        // Right swipe - green glow
        cardRef.current.style.boxShadow = `0 0 15px 5px ${theme.correct}80`;
      } else if (deltaX < -50) {
        // Left swipe - red glow
        cardRef.current.style.boxShadow = `0 0 15px 5px ${theme.incorrect}80`;
      } else {
        // Reset
        cardRef.current.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || gameState !== 'playing') return;
    
    setIsDragging(false);
    
    // Reset card shadow
    if (cardRef.current) {
      cardRef.current.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
    }
    
    // If card was dragged beyond threshold, trigger swipe
    if (Math.abs(cardPosition.x) > dragThreshold) {
      handleSwipe(cardPosition.x > 0);
    } else {
      // Reset card position if not swiped
      setCardPosition({ x: 0, y: 0, rotation: 0 });
    }
  };

  // Render timer bar - updated to show low time warning
  const renderTimerBar = () => {
    const percentage = (timeLeft / 60) * 100;
    const isLowTime = timeLeft <= 10;
    
    return (
      <div className="timer-container">
        <div 
          className={`timer-bar ${isLowTime ? 'low' : ''}`}
          style={{ 
            width: `${percentage}%`
          }}
        ></div>
      </div>
    );
  };

  // Go back to gamified tracking
  const goBack = () => {
    navigate('/gamified-tracking');
  };

  // Render streak animation
  const renderStreakAnimation = () => {
    if (!showStreakAnimation) return null;
    
    return (
      <div className="streak-animation">
        🔥 {streak} Streak!
      </div>
    );
  };

  // Render confetti
  const renderConfetti = () => {
    return confetti.map(particle => (
      <div
        key={particle.id}
        className="confetti"
        style={{
          left: `${particle.x}px`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          backgroundColor: particle.color,
          animation: `confettiFall ${particle.duration}s ease-out ${particle.delay}s forwards`,
          borderRadius: Math.random() > 0.5 ? '50%' : '0'
        }}
      />
    ));
  };

  // Render floating particles - no longer used in vintage design
  const renderFloatingParticles = () => {
    // Return empty fragment since we're using the vintage paper texture instead
    return <></>;
  };

  // Render radial wave effect
  const renderRadialWave = () => {
    if (!showRadialWave) return null;
    
    // Use vintage checkmark animation instead of radial wave
    return <div className="feedback correct" style={{ opacity: 0.3 }}>✓</div>;
  };

  // Modified Game content renderer with vintage styles
  const renderGameContent = () => {
    switch (gameState) {
      case 'loading':
        return <div className="loading">Loading cards...</div>;
        
      case 'error':
        return (
          <div className="error-message">
            <p>{feedbackMessage}</p>
            <button onClick={goBack}>
              Go Back
            </button>
          </div>
        );
        
      case 'ready':
        return (
          <div className="start-screen">
            <h2 style={{ color: darkMode ? 'var(--warm-yellow)' : 'var(--primary-blue)' }}>
              SwipeMaster
            </h2>
            <p style={{ color: darkMode ? 'var(--text-dark)' : 'var(--text-light)' }}>
              True or False Quiz Game
            </p>
            <p style={{ color: darkMode ? 'var(--text-dark)' : 'var(--text-light)' }}>
              Swipe RIGHT for TRUE statements
            </p>
            <p style={{ color: darkMode ? 'var(--text-dark)' : 'var(--text-light)' }}>
              Swipe LEFT for FALSE statements
            </p>
            <p style={{ color: darkMode ? 'var(--text-dark)' : 'var(--text-light)' }}>
              Time limit: 60 seconds
            </p>
            
            <div style={{ margin: '20px 0', display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setThemeVariation('default')}
                style={{ 
                  padding: '8px 15px', 
                  background: themeVariation === 'default' ? 'var(--vibrant-coral)' : 'rgba(30, 61, 89, 0.1)',
                  opacity: themeVariation === 'default' ? 1 : 0.7
                }}
              >
                Default
              </button>
              <button 
                onClick={() => setThemeVariation('crypto')}
                style={{ 
                  padding: '8px 15px', 
                  background: themeVariation === 'crypto' ? 'var(--vibrant-coral)' : 'rgba(30, 61, 89, 0.1)',
                  opacity: themeVariation === 'crypto' ? 1 : 0.7
                }}
              >
                Crypto
              </button>
              <button 
                onClick={() => setThemeVariation('history')}
                style={{ 
                  padding: '8px 15px', 
                  background: themeVariation === 'history' ? 'var(--vibrant-coral)' : 'rgba(30, 61, 89, 0.1)',
                  opacity: themeVariation === 'history' ? 1 : 0.7
                }}
              >
                History
              </button>
              <button 
                onClick={() => setThemeVariation('science')}
                style={{ 
                  padding: '8px 15px', 
                  background: themeVariation === 'science' ? 'var(--vibrant-coral)' : 'rgba(30, 61, 89, 0.1)',
                  opacity: themeVariation === 'science' ? 1 : 0.7
                }}
              >
                Science
              </button>
            </div>
            
            <button onClick={startGame}>
              Start Game
            </button>
          </div>
        );
        
      case 'playing':
        return (
          <div className="game-screen">
            {renderTimerBar()}
            
            <div className="score-display">
              <div>Score: {score}</div>
              <div>🔥 Streak: {streak}</div>
              <div>⏱️ {timeLeft}s</div>
            </div>
            
            {feedbackMessage && (
              <div className={`feedback ${feedbackType}`}>
                {feedbackType === 'correct' ? '✓' : '✗'}
              </div>
            )}
            
            {renderStreakAnimation()}
            {renderRadialWave()}
            
            <div className="card-area">
              <div 
                ref={cardRef}
                className="card"
                style={{ 
                  transform: `translate(${cardPosition.x}px, ${cardPosition.y}px) rotate(${cardPosition.rotation}deg)`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  color: darkMode ? 'white' : 'var(--text-light)',
                }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                {cards[currentCardIndex]?.statement}
              </div>
            </div>
            
            <div className="swipe-instructions">
              <div className="swipe-left">
                <span>SWIPE LEFT</span>
                <span>FALSE</span>
              </div>
              <div className="swipe-right">
                <span>SWIPE RIGHT</span>
                <span>TRUE</span>
              </div>
            </div>
          </div>
        );
        
      case 'finished':
        return (
          <div className="end-screen">
            <h2 style={{ color: darkMode ? 'var(--warm-yellow)' : 'var(--primary-blue)' }}>
              GAME OVER
            </h2>
            <p style={{ color: darkMode ? 'var(--text-dark)' : 'var(--text-light)' }}>
              Your score: {score}
            </p>
            {score > highScore ? (
              <p className="new-high-score">New High Score!</p>
            ) : (
              <p style={{ color: darkMode ? 'var(--text-dark)' : 'var(--text-light)' }}>
                High score: {highScore}
              </p>
            )}
            <div className="end-buttons">
              <button onClick={startGame}>
                Play Again
              </button>
              <button onClick={goBack}>
                Back to Tracking
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Add side content for dark mode - Using direct inline styles
  const renderDarkModeSideContent = () => {
    if (!darkMode) return null;
    
    const leftPanelStyle = {
      zIndex: 999,
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      width: 'calc(50vw - 400px)',
      minWidth: '200px',
      backgroundColor: '#252525',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
    };
    
    const rightPanelStyle = {
      zIndex: 999,
      position: 'fixed',
      top: 0,
      bottom: 0,
      right: 0,
      width: 'calc(50vw - 400px)',
      minWidth: '200px',
      backgroundColor: '#252525',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
    };
    
    return (
      <>
        <div style={leftPanelStyle} className="dark-mode-side-left">
          <h3>Leaderboard</h3>
          <div className="leaderboard">
            <div className="leaderboard-entry">
              <span className="rank">1</span>
              <span className="name">Alex</span>
              <span className="score">240</span>
            </div>
            <div className="leaderboard-entry">
              <span className="rank">2</span>
              <span className="name">Taylor</span>
              <span className="score">212</span>
            </div>
            <div className="leaderboard-entry">
              <span className="rank">3</span>
              <span className="name">Jordan</span>
              <span className="score">189</span>
            </div>
            {user && (
              <div className="leaderboard-entry your-score">
                <span className="rank">?</span>
                <span className="name">You</span>
                <span className="score">{highScore}</span>
              </div>
            )}
            <div className="panel-footer">
              Keep playing to reach the top!
            </div>
          </div>
        </div>
        <div style={rightPanelStyle} className="dark-mode-side-right">
          <h3>Game Info</h3>
          <div className="categories-list">
            <div className="category-item">
              <span className="category-icon">🧪</span>
              <span className="category-name">Science</span>
            </div>
            <div className="category-item">
              <span className="category-icon">💰</span>
              <span className="category-name">Crypto</span>
            </div>
            <div className="category-item">
              <span className="category-icon">📜</span>
              <span className="category-name">History</span>
            </div>
            <div className="panel-info">
              <h4>How to Play</h4>
              <p>Swipe cards right for TRUE statements and left for FALSE statements.</p>
              <p>Earn points for correct answers and build your streak!</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {renderDarkModeSideContent()}
      <div 
        ref={containerRef}
        className={`swipemaster-container theme-${themeVariation} ${darkMode ? 'dark-mode' : ''}`}
      >
        {renderFloatingParticles()}
        {renderGameContent()}
      </div>
    </>
  );
};

export default SwipeMaster; 