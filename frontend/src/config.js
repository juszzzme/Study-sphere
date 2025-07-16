/**
 * Application Configuration
 * 
 * This file contains all the configuration values for the application.
 * Edit these values according to your environment.
 */

// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006';

// Application metadata
export const APP_CONFIG = {
  name: 'Study Sphere',
  version: '2.0.0',
  description: 'A comprehensive study platform for efficient learning',
  author: 'Study Sphere Team',
  supportEmail: 'support@studysphere.edu',
};

// Feature flags (enable/disable features)
export const FEATURES = {
  chat: true,
  pomodoro: true,
  gamification: true,
  resourceHub: true,
  notifications: true,
  darkMode: true,
};

// Gamification settings
export const GAMIFICATION = {
  xpPerStudyHour: 10,
  xpPerStreak: 50,
  xpPerPomodoro: 5,
  // Badges IDs must match backend
  badges: {
    studyHours: ['100-hours', '500-hours', '1000-hours'],
    streaks: ['7-day-streak', '30-day-streak', '100-day-streak'],
    pomodoro: ['pomodoro-beginner', 'pomodoro-master', 'pomodoro-expert'],
  },
  // Minimum pomodoro sessions needed for each badge
  pomodoroThresholds: {
    'pomodoro-beginner': 10,
    'pomodoro-master': 50,
    'pomodoro-expert': 100,
  },
};

// Pomodoro timer settings
export const POMODORO = {
  defaultWorkMinutes: 25,
  defaultShortBreakMinutes: 5,
  defaultLongBreakMinutes: 15,
  longBreakInterval: 4, // After how many work sessions to take a long break
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

// API Endpoints (paths relative to API_BASE_URL)
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    USER: '/api/auth/user',
    PROFILE: '/api/auth/profile',
  },
  RESOURCES: {
    ALL: '/api/resources',
    BY_ID: (id) => `/api/resources/${id}`,
    UPLOAD: '/api/resources/upload',
    CONTENT: (id) => `/api/resources/${id}/content`,
    DOWNLOAD: (id) => `/api/resources/download/${id}`,
    SEARCH: '/api/resources/search',
  },
  CHAT: {
    ROOMS: '/api/chat/rooms',
    ROOM: (id) => `/api/chat/rooms/${id}`,
    MESSAGES: (roomId) => `/api/chat/messages/${roomId}`,
    SEND: '/api/chat/messages',
    JOIN: (roomId) => `/api/chat/rooms/${roomId}/join`,
    LEAVE: (roomId) => `/api/chat/rooms/${roomId}/leave`,
  },
  GAMIFICATION: {
    STATS: '/api/gamification/stats',
    STUDY_HOURS: '/api/gamification/study-hours',
    STREAK: '/api/gamification/streak',
    RESET: '/api/gamification/reset',
  },
  POMODORO: {
    COMPLETE: '/api/pomodoro/complete',
    HISTORY: '/api/pomodoro/history',
  },
}; 