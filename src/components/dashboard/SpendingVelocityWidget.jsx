/**
 * SpendingVelocityWidget
 * Shows mid-month burn rate with dual-track bars:
 *   grey = time elapsed, color = budget consumed
 *
 * Usage in Plan.jsx (below LeftToAllocateBanner):
 *   <SpendingVelocityWidget
 *     totalExpenses={budget.totalExpenses}
 *     plannedExpenses={budget.totalPlannedExpenses}
 *     currentMonth={currentMonth}
 *     formatCurrency={formatCurrency}
 *   />
 */
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpendingVelocity } from '@/hooks/useSpendingVelocity';

const STATUS = {
  ahead: {
    label: 'Under budget pace',
    color: 'text-[hsl(var(--success))]',
    barColor: 'bg-[hsl(var(--success))]',
    borderColor: 'border-[hsl(var(--success)/0.2)]',
    bg: 'bg-[hsl(var(--success)/0.06)]',
    Icon: TrendingDown,
  },
  'on-track': {
    label: 'On track',
    color: 'text-primary',
    barColor: 'bg-primary',
    borderColor: 'border-primary/15',
    bg: 'bg-primary/[0.04]',
    Icon: Minus,
  },
  behind: {
    label: 'Spending too fast',
    color: 'text-destructive',
    barColor: 'bg-destructive',
    borderColor: 'border-destructive/15',
    bg: 'bg-destructive/[0.04]',
    Icon: TrendingUp,
  },
};

export default function SpendingVelocityWidget({
  totalExpenses,
  plannedExpenses,
  currentMonth,
  formatCurrency,
}) {
  const {
    velocityPercent,
    progressPercent,
    daysIntoMonth,
    daysInMonth,
    projectedTotal,
    dailyAverage,
    status,
  } = useSpendingVelocity({ totalExpenses, plannedExpenses, currentMonth });

  if (!plannedExpenses || plannedExpenses === 0) return null;

  const cfg = STATUS[status];
  const { Icon } = cfg;

  const fmt = formatCurrency || ((n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 }));

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/45">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="truncate text-xs font-semibold tracking-wide text-foreground">
            Spending Velocity
          </span>
        </div>
        <div className={cn('flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-xs', cfg.bg, cfg.color)}>
          <Icon className="h-3.5 w-3.5" />
          {cfg.label}
        </div>
      </div>

      {/* Dual track bars */}
      <div className="mb-3 space-y-2">
        {/* Time track */}
        <div className="flex items-center gap-3">
          <span className="w-10 text-right text-[10px] text-muted-foreground font-medium shrink-0">
            Time
          </span>
          <div className="relative flex-1 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.1 }}
            />
          </div>
          <span className="w-8 text-[10px] text-muted-foreground tabular-nums shrink-0">
            {progressPercent}%
          </span>
        </div>

        {/* Spend track */}
        <div className="flex items-center gap-3">
          <span className="w-10 text-right text-[10px] text-muted-foreground font-medium shrink-0">
            Spent
          </span>
          <div className="relative flex-1 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
            <motion.div
              className={cn('absolute inset-y-0 left-0 rounded-full', cfg.barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(velocityPercent, 100)}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.2 }}
            />
            {/* shimmer */}
            <motion.div
              className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ left: '-3rem' }}
              animate={{ left: '110%' }}
              transition={{ duration: 1.1, delay: 0.7, ease: 'easeInOut' }}
            />
          </div>
          <span className={cn('w-8 text-[10px] tabular-nums font-semibold shrink-0', cfg.color)}>
            {velocityPercent}%
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 border-t border-border/45 pt-3">
        <div className="text-center">
          <div className="mb-0.5 text-[10px] text-muted-foreground">Day</div>
          <div className="text-xs font-bold tabular-nums text-foreground">
            {daysIntoMonth}/{daysInMonth}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-0.5 truncate text-[10px] text-muted-foreground">Daily avg</div>
          <div className="text-xs font-bold tabular-nums text-foreground">
            {fmt(dailyAverage)}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-0.5 text-[10px] text-muted-foreground">Projected</div>
          <div className={cn('text-xs font-bold tabular-nums', 
            projectedTotal > plannedExpenses ? 'text-destructive' : 'text-foreground'
          )}>
            {fmt(projectedTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}