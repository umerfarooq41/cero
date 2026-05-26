import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';
const APP_SYSTEM_BAR_COLOR = '#0a0a1a';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = ['cyber', 'aurora', 'sunset', 'emerald', 'obsidian'];

const LEGACY_THEME_STYLE_MAP = {
  cero: 'aurora',
  ocean: 'aurora',
  forest: 'emerald',
  minimal: 'obsidian',
};


const THEME_STYLE_TOKENS = {
  cyber: {
    light: {
      primary: '239 84% 56%',
      primaryForeground: '0 0% 100%',
      ring: '239 84% 56%',
      chart1: '239 84% 56%',
      background: '224 70% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      gradient: 'linear-gradient(135deg, #eef4ff 0%, #f6efff 100%)',
      start: '#eef4ff',
      end: '#f6efff',
    },
    dark: {
      primary: '239 84% 70%',
      primaryForeground: '0 0% 100%',
      ring: '239 84% 70%',
      chart1: '239 84% 70%',
      background: '234 48% 4%',
      foreground: '210 40% 98%',
      card: '236 36% 8%',
      popover: '236 36% 8%',
      gradient: 'linear-gradient(135deg, #020617 0%, #100b2f 100%)',
      start: '#020617',
      end: '#100b2f',
    },
  },
  aurora: {
    light: {
      primary: '184 84% 31%',
      primaryForeground: '0 0% 100%',
      ring: '184 84% 31%',
      chart1: '184 84% 31%',
      background: '186 45% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      gradient: 'linear-gradient(135deg, #e9fbf7 0%, #ebf7ff 100%)',
      start: '#e9fbf7',
      end: '#ebf7ff',
    },
    dark: {
      primary: '174 72% 58%',
      primaryForeground: '222 47% 7%',
      ring: '174 72% 58%',
      chart1: '174 72% 58%',
      background: '192 54% 4%',
      foreground: '210 40% 98%',
      card: '190 34% 8%',
      popover: '190 34% 8%',
      gradient: 'linear-gradient(135deg, #020617 0%, #042631 100%)',
      start: '#020617',
      end: '#042631',
    },
  },
  sunset: {
    light: {
      primary: '349 89% 55%',
      primaryForeground: '0 0% 100%',
      ring: '349 89% 55%',
      chart1: '349 89% 55%',
      background: '18 80% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      gradient: 'linear-gradient(135deg, #fff0f3 0%, #fff3e6 100%)',
      start: '#fff0f3',
      end: '#fff3e6',
    },
    dark: {
      primary: '349 89% 70%',
      primaryForeground: '0 0% 100%',
      ring: '349 89% 70%',
      chart1: '349 89% 70%',
      background: '350 52% 4%',
      foreground: '210 40% 98%',
      card: '350 34% 8%',
      popover: '350 34% 8%',
      gradient: 'linear-gradient(135deg, #08040a 0%, #2a0609 100%)',
      start: '#08040a',
      end: '#2a0609',
    },
  },
  emerald: {
    light: {
      primary: '158 64% 34%',
      primaryForeground: '0 0% 100%',
      ring: '158 64% 34%',
      chart1: '158 64% 34%',
      background: '152 55% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      gradient: 'linear-gradient(135deg, #eafbf1 0%, #e7fff8 100%)',
      start: '#eafbf1',
      end: '#e7fff8',
    },
    dark: {
      primary: '160 84% 50%',
      primaryForeground: '145 45% 8%',
      ring: '160 84% 50%',
      chart1: '160 84% 50%',
      background: '154 48% 4%',
      foreground: '210 40% 98%',
      card: '154 34% 8%',
      popover: '154 34% 8%',
      gradient: 'linear-gradient(135deg, #020617 0%, #04251a 100%)',
      start: '#020617',
      end: '#04251a',
    },
  },
  obsidian: {
    light: {
      primary: '215 20% 45%',
      primaryForeground: '0 0% 100%',
      ring: '215 20% 45%',
      chart1: '215 20% 45%',
      background: '215 30% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      gradient: 'linear-gradient(135deg, #f8fafc 0%, #e7edf5 100%)',
      start: '#f8fafc',
      end: '#e7edf5',
    },
    dark: {
      primary: '215 20% 74%',
      primaryForeground: '222 47% 8%',
      ring: '215 20% 74%',
      chart1: '215 20% 74%',
      background: '222 47% 4%',
      foreground: '210 40% 98%',
      card: '222 38% 8%',
      popover: '222 38% 8%',
      gradient: 'linear-gradient(135deg, #020617 0%, #080b12 100%)',
      start: '#020617',
      end: '#080b12',
    },
  },
};

function setRootVar(root, name, value) {
  root.style.setProperty(name, value);
}

function applyThemeStyleTokens(style, resolvedTheme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = normalizeThemeStyle(style);
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const tokens = THEME_STYLE_TOKENS[safeStyle]?.[mode] || THEME_STYLE_TOKENS.aurora[mode];

  setRootVar(root, '--primary', tokens.primary);
  setRootVar(root, '--primary-foreground', tokens.primaryForeground);
  setRootVar(root, '--ring', tokens.ring);
  setRootVar(root, '--chart-1', tokens.chart1);
  setRootVar(root, '--sidebar-primary', tokens.primary);
  setRootVar(root, '--sidebar-ring', tokens.ring);
  setRootVar(root, '--background', tokens.background);
  setRootVar(root, '--foreground', tokens.foreground);
  setRootVar(root, '--card', tokens.card);
  setRootVar(root, '--card-foreground', tokens.foreground);
  setRootVar(root, '--popover', tokens.popover);
  setRootVar(root, '--popover-foreground', tokens.foreground);
  setRootVar(root, '--app-page-gradient', tokens.gradient);
  setRootVar(root, '--app-canvas-start', tokens.start);
  setRootVar(root, '--app-canvas-end', tokens.end);
}

function syncSystemBarColor() {
  if (typeof window === 'undefined') return;

  document.querySelectorAll('meta[name="theme-color"]').forEach((themeColor) => {
    themeColor.setAttribute('content', APP_SYSTEM_BAR_COLOR);
  });
}

function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(savedTheme) ? savedTheme : 'system';
}

function normalizeThemeStyle(style) {
  if (VALID_THEME_STYLES.includes(style)) return style;
  return LEGACY_THEME_STYLE_MAP[style] || 'aurora';
}

function getStoredThemeStyle() {
  if (typeof window === 'undefined') return 'aurora';

  return normalizeThemeStyle(localStorage.getItem(THEME_STYLE_STORAGE_KEY));
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

function applyTheme(mode) {
  if (typeof window === 'undefined') return 'light';

  const root = document.documentElement;
  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;

  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.dataset.appearance = resolvedTheme;

  const favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.href =
      resolvedTheme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
  }

  syncSystemBarColor();
  return resolvedTheme;
}

function applyThemeStyle(style, resolvedTheme = getSystemTheme()) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = normalizeThemeStyle(style);

  VALID_THEME_STYLES.forEach((item) => {
    root.classList.remove(`theme-style-${item}`);
  });

  root.classList.add(`theme-style-${safeStyle}`);
  root.dataset.themeStyle = safeStyle;
  applyThemeStyleTokens(safeStyle, resolvedTheme);
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
  }, [theme, themeStyle]);

  useEffect(() => {
    const safeStyle = normalizeThemeStyle(themeStyle);
    applyThemeStyle(safeStyle, resolvedTheme);
    if (safeStyle !== themeStyle) {
      setThemeStyleState(safeStyle);
    }
    localStorage.setItem(THEME_STYLE_STORAGE_KEY, safeStyle);
  }, [themeStyle, resolvedTheme]);

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
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

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
    return () => document.removeEventListener('click', handleHapticClick);
  }, [hapticsEnabled]);

  const setTheme = (newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
  };

  const setThemeStyle = (newThemeStyle) => {
    setThemeStyleState(normalizeThemeStyle(newThemeStyle));
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
    [theme, resolvedTheme, themeStyle, compactMode, showDecimals, hapticsEnabled]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
