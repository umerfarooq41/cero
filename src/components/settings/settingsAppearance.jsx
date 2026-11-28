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
    "value": "ember-noir",
    "label": "Amber",
    "tone": "amber",
    "lightAccent": "30 90% 34%",
    "darkAccent": "34 91% 58%"
  },
  {
    "value": "blue-ruby",
    "label": "Ocean Blue",
    "tone": "blue",
    "lightAccent": "220 72% 43%",
    "darkAccent": "220 77% 61%"
  },
  {
    "value": "forest-neon",
    "label": "Emerald",
    "tone": "emerald",
    "lightAccent": "159 80% 25%",
    "darkAccent": "159 71% 45%"
  },
  {
    "value": "violet",
    "label": "Violet",
    "tone": "purple",
    "lightAccent": "260 55% 43%",
    "darkAccent": "260 72% 68%"
  },
  {
    "value": "rose-quartz",
    "label": "Rose",
    "tone": "rose",
    "lightAccent": "341 66% 42%",
    "darkAccent": "341 74% 61%"
  },
  {
    "value": "graphite-glow",
    "label": "Slate",
    "tone": "slate",
    "lightAccent": "215 22% 37%",
    "darkAccent": "215 25% 65%"
  }
];

export const SarIcon = () => (
  <img
    src="/sar.svg"
    alt="SAR"
    className="inline-block h-4 w-4 dark:invert"
  />
);

