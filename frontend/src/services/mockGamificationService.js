/**
 * Mock Gamification Service
 * 
 * This service provides mock data for the gamification features
 * when the backend is not available. It uses localStorage to persist data.
 */

// Initialize localStorage with default values if not present
const initializeLocalStorage = () => {
  if (!localStorage.getItem('gamification_stats')) {
    const defaultStats = {
      studyHours: 10,
      streaks: 3,
      badges: ['pomodoro-beginner'],
      lastStudyDate: new Date().toISOString(),
      level: 2,
      pomodoroSessions: 15,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('gamification_stats', JSON.stringify(defaultStats));
  }
};

// Get gamification stats
export const getGamificationStats = async () => {
  initializeLocalStorage();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const stats = JSON.parse(localStorage.getItem('gamification_stats'));
  
  // Calculate which achievements should be displayed as earned
  const earnedAchievements = [];
  const hours = stats.studyHours || 0;
  const streak = stats.streaks || 0;
  const pomodoros = stats.pomodoroSessions || 0;
  
  // Hours achievements
  if (hours >= 100) earnedAchievements.push('100-hours');
  if (hours >= 500) earnedAchievements.push('500-hours');
  if (hours >= 1000) earnedAchievements.push('1000-hours');
  
  // Streak achievements
  if (streak >= 7) earnedAchievements.push('7-day-streak');
  if (streak >= 30) earnedAchievements.push('30-day-streak');
  if (streak >= 100) earnedAchievements.push('100-day-streak');
  
  // Pomodoro achievements
  if (pomodoros >= 10) earnedAchievements.push('pomodoro-beginner');
  if (pomodoros >= 50) earnedAchievements.push('pomodoro-master');
  if (pomodoros >= 100) earnedAchievements.push('pomodoro-expert');
  
  return {
    ...stats,
    badges: earnedAchievements
  };
};

// Update study hours
export const updateStudyHours = async (hours) => {
  initializeLocalStorage();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const stats = JSON.parse(localStorage.getItem('gamification_stats'));
  stats.studyHours += hours;
  stats.lastUpdated = new Date().toISOString();
  
  localStorage.setItem('gamification_stats', JSON.stringify(stats));
  return stats;
};

// Update streak
export const updateStreak = async () => {
  initializeLocalStorage();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const stats = JSON.parse(localStorage.getItem('gamification_stats'));
  stats.streaks += 1;
  stats.lastStudyDate = new Date().toISOString();
  stats.lastUpdated = new Date().toISOString();
  
  localStorage.setItem('gamification_stats', JSON.stringify(stats));
  return stats;
};

// Update pomodoro sessions
export const updatePomodoroSessions = async () => {
  initializeLocalStorage();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const stats = JSON.parse(localStorage.getItem('gamification_stats'));
  stats.pomodoroSessions += 1;
  stats.lastUpdated = new Date().toISOString();
  
  localStorage.setItem('gamification_stats', JSON.stringify(stats));
  
  // Also store in the format PomodoroTimer uses
  const currentCount = localStorage.getItem('pomodoroSessions');
  const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
  localStorage.setItem('pomodoroSessions', newCount.toString());
  localStorage.setItem('lastPomodoroCompleted', Date.now().toString());
  
  return stats;
};

// Reset stats (for testing)
export const resetGamificationStats = async () => {
  localStorage.removeItem('gamification_stats');
  initializeLocalStorage();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return JSON.parse(localStorage.getItem('gamification_stats'));
}; 