import React, { createContext, useState, useContext, useEffect } from 'react';

// Define color schemes
const themes = {
  light: {
    primary: '#1e3d59',    // Deep blue
    secondary: '#5d89ba',  // Medium blue
    coral: '#ff6e40',      // Vibrant coral
    yellow: '#ffc13b',     // Warm yellow
    cream: '#f5f0e1',      // Light cream
    text: '#333333',       // Near black
    textSecondary: '#555555', // Dark gray
    background: '#f5f0e1', // Light cream
    card: '#ffffff',       // White
    border: '#eaeaea',     // Light gray
    error: '#e74c3c',      // Red
    success: '#2ecc71',    // Green
    warning: '#f39c12',    // Amber
    info: '#3498db'        // Blue
  },
  dark: {
    primary: '#5d89ba',    // Medium blue
    secondary: '#1e3d59',  // Deep blue
    coral: '#ff6e40',      // Vibrant coral
    yellow: '#ffc13b',     // Warm yellow
    cream: '#2d2d2d',      // Dark gray
    text: '#e0e0e0',       // Off-white
    textSecondary: '#aaaaaa', // Light gray
    background: '#1a1a1a', // Nearly black
    card: '#2d2d2d',       // Dark gray
    border: '#3d3d3d',     // Medium gray
    error: '#e74c3c',      // Red
    success: '#2ecc71',    // Green
    warning: '#f39c12',    // Amber
    info: '#3498db'        // Blue
  }
};

// Create the theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if dark mode was saved in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : false;
  });

  // Current theme based on mode
  const theme = darkMode ? themes.dark : themes.light;

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    
    // Apply theme to body
    document.body.classList.toggle('dark-mode', darkMode);
    
    // Update CSS variables for global theme access
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  }, [darkMode, theme]);

  // Toggle between light and dark themes
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 