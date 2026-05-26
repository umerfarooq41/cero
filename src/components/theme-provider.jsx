import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';
const APP_SYSTEM_BAR_COLOR = '#0a0a1a';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = ['warm-aurora', 'vibrant-fluid', 'ai-minimal', 'energy-action'];

const LEGACY_THEME_STYLE_MAP = {
  cero: 'ai-minimal',
  ocean: 'ai-minimal',
  cyber: 'ai-minimal',
  aurora: 'warm-aurora',
  sunset: 'energy-action',
  forest: 'warm-aurora',
  emerald: 'warm-aurora',
  minimal: 'ai-minimal',
  obsidian: 'ai-minimal',
};

const THEME_STYLE_TOKENS = {
  'warm-aurora': {
    light: {
      primary: '35 60% 43%',
      primaryForeground: '0 0% 100%',
      ring: '35 60% 43%',
      chart1: '35 60% 43%',
      background: '40 30% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'linear-gradient(135deg, #fbfaf7 0%, #f4f2ee 100%)',
      start: '#fbfaf7',
      end: '#f4f2ee',
      before: 'radial-gradient(circle at 65% 35%, rgba(212, 163, 89, 0.26) 0%, rgba(212, 163, 89, 0) 55%)',
      after: 'radial-gradient(circle at 35% 65%, rgba(40, 45, 55, 0.08) 0%, rgba(40, 45, 55, 0) 50%)',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'floatOrbOne 28s infinite alternate ease-in-out',
      afterAnimation: 'floatOrbTwo 22s infinite alternate ease-in-out',
      bgSize: 'cover',
    },
    dark: {
      primary: '38 72% 62%',
      primaryForeground: '222 47% 7%',
      ring: '38 72% 62%',
      chart1: '38 72% 62%',
      background: '225 10% 7%',
      foreground: '210 40% 98%',
      card: '225 12% 10%',
      popover: '225 12% 10%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'linear-gradient(135deg, #08090c 0%, #121316 100%)',
      start: '#08090c',
      end: '#121316',
      before: 'radial-gradient(circle at 65% 35%, rgba(212, 163, 89, 0.18) 0%, rgba(212, 163, 89, 0) 55%)',
      after: 'radial-gradient(circle at 35% 65%, rgba(140, 155, 175, 0.08) 0%, rgba(140, 155, 175, 0) 50%)',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'floatOrbOne 28s infinite alternate ease-in-out',
      afterAnimation: 'floatOrbTwo 22s infinite alternate ease-in-out',
      bgSize: 'cover',
    },
  },
  'vibrant-fluid': {
    light: {
      primary: '184 73% 38%',
      primaryForeground: '0 0% 100%',
      ring: '184 73% 38%',
      chart1: '184 73% 38%',
      background: '20 70% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'radial-gradient(at 90% 10%, hsla(14, 93%, 69%, 0.30) 0px, transparent 54%), radial-gradient(at 10% 80%, hsla(184, 83%, 63%, 0.30) 0px, transparent 54%), radial-gradient(at 90% 80%, hsla(27, 88%, 65%, 0.20) 0px, transparent 54%), radial-gradient(at 20% 20%, hsla(210, 85%, 70%, 0.22) 0px, transparent 54%), linear-gradient(135deg, #fff5f0 0%, #ecfbff 100%)',
      start: '#fff5f0',
      end: '#ecfbff',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'meshShift 20s infinite alternate ease-in-out',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: '150% 150%',
    },
    dark: {
      primary: '190 90% 56%',
      primaryForeground: '222 47% 7%',
      ring: '190 90% 56%',
      chart1: '190 90% 56%',
      background: '260 40% 7%',
      foreground: '210 40% 98%',
      card: '260 30% 10%',
      popover: '260 30% 10%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'radial-gradient(at 90% 10%, hsla(260, 85%, 26%, 0.34) 0px, transparent 54%), radial-gradient(at 10% 80%, hsla(320, 75%, 26%, 0.26) 0px, transparent 54%), radial-gradient(at 90% 80%, hsla(190, 90%, 18%, 0.24) 0px, transparent 54%), radial-gradient(at 20% 20%, hsla(280, 80%, 28%, 0.24) 0px, transparent 54%), linear-gradient(135deg, #050411 0%, #1a0f2e 100%)',
      start: '#050411',
      end: '#1a0f2e',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'meshShift 20s infinite alternate ease-in-out',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: '150% 150%',
    },
  },
  'ai-minimal': {
    light: {
      primary: '190 95% 38%',
      primaryForeground: '0 0% 100%',
      ring: '190 95% 38%',
      chart1: '190 95% 38%',
      background: '210 40% 99%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'linear-gradient(135deg, #ffffff 0%, #f6fbff 100%)',
      start: '#ffffff',
      end: '#f6fbff',
      before: 'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.13) 0%, rgba(0, 180, 216, 0) 60%), radial-gradient(circle at 80% 40%, rgba(114, 9, 183, 0.08) 0%, rgba(114, 9, 183, 0) 50%)',
      after: 'none',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'gentlePulse 12s infinite alternate ease-in-out',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      primary: '190 95% 58%',
      primaryForeground: '222 47% 7%',
      ring: '190 95% 58%',
      chart1: '190 95% 58%',
      background: '220 42% 5%',
      foreground: '210 40% 98%',
      card: '220 34% 8%',
      popover: '220 34% 8%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'linear-gradient(135deg, #050812 0%, #090d16 100%)',
      start: '#050812',
      end: '#090d16',
      before: 'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.22) 0%, rgba(0, 180, 216, 0) 60%), radial-gradient(circle at 80% 40%, rgba(114, 9, 183, 0.18) 0%, rgba(114, 9, 183, 0) 50%)',
      after: 'none',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'gentlePulse 12s infinite alternate ease-in-out',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  'energy-action': {
    light: {
      primary: '14 88% 49%',
      primaryForeground: '0 0% 100%',
      ring: '14 88% 49%',
      chart1: '14 88% 49%',
      background: '18 55% 99%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'linear-gradient(135deg, #fff3ee 0%, #f3f4f6 65%, #ffffff 100%)',
      start: '#fff3ee',
      end: '#ffffff',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      primary: '14 82% 58%',
      primaryForeground: '222 47% 7%',
      ring: '14 82% 58%',
      chart1: '14 82% 58%',
      background: '20 18% 7%',
      foreground: '210 40% 98%',
      card: '20 18% 10%',
      popover: '20 18% 10%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'linear-gradient(135deg, #2a0d05 0%, #111113 64%, #09090b 100%)',
      start: '#2a0d05',
      end: '#09090b',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
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
  const tokens = THEME_STYLE_TOKENS[safeStyle]?.[mode] || THEME_STYLE_TOKENS['warm-aurora'][mode];

  setRootVar(root, '--primary', tokens.primary);
  setRootVar(root, '--primary-foreground', tokens.primaryForeground);
  setRootVar(root, '--ring', tokens.ring);
  setRootVar(root, '--chart-1', tokens.chart1);
  setRootVar(root, '--sidebar-primary', tokens.primary);
  setRootVar(root, '--sidebar-ring', tokens.ring);
  setRootVar(root, '--sidebar-foreground', tokens.sidebarForeground);
  setRootVar(root, '--muted-foreground', tokens.mutedForeground);
  setRootVar(root, '--background', tokens.background);
  setRootVar(root, '--foreground', tokens.foreground);
  setRootVar(root, '--card', tokens.card);
  setRootVar(root, '--card-foreground', tokens.foreground);
  setRootVar(root, '--popover', tokens.popover);
  setRootVar(root, '--popover-foreground', tokens.foreground);
  setRootVar(root, '--app-page-gradient', tokens.gradient);
  setRootVar(root, '--app-canvas-start', tokens.start);
  setRootVar(root, '--app-canvas-end', tokens.end);
  setRootVar(root, '--app-canvas-before', tokens.before || 'none');
  setRootVar(root, '--app-canvas-after', tokens.after || 'none');
  setRootVar(root, '--app-canvas-blend', tokens.blend || 'normal');
  setRootVar(root, '--app-canvas-animation', tokens.animation || 'none');
  setRootVar(root, '--app-canvas-before-animation', tokens.beforeAnimation || 'none');
  setRootVar(root, '--app-canvas-after-animation', tokens.afterAnimation || 'none');
  setRootVar(root, '--app-canvas-bg-size', tokens.bgSize || 'cover');
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
  return LEGACY_THEME_STYLE_MAP[style] || 'warm-aurora';
}

function getStoredThemeStyle() {
  if (typeof window === 'undefined') return 'warm-aurora';

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
