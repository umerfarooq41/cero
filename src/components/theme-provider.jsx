import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';
const APP_SYSTEM_BAR_COLOR = '#08090f';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = [
  'cyber',
  'aurora',
  'sunset',
  'emerald',
  'quartz',
  'horizon',
];

const LEGACY_THEME_STYLE_MAP = {
  cero: 'aurora',
  ocean: 'aurora',
  minimal: 'cyber',
  obsidian: 'cyber',
  forest: 'emerald',
  sage: 'emerald',
  warm: 'quartz',
  'warm-aurora': 'quartz',
  vibrant: 'horizon',
  'vibrant-fluid': 'horizon',
  tech: 'cyber',
  'ai-minimal': 'cyber',
  energy: 'sunset',
  'energy-action': 'sunset',
  cosmic: 'cyber',
};

const COMMON_LIGHT = {
  primaryForeground: '0 0% 100%',
  foreground: '222 47% 9%',
  card: '0 0% 100%',
  popover: '0 0% 100%',
  sidebarForeground: '222 24% 24%',
  mutedForeground: '220 10% 40%',
};

const COMMON_DARK = {
  primaryForeground: '222 47% 7%',
  foreground: '210 40% 98%',
  sidebarForeground: '215 20% 78%',
  mutedForeground: '215 16% 70%',
};

const THEME_STYLE_TOKENS = {
  cyber: {
    light: {
      ...COMMON_LIGHT,
      primary: '243 75% 59%',
      ring: '243 75% 59%',
      chart1: '243 75% 59%',
      background: '235 100% 98%',
      gradient: 'linear-gradient(135deg, #f7f8ff 0%, #eeedff 48%, #e6eaff 100%)',
      start: '#f7f8ff',
      end: '#e6eaff',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      ...COMMON_DARK,
      primary: '245 94% 68%',
      ring: '245 94% 68%',
      chart1: '245 94% 68%',
      background: '247 54% 5%',
      card: '247 36% 9%',
      popover: '247 36% 9%',
      gradient: 'radial-gradient(circle at 0% 0%, rgba(67, 56, 202, 0.24), rgba(67, 56, 202, 0) 35%), radial-gradient(circle at 100% 100%, rgba(49, 46, 129, 0.20), rgba(49, 46, 129, 0) 42%), linear-gradient(135deg, #030211 0%, #080721 100%)',
      start: '#030211',
      end: '#080721',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  aurora: {
    light: {
      ...COMMON_LIGHT,
      primary: '184 90% 36%',
      ring: '184 90% 36%',
      chart1: '184 90% 36%',
      background: '205 60% 98%',
      gradient: 'radial-gradient(circle at 0% 0%, rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0) 30%), radial-gradient(circle at 100% 0%, rgba(20, 184, 166, 0.14), rgba(20, 184, 166, 0) 32%), linear-gradient(135deg, #f8fafc 0%, #eef8ff 45%, #effdfa 100%)',
      start: '#f8fafc',
      end: '#effdfa',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      ...COMMON_DARK,
      primary: '184 90% 48%',
      ring: '184 90% 48%',
      chart1: '184 90% 48%',
      background: '222 47% 5%',
      card: '222 36% 9%',
      popover: '222 36% 9%',
      gradient: 'radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 35%), radial-gradient(circle at 100% 8%, rgba(20, 184, 166, 0.18), rgba(20, 184, 166, 0) 35%), linear-gradient(135deg, #020617 0%, #07111d 48%, #031018 100%)',
      start: '#020617',
      end: '#031018',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  sunset: {
    light: {
      ...COMMON_LIGHT,
      primary: '343 81% 50%',
      ring: '343 81% 50%',
      chart1: '343 81% 50%',
      background: '355 100% 98%',
      gradient: 'linear-gradient(135deg, #fff8f7 0%, #ffecef 50%, #fff0df 100%)',
      start: '#fff8f7',
      end: '#fff0df',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      ...COMMON_DARK,
      primary: '345 88% 64%',
      ring: '345 88% 64%',
      chart1: '345 88% 64%',
      background: '346 72% 5%',
      card: '346 44% 9%',
      popover: '346 44% 9%',
      gradient: 'radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.22), rgba(225, 29, 72, 0) 40%), radial-gradient(circle at 12% 92%, rgba(234, 88, 12, 0.14), rgba(234, 88, 12, 0) 42%), linear-gradient(135deg, #100207 0%, #1b050f 100%)',
      start: '#100207',
      end: '#1b050f',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  emerald: {
    light: {
      ...COMMON_LIGHT,
      primary: '160 84% 33%',
      ring: '160 84% 33%',
      chart1: '160 84% 33%',
      background: '150 60% 98%',
      gradient: 'linear-gradient(135deg, #f4fdf7 0%, #e6fbf1 54%, #d9f8ec 100%)',
      start: '#f4fdf7',
      end: '#d9f8ec',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      ...COMMON_DARK,
      primary: '160 84% 44%',
      ring: '160 84% 44%',
      chart1: '160 84% 44%',
      background: '154 48% 4%',
      card: '154 36% 8%',
      popover: '154 36% 8%',
      gradient: 'radial-gradient(circle at 50% 0%, rgba(4, 120, 87, 0.18), rgba(4, 120, 87, 0) 45%), linear-gradient(135deg, #020805 0%, #04140e 100%)',
      start: '#020805',
      end: '#04140e',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  quartz: {
    light: {
      ...COMMON_LIGHT,
      primary: '25 82% 51%',
      ring: '25 82% 51%',
      chart1: '25 82% 51%',
      background: '33 70% 98%',
      gradient: 'linear-gradient(135deg, #fffdf9 0%, #fdf3e8 54%, #fae8d4 100%)',
      start: '#fffdf9',
      end: '#fae8d4',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      ...COMMON_DARK,
      primary: '27 88% 64%',
      ring: '27 88% 64%',
      chart1: '27 88% 64%',
      background: '25 34% 5%',
      card: '25 28% 9%',
      popover: '25 28% 9%',
      gradient: 'radial-gradient(circle at 25% 15%, rgba(230, 137, 72, 0.20), rgba(230, 137, 72, 0) 40%), linear-gradient(135deg, #0e0a07 0%, #21150d 100%)',
      start: '#0e0a07',
      end: '#21150d',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
  },
  horizon: {
    light: {
      ...COMMON_LIGHT,
      primary: '316 82% 50%',
      ring: '187 88% 42%',
      chart1: '316 82% 50%',
      background: '292 80% 98%',
      gradient: 'linear-gradient(135deg, #fffbff 0%, #f5eaff 44%, #e5f7ff 100%)',
      start: '#fffbff',
      end: '#e5f7ff',
      before: 'none',
      after: 'none',
      blend: 'normal',
      animation: 'none',
      beforeAnimation: 'none',
      afterAnimation: 'none',
      bgSize: 'cover',
    },
    dark: {
      ...COMMON_DARK,
      primary: '314 91% 64%',
      ring: '186 93% 48%',
      chart1: '314 91% 64%',
      background: '275 62% 4%',
      card: '275 40% 8%',
      popover: '275 40% 8%',
      gradient: 'radial-gradient(circle at 80% 10%, rgba(217, 70, 239, 0.24), rgba(217, 70, 239, 0) 45%), radial-gradient(circle at 10% 80%, rgba(6, 182, 212, 0.20), rgba(6, 182, 212, 0) 45%), linear-gradient(135deg, #04010a 0%, #0c0217 100%)',
      start: '#04010a',
      end: '#0c0217',
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

function normalizeThemeStyle(style) {
  if (VALID_THEME_STYLES.includes(style)) return style;
  return LEGACY_THEME_STYLE_MAP[style] || 'aurora';
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncSystemBarColor() {
  if (typeof window === 'undefined') return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((themeColor) => {
    themeColor.setAttribute('content', APP_SYSTEM_BAR_COLOR);
  });
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

function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(savedTheme) ? savedTheme : 'system';
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

function applyTheme(mode) {
  if (typeof window === 'undefined') return 'light';

  const root = document.documentElement;
  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;

  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.classList.toggle('light', resolvedTheme !== 'dark');
  root.dataset.appearance = resolvedTheme;

  const favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.href = resolvedTheme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
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
  const [resolvedTheme, setResolvedTheme] = useState(() => applyTheme(getStoredTheme()));

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
