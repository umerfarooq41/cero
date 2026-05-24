/**
 * SpendingVelocityWidget
 * Shows burn-rate pace with dual-track bars:
 *   grey = time elapsed, color = budget consumed
 */
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpendingVelocity } from '@/hooks/useSpendingVelocity';

const STATUS = {
  ahead: {
    label: 'Under budget pace',
    color: 'text-[hsl(var(--success))]',
    barColor: 'bg-[hsl(var(--success))]',
    Icon: TrendingDown,
  },
  'on-track': {
    label: 'On track',
    color: 'text-primary',
    barColor: 'bg-primary',
    Icon: Minus,
  },
  behind: {
    label: 'Spending too fast',
    color: 'text-destructive',
    barColor: 'bg-destructive',
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

  const fmt =
    formatCurrency ||
    ((n) =>
      n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }));

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
        <p className={cn('min-w-0 truncate text-lg font-bold leading-6', cfg.color)}>
          {cfg.label}
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-10 shrink-0 text-right text-sm font-medium text-muted-foreground">
            Time
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.1 }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
            {progressPercent}%
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <span className="w-10 shrink-0 text-right text-sm font-medium text-muted-foreground">
            Spent
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
            <motion.div
              className={cn('absolute inset-y-0 left-0 rounded-full', cfg.barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(velocityPercent, 100)}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.2 }}
            />
          </div>
          <span className={cn('w-9 shrink-0 text-right text-sm font-bold tabular-nums', cfg.color)}>
            {velocityPercent}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
        <div className="min-w-0 text-center">
          <div className="mb-0.5 text-xs text-muted-foreground">Day</div>
          <div className="truncate text-sm font-bold tabular-nums text-foreground">
            {daysIntoMonth}/{daysInMonth}
          </div>
        </div>
        <div className="min-w-0 text-center">
          <div className="mb-0.5 text-xs text-muted-foreground">Daily avg</div>
          <div className="truncate text-sm font-bold tabular-nums text-foreground">
            {fmt(dailyAverage)}
          </div>
        </div>
        <div className="min-w-0 text-center">
          <div className="mb-0.5 text-xs text-muted-foreground">Projected</div>
          <div
            className={cn(
              'truncate text-sm font-bold tabular-nums',
              projectedTotal > plannedExpenses ? 'text-destructive' : 'text-foreground'
            )}
          >
            {fmt(projectedTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
