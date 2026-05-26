/**
 * SavingsRateCard
 * A compact hero-stat card showing savings rate with tier feedback.
 *
 * Usage in Plan.jsx below SummaryCards:
 *   <SavingsRateCard
 *     income={budget.totalIncome}
 *     expenses={budget.totalExpenses}
 *   />
 */
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, ShieldCheck, AlertTriangle, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSavingsRate } from '@/hooks/useSavingsRate';
import { useCountUp } from '@/hooks/useCountUp';

const TIER_CONFIG = {
  excellent: {
    Icon: ShieldCheck,
    iconColor: 'text-[hsl(var(--success))]',
    bg: 'bg-[hsl(var(--success)/0.07)] border-[hsl(var(--success)/0.2)]',
    bar: 'bg-[hsl(var(--success))]',
    badge: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]',
  },
  good: {
    Icon: TrendingUp,
    iconColor: 'text-primary',
    bg: 'bg-primary/[0.05] border-primary/15',
    bar: 'bg-primary',
    badge: 'bg-primary/10 text-primary',
  },
  fair: {
    Icon: CircleDollarSign,
    iconColor: 'text-[hsl(var(--warning))]',
    bg: 'bg-[hsl(var(--warning)/0.07)] border-[hsl(var(--warning)/0.2)]',
    bar: 'bg-[hsl(var(--warning))]',
    badge: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]',
  },
  low: {
    Icon: AlertTriangle,
    iconColor: 'text-orange-500',
    bg: 'bg-orange-500/[0.05] border-orange-500/15',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-500',
  },
  danger: {
    Icon: Flame,
    iconColor: 'text-destructive',
    bg: 'bg-destructive/[0.05] border-destructive/15',
    bar: 'bg-destructive',
    badge: 'bg-destructive/10 text-destructive',
  },
  neutral: {
    Icon: TrendingUp,
    iconColor: 'text-muted-foreground',
    bg: 'app-card-surface',
    bar: 'bg-muted-foreground/40',
    badge: 'bg-secondary text-muted-foreground',
  },
};

export default function SavingsRateCard({ income = 0, expenses = 0 }) {
  const { rate, label, tier } = useSavingsRate({ income, expenses });
  const animatedRate = useCountUp(Math.max(0, rate), 800);
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.neutral;
  const { Icon } = cfg;
  const clampedBar = Math.min(Math.max(rate, 0), 100);

  return (
    <div className={cn('rounded-2xl border p-4', cfg.bg)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg app-card-surface-soft flex items-center justify-center">
            <Icon className={cn('h-3.5 w-3.5', cfg.iconColor)} />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">
            Savings Rate
          </span>
        </div>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.badge)}>
          {label}
        </span>
      </div>

      <div className="flex items-end gap-1 mb-3">
        <span className="text-3xl font-bold tabular-nums leading-none text-foreground">
          {Math.round(animatedRate)}
        </span>
        <span className="text-lg font-semibold text-muted-foreground pb-0.5">%</span>
      </div>

      <div className="relative h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-full', cfg.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedBar}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.2 }}
        />
        <motion.div
          className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ left: '-3rem' }}
          animate={{ left: '110%' }}
          transition={{ duration: 1.1, delay: 0.8, ease: 'easeInOut' }}
        />
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        {rate >= 20
          ? 'You\'re building wealth at an excellent pace'
          : rate >= 10
          ? 'Solid savings — keep the momentum'
          : rate >= 0
          ? 'Room to grow — try to hit 20%'
          : 'Spending exceeds income this month'}
      </p>
    </div>
  );
}
