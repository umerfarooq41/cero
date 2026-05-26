import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';
const APP_SYSTEM_BAR_COLOR = '#0a0a1a';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = [
  'cyber-indigo',
  'aurora-bloom',
  'sunset-rose',
  'emerald-forest',
  'desert-quartz',
  'cyberpunk-horizon',
];

const LEGACY_THEME_STYLE_MAP = {
  cero: 'aurora-bloom',
  ocean: 'aurora-bloom',
  cyber: 'cyber-indigo',
  indigo: 'cyber-indigo',
  aurora: 'aurora-bloom',
  sunset: 'sunset-rose',
  rose: 'sunset-rose',
  forest: 'emerald-forest',
  emerald: 'emerald-forest',
  sage: 'emerald-forest',
  quartz: 'desert-quartz',
  desert: 'desert-quartz',
  horizon: 'cyberpunk-horizon',
  minimal: 'desert-quartz',
  obsidian: 'desert-quartz',
  'warm-aurora': 'desert-quartz',
  'vibrant-fluid': 'cyberpunk-horizon',
  'ai-minimal': 'aurora-bloom',
  'energy-action': 'sunset-rose',
};

const THEME_STYLE_TOKENS = {
  'cyber-indigo': {
    light: {
      primary: '243 75% 55%',
      primaryForeground: '0 0% 100%',
      ring: '243 75% 55%',
      chart1: '243 75% 55%',
      background: '232 64% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '226 28% 24%',
      mutedForeground: '224 12% 42%',
      gradient: 'radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.36) 0%, rgba(37, 99, 235, 0) 46%), radial-gradient(circle at 88% 14%, rgba(124, 58, 237, 0.32) 0%, rgba(124, 58, 237, 0) 48%), radial-gradient(circle at 56% 100%, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 48%), linear-gradient(135deg, #eef2ff 0%, #e0e7ff 46%, #ddd6fe 100%)',
      start: '#eef2ff',
      end: '#ddd6fe',
      before: 'none',
      after: 'none',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'floatOrbOne 34s infinite alternate ease-in-out',
      afterAnimation: 'floatOrbTwo 30s infinite alternate ease-in-out',
      bgSize: 'cover',
    },
    dark: {
      primary: '245 94% 68%',
      primaryForeground: '222 47% 7%',
      ring: '245 94% 68%',
      chart1: '245 94% 68%',
      background: '245 64% 4%',
      foreground: '210 40% 98%',
      card: '245 42% 8%',
      popover: '245 42% 8%',
      sidebarForeground: '232 24% 82%',
      mutedForeground: '232 18% 70%',
      gradient: 'radial-gradient(circle at 0% 0%, rgba(67, 56, 202, 0.25) 0%, rgba(67, 56, 202, 0) 38%), radial-gradient(circle at 100% 100%, rgba(49, 46, 129, 0.22) 0%, rgba(49, 46, 129, 0) 42%), linear-gradient(135deg, #030211 0%, #080721 100%)',
      start: '#030211',
      end: '#080721',
      before: 'none',
      after: 'none',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  'aurora-bloom': {
    light: {
      primary: '199 88% 42%',
      primaryForeground: '0 0% 100%',
      ring: '199 88% 42%',
      chart1: '199 88% 42%',
      background: '210 60% 99%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'radial-gradient(circle at 2% 12%, rgba(14, 165, 233, 0.36) 0%, rgba(14, 165, 233, 0) 42%), radial-gradient(circle at 92% 4%, rgba(20, 184, 166, 0.34) 0%, rgba(20, 184, 166, 0) 44%), radial-gradient(circle at 54% 100%, rgba(244, 114, 182, 0.16) 0%, rgba(244, 114, 182, 0) 42%), linear-gradient(135deg, #ecfeff 0%, #dbeafe 46%, #ccfbf1 100%)',
      start: '#ecfeff',
      end: '#ccfbf1',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'meshShift 42s infinite alternate ease-in-out',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: '135% 135%',
    },
    dark: {
      primary: '184 90% 56%',
      primaryForeground: '222 47% 7%',
      ring: '184 90% 56%',
      chart1: '184 90% 56%',
      background: '222 47% 4%',
      foreground: '210 40% 98%',
      card: '222 38% 8%',
      popover: '222 38% 8%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.24) 0%, rgba(37, 99, 235, 0) 38%), radial-gradient(circle at 100% 8%, rgba(147, 51, 234, 0.20) 0%, rgba(147, 51, 234, 0) 34%), linear-gradient(135deg, #020617 0%, #080d1c 48%, #030712 100%)',
      start: '#020617',
      end: '#030712',
      before: 'none',
      after: 'none',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  'sunset-rose': {
    light: {
      primary: '343 81% 50%',
      primaryForeground: '0 0% 100%',
      ring: '343 81% 50%',
      chart1: '343 81% 50%',
      background: '350 100% 99%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.34) 0%, rgba(225, 29, 72, 0) 46%), radial-gradient(circle at 14% 88%, rgba(234, 88, 12, 0.34) 0%, rgba(234, 88, 12, 0) 48%), radial-gradient(circle at 48% 22%, rgba(251, 191, 36, 0.16) 0%, rgba(251, 191, 36, 0) 42%), linear-gradient(135deg, #fff1f2 0%, #ffedd5 50%, #fee2e2 100%)',
      start: '#fff1f2',
      end: '#fee2e2',
      before: 'none',
      after: 'none',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'floatOrbOne 36s infinite alternate ease-in-out',
      afterAnimation: 'floatOrbTwo 32s infinite alternate ease-in-out',
      bgSize: 'cover',
    },
    dark: {
      primary: '345 88% 64%',
      primaryForeground: '222 47% 7%',
      ring: '345 88% 64%',
      chart1: '345 88% 64%',
      background: '345 60% 5%',
      foreground: '210 40% 98%',
      card: '345 42% 8%',
      popover: '345 42% 8%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.22) 0%, rgba(225, 29, 72, 0) 42%), linear-gradient(135deg, #120309 0%, #1c0510 100%)',
      start: '#120309',
      end: '#1c0510',
      before: 'none',
      after: 'none',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  'emerald-forest': {
    light: {
      primary: '160 84% 33%',
      primaryForeground: '0 0% 100%',
      ring: '160 84% 33%',
      chart1: '160 84% 33%',
      background: '145 76% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'radial-gradient(circle at 50% 0%, rgba(13, 148, 136, 0.36) 0%, rgba(13, 148, 136, 0) 46%), radial-gradient(circle at 8% 86%, rgba(22, 163, 74, 0.30) 0%, rgba(22, 163, 74, 0) 48%), radial-gradient(circle at 92% 78%, rgba(132, 204, 22, 0.14) 0%, rgba(132, 204, 22, 0) 44%), linear-gradient(135deg, #ecfdf5 0%, #d1fae5 52%, #ccfbf1 100%)',
      start: '#ecfdf5',
      end: '#ccfbf1',
      before: 'none',
      after: 'none',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'gentlePulse 18s infinite alternate ease-in-out',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      primary: '160 84% 48%',
      primaryForeground: '222 47% 7%',
      ring: '160 84% 48%',
      chart1: '160 84% 48%',
      background: '150 70% 3%',
      foreground: '210 40% 98%',
      card: '150 42% 7%',
      popover: '150 42% 7%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'radial-gradient(circle at 50% 0%, rgba(4, 120, 87, 0.20) 0%, rgba(4, 120, 87, 0) 48%), linear-gradient(135deg, #020805 0%, #04140e 100%)',
      start: '#020805',
      end: '#04140e',
      before: 'none',
      after: 'none',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  'desert-quartz': {
    light: {
      primary: '25 82% 51%',
      primaryForeground: '0 0% 100%',
      ring: '25 82% 51%',
      chart1: '25 82% 51%',
      background: '34 100% 98%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'radial-gradient(circle at 22% 14%, rgba(234, 88, 12, 0.34) 0%, rgba(234, 88, 12, 0) 46%), radial-gradient(circle at 84% 82%, rgba(217, 119, 6, 0.30) 0%, rgba(217, 119, 6, 0) 48%), radial-gradient(circle at 52% 54%, rgba(251, 191, 36, 0.18) 0%, rgba(251, 191, 36, 0) 44%), linear-gradient(135deg, #fff7ed 0%, #fed7aa 54%, #fde68a 100%)',
      start: '#fff7ed',
      end: '#fde68a',
      before: 'none',
      after: 'none',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'floatOrbOne 40s infinite alternate ease-in-out',
      afterAnimation: 'floatOrbTwo 34s infinite alternate ease-in-out',
      bgSize: 'cover',
    },
    dark: {
      primary: '27 88% 64%',
      primaryForeground: '222 47% 7%',
      ring: '27 88% 64%',
      chart1: '27 88% 64%',
      background: '25 38% 5%',
      foreground: '210 40% 98%',
      card: '25 32% 8%',
      popover: '25 32% 8%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'radial-gradient(circle at 25% 15%, rgba(230, 137, 72, 0.22) 0%, rgba(230, 137, 72, 0) 42%), linear-gradient(135deg, #0e0a07 0%, #22150d 100%)',
      start: '#0e0a07',
      end: '#22150d',
      before: 'none',
      after: 'none',
      blend: 'screen',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  'cyberpunk-horizon': {
    light: {
      primary: '316 82% 50%',
      primaryForeground: '0 0% 100%',
      ring: '187 88% 42%',
      chart1: '316 82% 50%',
      background: '290 80% 99%',
      foreground: '222 47% 10%',
      card: '0 0% 100%',
      popover: '0 0% 100%',
      sidebarForeground: '222 24% 24%',
      mutedForeground: '220 10% 40%',
      gradient: 'radial-gradient(circle at 80% 10%, rgba(217, 70, 239, 0.40) 0%, rgba(217, 70, 239, 0) 46%), radial-gradient(circle at 10% 80%, rgba(6, 182, 212, 0.38) 0%, rgba(6, 182, 212, 0) 48%), radial-gradient(circle at 42% 10%, rgba(99, 102, 241, 0.20) 0%, rgba(99, 102, 241, 0) 42%), linear-gradient(135deg, #fae8ff 0%, #cffafe 48%, #e0e7ff 100%)',
      start: '#fae8ff',
      end: '#e0e7ff',
      before: 'none',
      after: 'none',
      blend: 'multiply',
      animation: 'none',
      beforeAnimation: 'floatOrbOne 30s infinite alternate ease-in-out',
      afterAnimation: 'floatOrbTwo 26s infinite alternate ease-in-out',
      bgSize: 'cover',
    },
    dark: {
      primary: '314 91% 66%',
      primaryForeground: '222 47% 7%',
      ring: '186 93% 48%',
      chart1: '314 91% 66%',
      background: '280 70% 4%',
      foreground: '210 40% 98%',
      card: '280 42% 7%',
      popover: '280 42% 7%',
      sidebarForeground: '215 20% 78%',
      mutedForeground: '215 16% 70%',
      gradient: 'radial-gradient(circle at 80% 10%, rgba(217, 70, 239, 0.28) 0%, rgba(217, 70, 239, 0) 46%), radial-gradient(circle at 10% 80%, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0) 46%), linear-gradient(135deg, #04010a 0%, #0c0217 100%)',
      start: '#04010a',
      end: '#0c0217',
      before: 'none',
      after: 'none',
      blend: 'screen',
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
  const tokens = THEME_STYLE_TOKENS[safeStyle]?.[mode] || THEME_STYLE_TOKENS['aurora-bloom'][mode];

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
  return LEGACY_THEME_STYLE_MAP[style] || 'aurora-bloom';
}

function getStoredThemeStyle() {
  if (typeof window === 'undefined') return 'aurora-bloom';

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

  Array.from(root.classList)
    .filter((className) => className.startsWith('theme-style-'))
    .forEach((className) => root.classList.remove(className));

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
