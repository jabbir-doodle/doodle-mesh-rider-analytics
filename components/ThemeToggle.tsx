"use client";

import React, { FC } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-button p-2 rounded-full transition-all duration-300 hover:scale-110"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" />
      )}
    </button>
  );
};

export default ThemeToggle;