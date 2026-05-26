import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = ['cero', 'ocean', 'sunset', 'forest', 'minimal'];

const THEME_STYLE_TOKENS = {
  cero: {
    light: {
      primary: '217 91% 53%',
      primaryForeground: '0 0% 100%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(96, 165, 250, 0.24), transparent 30%),
        radial-gradient(circle at 100% 0%, rgba(244, 114, 182, 0.18), transparent 28%),
        radial-gradient(circle at 50% 100%, rgba(45, 212, 191, 0.14), transparent 32%),
        linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 246, 255, 1) 45%, rgba(255, 247, 251, 1) 100%)`,
      themeColor: '#eef6ff',
    },
    dark: {
      primary: '217 91% 60%',
      primaryForeground: '0 0% 100%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.28), transparent 30%),
        radial-gradient(circle at 100% 8%, rgba(147, 51, 234, 0.24), transparent 30%),
        radial-gradient(circle at 45% 100%, rgba(20, 184, 166, 0.14), transparent 32%),
        linear-gradient(135deg, rgba(2, 6, 23, 1) 0%, rgba(8, 13, 28, 1) 45%, rgba(3, 7, 18, 1) 100%)`,
      themeColor: '#020617',
    },
  },
  ocean: {
    light: {
      primary: '199 89% 48%',
      primaryForeground: '0 0% 100%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(14, 165, 233, 0.40), transparent 34%),
        radial-gradient(circle at 100% 0%, rgba(45, 212, 191, 0.38), transparent 34%),
        radial-gradient(circle at 52% 100%, rgba(59, 130, 246, 0.26), transparent 38%),
        linear-gradient(135deg, rgba(222, 246, 255, 1) 0%, rgba(217, 253, 244, 1) 48%, rgba(228, 240, 255, 1) 100%)`,
      themeColor: '#dff8ff',
    },
    dark: {
      primary: '188 86% 53%',
      primaryForeground: '222 47% 7%',
      gradient: `
        radial-gradient(circle at 8% 0%, rgba(14, 165, 233, 0.30), transparent 32%),
        radial-gradient(circle at 95% 8%, rgba(20, 184, 166, 0.26), transparent 30%),
        radial-gradient(circle at 45% 100%, rgba(37, 99, 235, 0.18), transparent 34%),
        linear-gradient(135deg, rgba(4, 18, 33, 1) 0%, rgba(6, 30, 43, 1) 50%, rgba(3, 7, 18, 1) 100%)`,
      themeColor: '#041221',
    },
  },
  sunset: {
    light: {
      primary: '24 95% 53%',
      primaryForeground: '0 0% 100%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(251, 146, 60, 0.38), transparent 34%),
        radial-gradient(circle at 100% 0%, rgba(244, 114, 182, 0.34), transparent 32%),
        radial-gradient(circle at 48% 100%, rgba(250, 204, 21, 0.24), transparent 38%),
        linear-gradient(135deg, rgba(255, 241, 224, 1) 0%, rgba(255, 230, 235, 1) 48%, rgba(255, 248, 213, 1) 100%)`,
      themeColor: '#fff0e6',
    },
    dark: {
      primary: '33 96% 56%',
      primaryForeground: '24 28% 9%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(249, 115, 22, 0.28), transparent 32%),
        radial-gradient(circle at 100% 5%, rgba(236, 72, 153, 0.24), transparent 30%),
        radial-gradient(circle at 45% 100%, rgba(245, 158, 11, 0.16), transparent 34%),
        linear-gradient(135deg, rgba(24, 10, 9, 1) 0%, rgba(30, 16, 30, 1) 48%, rgba(3, 7, 18, 1) 100%)`,
      themeColor: '#180a09',
    },
  },
  forest: {
    light: {
      primary: '145 63% 38%',
      primaryForeground: '0 0% 100%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.36), transparent 34%),
        radial-gradient(circle at 100% 5%, rgba(132, 204, 22, 0.30), transparent 32%),
        radial-gradient(circle at 45% 100%, rgba(20, 184, 166, 0.24), transparent 38%),
        linear-gradient(135deg, rgba(225, 251, 235, 1) 0%, rgba(240, 253, 216, 1) 46%, rgba(219, 250, 237, 1) 100%)`,
      themeColor: '#dcfce7',
    },
    dark: {
      primary: '142 71% 45%',
      primaryForeground: '145 45% 8%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.25), transparent 32%),
        radial-gradient(circle at 100% 8%, rgba(132, 204, 22, 0.18), transparent 30%),
        radial-gradient(circle at 45% 100%, rgba(20, 184, 166, 0.14), transparent 34%),
        linear-gradient(135deg, rgba(5, 20, 13, 1) 0%, rgba(9, 24, 18, 1) 48%, rgba(3, 7, 18, 1) 100%)`,
      themeColor: '#05140d',
    },
  },
  minimal: {
    light: {
      primary: '222 47% 32%',
      primaryForeground: '0 0% 100%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(148, 163, 184, 0.20), transparent 30%),
        radial-gradient(circle at 100% 0%, rgba(203, 213, 225, 0.22), transparent 28%),
        linear-gradient(135deg, rgba(246, 248, 251, 1) 0%, rgba(237, 242, 248, 1) 55%, rgba(248, 250, 252, 1) 100%)`,
      themeColor: '#f6f8fb',
    },
    dark: {
      primary: '210 40% 86%',
      primaryForeground: '222 47% 8%',
      gradient: `
        radial-gradient(circle at 0% 0%, rgba(71, 85, 105, 0.20), transparent 30%),
        radial-gradient(circle at 100% 0%, rgba(100, 116, 139, 0.14), transparent 28%),
        linear-gradient(135deg, rgba(2, 6, 23, 1) 0%, rgba(15, 23, 42, 1) 58%, rgba(3, 7, 18, 1) 100%)`,
      themeColor: '#020617',
    },
  },
};

function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(savedTheme) ? savedTheme : 'system';
}

function getStoredThemeStyle() {
  if (typeof window === 'undefined') return 'cero';

  const savedThemeStyle = localStorage.getItem(THEME_STYLE_STORAGE_KEY);
  return VALID_THEME_STYLES.includes(savedThemeStyle) ? savedThemeStyle : 'cero';
}

function getStoredBoolean(key, fallback = false) {
  if (typeof window === 'undefined') return fallback;

  const value = localStorage.getItem(key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getThemeStyleTokens(style, resolvedTheme) {
  const safeStyle = VALID_THEME_STYLES.includes(style) ? style : 'cero';
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';

  return THEME_STYLE_TOKENS[safeStyle]?.[mode] ?? THEME_STYLE_TOKENS.cero[mode];
}

function applyRuntimeThemeTokens(style, resolvedTheme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const tokens = getThemeStyleTokens(style, resolvedTheme);

  root.style.setProperty('--app-page-gradient', tokens.gradient.replace(/\s+/g, ' ').trim());
  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-foreground', tokens.primaryForeground);
  root.style.setProperty('--ring', tokens.primary);
  root.style.setProperty('--chart-1', tokens.primary);
  root.style.setProperty('--sidebar-primary', tokens.primary);
  root.style.setProperty('--sidebar-primary-foreground', tokens.primaryForeground);
  root.style.setProperty('--sidebar-ring', tokens.primary);
  root.style.setProperty('--app-mobile-bar-color', tokens.themeColor);

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', tokens.themeColor);
}

function applyTheme(mode) {
  if (typeof window === 'undefined') return 'light';

  const root = document.documentElement;
  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;

  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.dataset.resolvedTheme = resolvedTheme;

  const favicon = document.getElementById('favicon');

  if (favicon) {
    favicon.href =
      resolvedTheme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
  }

  return resolvedTheme;
}

function applyThemeStyle(style, resolvedTheme = getSystemTheme()) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = VALID_THEME_STYLES.includes(style) ? style : 'cero';

  VALID_THEME_STYLES.forEach((item) => {
    root.classList.remove(`theme-style-${item}`);
  });

  root.classList.add(`theme-style-${safeStyle}`);
  root.dataset.themeStyle = safeStyle;
  applyRuntimeThemeTokens(safeStyle, resolvedTheme);
}

function applyBooleanClass(className, enabled) {
  if (typeof window === 'undefined') return;

  document.documentElement.classList.toggle(className, Boolean(enabled));
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [themeStyle, setThemeStyleState] = useState(getStoredThemeStyle);
  const [compactMode, setCompactModeState] = useState(() =>
    getStoredBoolean(COMPACT_MODE_STORAGE_KEY, false)
  );
  const [showDecimals, setShowDecimalsState] = useState(() =>
    getStoredBoolean(SHOW_DECIMALS_STORAGE_KEY, true)
  );
  const [hapticsEnabled, setHapticsEnabledState] = useState(() =>
    getStoredBoolean(HAPTICS_STORAGE_KEY, false)
  );
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    applyTheme(getStoredTheme())
  );

  useEffect(() => {
    const resolved = applyTheme(theme);
    applyThemeStyle(themeStyle, resolved);
    setResolvedTheme(resolved);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(THEME_STYLE_STORAGE_KEY, themeStyle);
  }, [theme, themeStyle]);

  useEffect(() => {
    applyBooleanClass('compact-mode', compactMode);
    localStorage.setItem(COMPACT_MODE_STORAGE_KEY, String(compactMode));
  }, [compactMode]);

  useEffect(() => {
    applyBooleanClass('show-decimals', showDecimals);
    localStorage.setItem(SHOW_DECIMALS_STORAGE_KEY, String(showDecimals));
    window.dispatchEvent(
      new CustomEvent('cero-preferences-change', {
        detail: { showDecimals },
      })
    );
  }, [showDecimals]);

  useEffect(() => {
    localStorage.setItem(HAPTICS_STORAGE_KEY, String(hapticsEnabled));
  }, [hapticsEnabled]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const resolved = applyTheme('system');
        applyThemeStyle(themeStyle, resolved);
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, themeStyle]);

  useEffect(() => {
    if (!hapticsEnabled || typeof window === 'undefined') return undefined;

    const handleHapticClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactiveElement = target.closest(
        'button, a, [role="button"], [data-haptic="true"]'
      );

      if (!interactiveElement || typeof navigator?.vibrate !== 'function') return;

      navigator.vibrate(8);
    };

    document.addEventListener('click', handleHapticClick, { passive: true });

    return () => {
      document.removeEventListener('click', handleHapticClick);
    };
  }, [hapticsEnabled]);

  const setTheme = (newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
  };

  const setThemeStyle = (newThemeStyle) => {
    if (!VALID_THEME_STYLES.includes(newThemeStyle)) return;
    setThemeStyleState(newThemeStyle);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themeStyle,
      setThemeStyle,
      compactMode,
      setCompactMode: setCompactModeState,
      showDecimals,
      setShowDecimals: setShowDecimalsState,
      hapticsEnabled,
      setHapticsEnabled: setHapticsEnabledState,
      isDark: resolvedTheme === 'dark',
    }),
    [
      theme,
      resolvedTheme,
      themeStyle,
      compactMode,
      showDecimals,
      hapticsEnabled,
    ]
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
