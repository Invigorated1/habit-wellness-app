'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'terminalGreen' | 'terminalWhite' | 'notebook';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'ui.theme';
const DEFAULT_THEME: Theme = 'terminalGreen';

const THEME_CYCLE: Theme[] = ['terminalGreen', 'terminalWhite', 'notebook'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage or URL param on mount
  useEffect(() => {
    setMounted(true);
    
    // Check URL params first
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get('theme') as Theme | null;
    
    if (urlTheme && THEME_CYCLE.includes(urlTheme)) {
      setThemeState(urlTheme);
      localStorage.setItem(THEME_KEY, urlTheme);
      // Remove the query param to clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('theme');
      window.history.replaceState({}, '', newUrl);
    } else {
      // Load from localStorage
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (savedTheme && THEME_CYCLE.includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Keyboard shortcut component
export function ThemeKeyboardShortcut() {
  const { cycleTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cycleTheme]);

  return null;
}