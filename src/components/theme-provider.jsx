import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = ['cero', 'ocean', 'sunset', 'forest', 'minimal'];

const MOBILE_THEME_COLORS = {
  cero: { light: '#f1f6ff', dark: '#020617' },
  ocean: { light: '#dff6ff', dark: '#041221' },
  sunset: { light: '#fff0df', dark: '#24100b' },
  forest: { light: '#e9fff4', dark: '#06170f' },
  minimal: { light: '#f8fafc', dark: '#020617' },
};

function updateBrowserThemeColor(resolvedTheme, style) {
  if (typeof window === 'undefined') return;

  const safeStyle = VALID_THEME_STYLES.includes(style) ? style : 'cero';
  const safeMode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const color = MOBILE_THEME_COLORS[safeStyle]?.[safeMode] || MOBILE_THEME_COLORS.cero[safeMode];

  document.documentElement.style.setProperty('--app-mobile-system-color', color);

  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeColor) {
    themeColor.setAttribute('content', color);
  }
}

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

function applyTheme(mode, style = getStoredThemeStyle()) {
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

  updateBrowserThemeColor(resolvedTheme, style);

  return resolvedTheme;
}

function applyThemeStyle(style) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = VALID_THEME_STYLES.includes(style) ? style : 'cero';

  VALID_THEME_STYLES.forEach((item) => {
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
    const resolved = applyTheme(theme, themeStyle);
    setResolvedTheme(resolved);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, themeStyle]);

  useEffect(() => {
    applyThemeStyle(themeStyle);
    updateBrowserThemeColor(resolvedTheme, themeStyle);
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
        const resolved = applyTheme('system', themeStyle);
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
