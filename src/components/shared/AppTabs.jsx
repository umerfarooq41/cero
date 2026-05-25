import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const toneStyles = {
  neutral: {
    active:
      'bg-background text-foreground shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-border/60 dark:bg-white/[0.06] dark:shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
    inactive: 'text-muted-foreground hover:bg-background/45 hover:text-foreground',
    indicator: 'bg-background ring-border/60 dark:bg-white/[0.06]',
  },
  blue: {
    active:
      'bg-blue-500/10 text-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.16)] ring-blue-500/15 dark:text-blue-400 dark:shadow-[0_8px_24px_rgba(59,130,246,0.10)]',
    inactive:
      'text-muted-foreground hover:bg-blue-500/5 hover:text-blue-700 dark:hover:text-blue-400',
    indicator: 'bg-blue-500/10 ring-blue-500/15',
  },
  emerald: {
    active:
      'bg-emerald-500/10 text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.16)] ring-emerald-500/15 dark:text-emerald-400 dark:shadow-[0_8px_24px_rgba(16,185,129,0.10)]',
    inactive:
      'text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-400',
    indicator: 'bg-emerald-500/10 ring-emerald-500/15',
  },
  red: {
    active:
      'bg-red-500/10 text-red-700 shadow-[0_8px_24px_rgba(239,68,68,0.16)] ring-red-500/15 dark:text-red-400 dark:shadow-[0_8px_24px_rgba(239,68,68,0.10)]',
    inactive:
      'text-muted-foreground hover:bg-red-500/5 hover:text-red-700 dark:hover:text-red-400',
    indicator: 'bg-red-500/10 ring-red-500/15',
  },
  amber: {
    active:
      'bg-amber-500/10 text-amber-700 shadow-[0_8px_24px_rgba(245,158,11,0.16)] ring-amber-500/15 dark:text-amber-400 dark:shadow-[0_8px_24px_rgba(245,158,11,0.10)]',
    inactive:
      'text-muted-foreground hover:bg-amber-500/5 hover:text-amber-700 dark:hover:text-amber-400',
    indicator: 'bg-amber-500/10 ring-amber-500/15',
  },
  purple: {
    active:
      'bg-purple-500/10 text-purple-700 shadow-[0_8px_24px_rgba(139,92,246,0.16)] ring-purple-500/15 dark:text-purple-400 dark:shadow-[0_8px_24px_rgba(139,92,246,0.10)]',
    inactive:
      'text-muted-foreground hover:bg-purple-500/5 hover:text-purple-700 dark:hover:text-purple-400',
    indicator: 'bg-purple-500/10 ring-purple-500/15',
  },
  cyan: {
    active:
      'bg-cyan-500/10 text-cyan-700 shadow-[0_8px_24px_rgba(6,182,212,0.16)] ring-cyan-500/15 dark:text-cyan-400 dark:shadow-[0_8px_24px_rgba(6,182,212,0.10)]',
    inactive:
      'text-muted-foreground hover:bg-cyan-500/5 hover:text-cyan-700 dark:hover:text-cyan-400',
    indicator: 'bg-cyan-500/10 ring-cyan-500/15',
  },
};

const sizeStyles = {
  sm: {
    shell: 'rounded-2xl p-1.5',
    tab: 'rounded-xl px-1.5 py-2.5 text-[11px] sm:px-3 sm:text-sm',
    icon: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
  },
  md: {
    shell: 'rounded-2xl p-1.5',
    tab: 'rounded-xl px-3 py-2.5 text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    shell: 'rounded-3xl p-1.5',
    tab: 'rounded-2xl px-4 py-3 text-sm',
    icon: 'h-4 w-4',
  },
};

function getToneStyle(tone = 'neutral') {
  return toneStyles[tone] || toneStyles.neutral;
}

function getGridColumns(count) {
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-4';
  return 'grid-cols-2 sm:grid-cols-4';
}

export default function AppTabs({
  tabs,
  value,
  onChange,
  size = 'sm',
  layoutId = 'app-tab-highlight',
  className,
  gridClassName,
  buttonClassName,
}) {
  const sizeClass = sizeStyles[size] || sizeStyles.sm;

  return (
    <div
      className={cn(
        'border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl',
        sizeClass.shell,
        className
      )}
    >
      <div className={cn('grid gap-1', getGridColumns(tabs.length), gridClassName)}>
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          const Icon = tab.icon;
          const toneStyle = getToneStyle(tab.tone);
          const label = tab.label;
          const desktopLabel = tab.desktopLabel || label;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              aria-pressed={isActive}
              className={cn(
                'relative flex min-w-0 items-center justify-center gap-1.5 overflow-hidden font-semibold leading-none transition-colors duration-200 active:scale-[0.99] sm:gap-2',
                sizeClass.tab,
                isActive ? toneStyle.active : toneStyle.inactive,
                buttonClassName
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className={cn(
                    'absolute inset-0 rounded-[inherit] shadow-sm ring-1',
                    toneStyle.indicator
                  )}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}

              {Icon && (
                <Icon
                  className={cn(
                    'relative z-10 shrink-0 transition-transform duration-200',
                    sizeClass.icon,
                    isActive && 'scale-105 stroke-[2.4]'
                  )}
                />
              )}

              <span className="relative z-10 min-w-0 truncate whitespace-nowrap">
                <span className={desktopLabel !== label ? 'sm:hidden' : ''}>{label}</span>
                {desktopLabel !== label && (
                  <span className="hidden sm:inline">{desktopLabel}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const tabPanelMotion = {
  initial: { opacity: 0, y: 8, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(3px)' },
  transition: { duration: 0.18, ease: 'easeOut' },
};

export function AppTabPanel({ children, className }) {
  return (
    <motion.div {...tabPanelMotion} className={className}>
      {children}
    </motion.div>
  );
}
