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
      primary: '221 83% 53%',
      primaryForeground: '0 0% 100%',
      themeColor: '#EEF4FF',
      surface: 'hsl(221 100% 96%)',
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      card: '225 100% 99%',
      popover: '225 100% 99%',
      border: '226 62% 86%',
      muted: '225 55% 94%',
      accent: '226 65% 93%',
    },
    dark: {
      primary: '263 75% 62%',
      primaryForeground: '0 0% 100%',
      themeColor: '#0B1026',
      surface: 'hsl(230 56% 8%)',
      background: 'linear-gradient(135deg, #1E40AF 0%, #6D28D9 100%)',
      card: '230 44% 12%',
      popover: '230 44% 12%',
      border: '233 28% 24%',
      muted: '231 32% 16%',
      accent: '233 34% 18%',
    },
  },
  aurora: {
    light: {
      primary: '187 96% 34%',
      primaryForeground: '0 0% 100%',
      themeColor: '#E8FBFC',
      surface: 'hsl(186 78% 96%)',
      background: 'linear-gradient(135deg, #0F766E 0%, #0284C7 100%)',
      card: '186 90% 99%',
      popover: '186 90% 99%',
      border: '185 45% 82%',
      muted: '186 50% 93%',
      accent: '185 58% 91%',
    },
    dark: {
      primary: '184 78% 44%',
      primaryForeground: '0 0% 100%',
      themeColor: '#041A1D',
      surface: 'hsl(190 58% 8%)',
      background: 'linear-gradient(135deg, #115E59 0%, #0369A1 100%)',
      card: '188 46% 11%',
      popover: '188 46% 11%',
      border: '185 26% 23%',
      muted: '188 34% 15%',
      accent: '187 38% 17%',
    },
  },
  sunset: {
    light: {
      primary: '347 77% 50%',
      primaryForeground: '0 0% 100%',
      themeColor: '#FFF1F0',
      surface: 'hsl(14 100% 96%)',
      background: 'linear-gradient(135deg, #E11D48 0%, #EA580C 100%)',
      card: '12 100% 99%',
      popover: '12 100% 99%',
      border: '11 70% 84%',
      muted: '12 72% 94%',
      accent: '11 82% 92%',
    },
    dark: {
      primary: '12 74% 53%',
      primaryForeground: '0 0% 100%',
      themeColor: '#1E0B10',
      surface: 'hsl(348 50% 8%)',
      background: 'linear-gradient(135deg, #9F1239 0%, #9A3412 100%)',
      card: '350 42% 12%',
      popover: '350 42% 12%',
      border: '356 28% 24%',
      muted: '350 34% 16%',
      accent: '355 38% 18%',
    },
  },
  emerald: {
    light: {
      primary: '158 84% 32%',
      primaryForeground: '0 0% 100%',
      themeColor: '#ECFDF5',
      surface: 'hsl(152 72% 96%)',
      background: 'linear-gradient(135deg, #15803D 0%, #0D9488 100%)',
      card: '152 78% 99%',
      popover: '152 78% 99%',
      border: '154 42% 82%',
      muted: '151 46% 93%',
      accent: '153 52% 91%',
    },
    dark: {
      primary: '162 72% 42%',
      primaryForeground: '0 0% 100%',
      themeColor: '#061A11',
      surface: 'hsl(154 50% 7%)',
      background: 'linear-gradient(135deg, #166534 0%, #115E59 100%)',
      card: '154 42% 11%',
      popover: '154 42% 11%',
      border: '154 25% 22%',
      muted: '154 32% 15%',
      accent: '155 36% 17%',
    },
  },
  obsidian: {
    light: {
      primary: '215 20% 44%',
      primaryForeground: '0 0% 100%',
      themeColor: '#F1F5F9',
      surface: 'hsl(210 40% 96%)',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      card: '210 40% 99%',
      popover: '210 40% 99%',
      border: '214 32% 84%',
      muted: '214 32% 93%',
      accent: '214 30% 91%',
    },
    dark: {
      primary: '215 25% 72%',
      primaryForeground: '222 47% 8%',
      themeColor: '#020617',
      surface: 'hsl(222 47% 5%)',
      background: 'linear-gradient(135deg, #0F172A 0%, #020617 100%)',
      card: '222 38% 9%',
      popover: '222 38% 9%',
      border: '217 30% 17%',
      muted: '217 33% 13%',
      accent: '217 33% 16%',
    },
  },
};

function normalizeThemeStyle(style) {
  if (VALID_THEME_STYLES.includes(style)) return style;
  return LEGACY_THEME_STYLE_MAP[style] || 'aurora';
}

function syncSystemBarColor() {
  if (typeof window === 'undefined') return;

  document.querySelectorAll('meta[name="theme-color"]').forEach((themeColor) => {
    themeColor.setAttribute('content', APP_SYSTEM_BAR_COLOR);
  });
}

function applyThemeVariables(style, resolvedTheme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = normalizeThemeStyle(style);
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const tokens = THEME_STYLE_TOKENS[safeStyle][mode];

  root.style.setProperty('--app-page-gradient', tokens.background);
  root.style.setProperty('--background', tokens.surface.replace(/^hsl\((.*)\)$/, '$1'));
  root.style.setProperty('--card', tokens.card);
  root.style.setProperty('--popover', tokens.popover);
  root.style.setProperty('--border', tokens.border);
  root.style.setProperty('--input', tokens.border);
  root.style.setProperty('--muted', tokens.muted);
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-foreground', tokens.primaryForeground);
  root.style.setProperty('--ring', tokens.primary);
  root.style.setProperty('--chart-1', tokens.primary);
  root.style.setProperty('--sidebar-background', tokens.card);
  root.style.setProperty('--sidebar-accent', tokens.accent);
  root.style.setProperty('--sidebar-border', tokens.border);
  root.style.setProperty('--sidebar-primary', tokens.primary);
  root.style.setProperty('--sidebar-primary-foreground', tokens.primaryForeground);
  root.style.setProperty('--sidebar-ring', tokens.primary);

  syncSystemBarColor();
}

function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(savedTheme) ? savedTheme : 'system';
}

function getStoredThemeStyle() {
  if (typeof window === 'undefined') return 'cero';

  const savedThemeStyle = localStorage.getItem(THEME_STYLE_STORAGE_KEY);
  return normalizeThemeStyle(savedThemeStyle);
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

  syncSystemBarColor();

  return resolvedTheme;
}

function applyThemeStyle(style) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = normalizeThemeStyle(style);

  [...VALID_THEME_STYLES, ...Object.keys(LEGACY_THEME_STYLE_MAP)].forEach((item) => {
    root.classList.remove(`theme-style-${item}`);
  });

  root.classList.add(`theme-style-${safeStyle}`);
  root.dataset.themeStyle = safeStyle;
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
    setResolvedTheme(resolved);
    applyThemeVariables(themeStyle, resolved);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, themeStyle]);

  useEffect(() => {
    applyThemeStyle(themeStyle);
    applyThemeVariables(themeStyle, resolvedTheme);
    localStorage.setItem(THEME_STYLE_STORAGE_KEY, themeStyle);
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
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
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

    return () => {
      document.removeEventListener('click', handleHapticClick);
    };
  }, [hapticsEnabled]);

  const setTheme = (newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
  };

  const setThemeStyle = (newThemeStyle) => {
    const safeThemeStyle = normalizeThemeStyle(newThemeStyle);
    setThemeStyleState(safeThemeStyle);
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
