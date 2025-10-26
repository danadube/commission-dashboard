import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Theme Context - Manages dark/light/system theme preferences
 * 
 * Supports three modes:
 * - 'light': Light theme
 * - 'dark': Dark theme  
 * - 'system': Follows system preference
 */

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get saved preference or default to 'system'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system';
  });

  // Track actual theme being used (resolved from system if mode is 'system')
  const [actualTheme, setActualTheme] = useState('dark');

  // Detect system theme preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Update actual theme based on mode
  useEffect(() => {
    const updateTheme = () => {
      let theme;
      
      if (themeMode === 'system') {
        theme = getSystemTheme();
      } else {
        theme = themeMode;
      }
      
      setActualTheme(theme);
      
      // Apply theme to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);

  // Save theme mode preference
  const setTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
  };

  const value = {
    themeMode,        // User's preference: 'light', 'dark', or 'system'
    actualTheme,      // Actual theme being used: 'light' or 'dark'
    setTheme,         // Function to change theme mode
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

