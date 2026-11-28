import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const THEME_STYLE_STORAGE_KEY = 'cero.themeStyle';
const COMPACT_MODE_STORAGE_KEY = 'cero.compactMode';
const SHOW_DECIMALS_STORAGE_KEY = 'cero.showDecimals';
const HAPTICS_STORAGE_KEY = 'cero.hapticsEnabled';
const APP_SYSTEM_BAR_COLOR = '#0a0a1a';
const DEFAULT_THEME_STYLE = 'ember-noir';

const VALID_THEMES = ['system', 'light', 'dark'];
const VALID_THEME_STYLES = ["ember-noir","blue-ruby","forest-neon","violet","rose-quartz","graphite-glow"];

const LEGACY_THEME_STYLE_MAP = {
  'copper-smoke': DEFAULT_THEME_STYLE,
  'mango-lagoon': DEFAULT_THEME_STYLE,
  'sunset-aqua': DEFAULT_THEME_STYLE,
  cero: DEFAULT_THEME_STYLE,
  ocean: 'blue-ruby',
  cyber: 'graphite-glow',
  indigo: 'violet',
  aurora: 'ember-noir',
  sunset: 'ember-noir',
  rose: 'rose-quartz',
  forest: 'forest-neon',
  emerald: 'forest-neon',
  sage: 'forest-neon',
  quartz: 'ember-noir',
  desert: 'ember-noir',
  horizon: 'blue-ruby',
  minimal: 'graphite-glow',
  obsidian: 'graphite-glow',
  'warm-aurora': 'ember-noir',
  'vibrant-fluid': 'blue-ruby',
  'ai-minimal': 'graphite-glow',
  'energy-action': 'ember-noir',
  'cyber-indigo': 'graphite-glow',
  'aurora-bloom': 'ember-noir',
  'sunset-rose': 'rose-quartz',
  'emerald-forest': 'forest-neon',
  'desert-quartz': 'ember-noir',
  'cyberpunk-horizon': 'blue-ruby',
  'orchid-fire': 'violet',
};

const NEUTRAL_MODE_TOKENS = {
  light: {
    background: '218 42% 97%',
    foreground: '222 47% 10%',
    card: '0 0% 100%',
    cardForeground: '222 47% 10%',
    popover: '0 0% 100%',
    popoverForeground: '222 47% 10%',
    border: '220 20% 88%',
    input: '220 20% 88%',
    muted: '220 20% 94%',
    mutedForeground: '220 9% 43%',
    secondary: '220 25% 95%',
    secondaryForeground: '222 47% 12%',
    destructive: '0 78% 56%',
    success: '145 63% 38%',
    warning: '38 92% 50%',
    sidebarBackground: '0 0% 100%',
    sidebarForeground: '220 9% 35%',
    sidebarAccent: '220 25% 95%',
    sidebarAccentForeground: '222 47% 11%',
    sidebarBorder: '220 20% 90%',
    primaryForeground: '0 0% 100%',
    surfaceMainAlpha: '0.78',
    surfaceStrongAlpha: '0.78',
    surfaceSoftAlpha: '0.78',
    surfaceFloatingAlpha: '0.98',
    controlAlpha: '0.78',
    surfaceBorderAlpha: '0.18',
    surfaceBorderStrongAlpha: '0.18',
    surfaceBorderSoftAlpha: '0.18',
    controlBorderAlpha: '0.20',
    surfaceShadowColor: '222 47% 9%',
    surfaceShadowAlpha: '0.075',
    surfaceShadowStrongAlpha: '0.12',
    surfaceBlur: '22px',
    surfaceSaturate: '145%',
  },
  dark: {
    background: '222 47% 5%',
    foreground: '210 40% 98%',
    card: '222 38% 9%',
    cardForeground: '210 40% 98%',
    popover: '222 38% 9%',
    popoverForeground: '210 40% 98%',
    border: '217 30% 20%',
    input: '217 30% 20%',
    muted: '217 33% 13%',
    mutedForeground: '215 20% 72%',
    secondary: '217 33% 13%',
    secondaryForeground: '210 40% 98%',
    destructive: '0 84% 63%',
    success: '145 70% 48%',
    warning: '43 96% 56%',
    sidebarBackground: '222 47% 7%',
    sidebarForeground: '215 20% 78%',
    sidebarAccent: '217 33% 14%',
    sidebarAccentForeground: '210 40% 98%',
    sidebarBorder: '217 30% 18%',
    primaryForeground: '222 47% 7%',
    surfaceMainAlpha: '0.62',
    surfaceStrongAlpha: '0.62',
    surfaceSoftAlpha: '0.62',
    surfaceFloatingAlpha: '0.98',
    controlAlpha: '0.62',
    surfaceBorderAlpha: '0.16',
    surfaceBorderStrongAlpha: '0.16',
    surfaceBorderSoftAlpha: '0.16',
    controlBorderAlpha: '0.18',
    surfaceShadowColor: '222 47% 2%',
    surfaceShadowAlpha: '0.28',
    surfaceShadowStrongAlpha: '0.38',
    surfaceBlur: '22px',
    surfaceSaturate: '140%',
  },
};

const THEME_STYLE_TOKENS = Object.fromEntries([
  ['ember-noir', '30 90% 34%', '34 91% 58%'],
  ['blue-ruby', '220 72% 43%', '220 77% 61%'],
  ['forest-neon', '159 80% 25%', '159 71% 45%'],
  ['violet', '260 55% 43%', '260 72% 68%'],
  ['rose-quartz', '341 66% 42%', '341 74% 61%'],
  ['graphite-glow', '215 22% 37%', '215 25% 65%']
].map(([id,light,dark])=> {
  const lightHue=light.split(' ')[0], darkHue=dark.split(' ')[0];
  return [id,{
    light:{primary:light,ring:light,accent:lightHue+' 45% 94%',accentForeground:lightHue+' 55% 20%',appBgColor:'#f7f8fa',appBgImage:'none'},
    dark:{primary:dark,ring:dark,accent:darkHue+' 35% 17%',accentForeground:darkHue+' 65% 90%',appBgColor:'#101520',appBgImage:'none'}
  }];
}));

function setRootVar(root, name, value) {
  root.style.setProperty(name, value);
}

function applyThemeStyleTokens(style, resolvedTheme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const safeStyle = normalizeThemeStyle(style);
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const neutral = NEUTRAL_MODE_TOKENS[mode];
  const tokens = THEME_STYLE_TOKENS[safeStyle]?.[mode] || THEME_STYLE_TOKENS[DEFAULT_THEME_STYLE][mode];

  setRootVar(root, '--background', neutral.background);
  setRootVar(root, '--foreground', neutral.foreground);
  setRootVar(root, '--card', neutral.card);
  setRootVar(root, '--card-foreground', neutral.cardForeground);
  setRootVar(root, '--popover', neutral.popover);
  setRootVar(root, '--popover-foreground', neutral.popoverForeground);
  setRootVar(root, '--border', neutral.border);
  setRootVar(root, '--input', neutral.input);
  setRootVar(root, '--muted', neutral.muted);
  setRootVar(root, '--muted-foreground', neutral.mutedForeground);
  setRootVar(root, '--secondary', neutral.secondary);
  setRootVar(root, '--secondary-foreground', neutral.secondaryForeground);
  setRootVar(root, '--destructive', neutral.destructive);
  setRootVar(root, '--success', neutral.success);
  setRootVar(root, '--warning', neutral.warning);

  setRootVar(root, '--primary', tokens.primary);
  setRootVar(root, '--primary-foreground', neutral.primaryForeground);
  setRootVar(root, '--ring', tokens.ring);
  setRootVar(root, '--accent', tokens.accent);
  setRootVar(root, '--accent-foreground', tokens.accentForeground);
  setRootVar(root, '--chart-1', tokens.primary);

  setRootVar(root, '--sidebar-background', neutral.sidebarBackground);
  setRootVar(root, '--sidebar-foreground', neutral.sidebarForeground);
  setRootVar(root, '--sidebar-primary', tokens.primary);
  setRootVar(root, '--sidebar-primary-foreground', neutral.primaryForeground);
  setRootVar(root, '--sidebar-accent', neutral.sidebarAccent);
  setRootVar(root, '--sidebar-accent-foreground', neutral.sidebarAccentForeground);
  setRootVar(root, '--sidebar-border', neutral.sidebarBorder);
  setRootVar(root, '--sidebar-ring', tokens.ring);

  setRootVar(root, '--app-bg-color', tokens.appBgColor);
  setRootVar(root, '--app-bg-image', tokens.appBgImage);
  setRootVar(root, '--app-page-gradient', tokens.appBgImage);
  setRootVar(root, '--app-canvas-start', tokens.appBgColor);
  setRootVar(root, '--app-canvas-end', tokens.appBgColor);
  setRootVar(root, '--app-canvas-before', 'none');
  setRootVar(root, '--app-canvas-after', 'none');
  setRootVar(root, '--app-canvas-blend', 'normal');
  setRootVar(root, '--app-canvas-animation', 'none');
  setRootVar(root, '--app-canvas-before-animation', 'none');
  setRootVar(root, '--app-canvas-after-animation', 'none');
  setRootVar(root, '--app-canvas-bg-size', 'cover');

  setRootVar(root, '--app-surface-main-alpha', neutral.surfaceMainAlpha);
  setRootVar(root, '--app-surface-strong-alpha', neutral.surfaceStrongAlpha);
  setRootVar(root, '--app-surface-soft-alpha', neutral.surfaceSoftAlpha);
  setRootVar(root, '--app-surface-floating-alpha', neutral.surfaceFloatingAlpha);
  setRootVar(root, '--app-control-alpha', neutral.controlAlpha);
  setRootVar(root, '--app-surface-border-alpha', neutral.surfaceBorderAlpha);
  setRootVar(root, '--app-surface-border-strong-alpha', neutral.surfaceBorderStrongAlpha);
  setRootVar(root, '--app-surface-border-soft-alpha', neutral.surfaceBorderSoftAlpha);
  setRootVar(root, '--app-control-border-alpha', neutral.controlBorderAlpha);
  setRootVar(root, '--app-surface-shadow-color', neutral.surfaceShadowColor);
  setRootVar(root, '--app-surface-shadow-alpha', neutral.surfaceShadowAlpha);
  setRootVar(root, '--app-surface-shadow-strong-alpha', neutral.surfaceShadowStrongAlpha);
  setRootVar(root, '--app-surface-blur', neutral.surfaceBlur);
  setRootVar(root, '--app-surface-saturate', neutral.surfaceSaturate);
  setRootVar(root, '--app-recharts-tooltip-bg', `hsl(${neutral.popover} / ${neutral.surfaceFloatingAlpha})`);
  setRootVar(root, '--app-recharts-tooltip-border', `hsl(${neutral.border} / 0.72)`);
  setRootVar(root, '--app-recharts-tooltip-shadow', `0 16px 40px hsl(${neutral.surfaceShadowColor} / ${mode === 'dark' ? '0.42' : '0.14'})`);
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
  return LEGACY_THEME_STYLE_MAP[style] || DEFAULT_THEME_STYLE;
}

function getStoredThemeStyle() {
  if (typeof window === 'undefined') return DEFAULT_THEME_STYLE;

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
      resolvedTheme === 'dark'
        ? '/favicon-32x32-dark.png'
        : '/favicon-32x32-light.png';
  }

  const appleTouchIcon = document.getElementById('apple-touch-icon');
  if (appleTouchIcon) {
    appleTouchIcon.href =
      resolvedTheme === 'dark'
        ? '/apple-touch-icon-dark.png'
        : '/apple-touch-icon-light.png';
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
  const compactMode = true;
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
    applyBooleanClass('compact-mode', true);
    localStorage.setItem(COMPACT_MODE_STORAGE_KEY, 'true');
  }, []);

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
