import { Monitor, Moon, Sun } from 'lucide-react';

export const toneClasses = {
  blue: {
    tile: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/15',
    selected: 'border-blue-500/30 bg-blue-500/10 text-blue-700 shadow-blue-500/10 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/15',
    selected: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shadow-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/15',
    selected: 'border-amber-500/30 bg-amber-500/10 text-amber-700 shadow-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  purple: {
    tile: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/15',
    selected: 'border-purple-500/30 bg-purple-500/10 text-purple-700 shadow-purple-500/10 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  cyan: {
    tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/15',
    selected: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 shadow-cyan-500/10 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  rose: {
    tile: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/15',
    selected: 'border-rose-500/30 bg-rose-500/10 text-rose-700 shadow-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  slate: {
    tile: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/15',
    selected: 'border-slate-500/30 bg-slate-500/10 text-slate-800 shadow-slate-500/10 dark:text-slate-200',
    dot: 'bg-slate-500',
  },
};

export const themeOptions = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export const themeStyleOptions = [
  {
    value: 'ember-noir',
    label: 'Ember Noir',
    description: 'Warm amber glow with a deep noir dark mode.',
    tone: 'amber',
    lightAccent: '28 92% 46%',
    darkAccent: '32 94% 58%',
  },
  {
    value: 'copper-smoke',
    label: 'Copper Smoke',
    description: 'Smoky warm copper canvas with neutral premium surfaces.',
    tone: 'amber',
    lightAccent: '24 72% 42%',
    darkAccent: '28 82% 62%',
  },
  {
    value: 'rose-quartz',
    label: 'Rose Quartz',
    description: 'Soft rose and blush background with a jewel-like dark mode.',
    tone: 'rose',
    lightAccent: '340 82% 48%',
    darkAccent: '340 86% 62%',
  },
  {
    value: 'forest-neon',
    label: 'Forest Neon',
    description: 'Fresh green canvas with a focused neon forest dark mode.',
    tone: 'emerald',
    lightAccent: '142 76% 38%',
    darkAccent: '142 72% 52%',
  },
  {
    value: 'blue-ruby',
    label: 'Blue Ruby',
    description: 'Modern blue gradients with subtle ruby energy.',
    tone: 'blue',
    lightAccent: '221 83% 53%',
    darkAccent: '221 83% 64%',
  },
  {
    value: 'mango-lagoon',
    label: 'Mango Lagoon',
    description: 'Golden mango warmth balanced with smooth lagoon depth.',
    tone: 'amber',
    lightAccent: '38 92% 44%',
    darkAccent: '38 92% 58%',
  },
  {
    value: 'sunset-aqua',
    label: 'Sunset Aqua',
    description: 'Coral sunset warmth with soft aqua atmosphere.',
    tone: 'cyan',
    lightAccent: '16 88% 48%',
    darkAccent: '18 92% 58%',
  },
  {
    value: 'graphite-glow',
    label: 'Graphite Glow',
    description: 'Neutral graphite style for a quieter premium look.',
    tone: 'slate',
    lightAccent: '215 16% 42%',
    darkAccent: '215 18% 72%',
  },
];

export const SarIcon = () => (
  <img
    src="/sar.svg"
    alt="SAR"
    className="inline-block h-4 w-4 dark:invert"
  />
);

