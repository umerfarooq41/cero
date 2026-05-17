import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';

function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (
    savedTheme === 'system' ||
    savedTheme === 'light' ||
    savedTheme === 'dark'
  ) {
    return savedTheme;
  }

  return 'system';
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(mode) {
  if (typeof window === 'undefined') return 'light';

  const root = document.documentElement;
  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;

  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const favicon = document.getElementById('favicon');

  if (favicon) {
    favicon.href =
      resolvedTheme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
  }

  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeColor) {
    themeColor.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#020617' : '#f8fafc'
    );
  }

  return resolvedTheme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    applyTheme(getStoredTheme())
  );

  useEffect(() => {
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const resolved = applyTheme('system');
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  const setTheme = (newTheme) => {
    if (
      newTheme !== 'system' &&
      newTheme !== 'light' &&
      newTheme !== 'dark'
    ) {
      return;
    }

    setThemeState(newTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      isDark: resolvedTheme === 'dark',
    }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}