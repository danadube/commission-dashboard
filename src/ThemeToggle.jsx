import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeContext';

/**
 * Theme Toggle Component
 * Allows users to switch between light, dark, and system themes
 */

const ThemeToggle = () => {
  const { themeMode, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${themeMode === value
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
          title={`${label} theme`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;

