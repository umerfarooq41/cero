import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDot,
  Target,
  TrendingUp,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  getGoalProgress,
  getGoalRemaining,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
} from '@/lib/goals';
import ReflectCard from './ReflectCard.jsx';
import {
  CurrencyAmount,
  formatCurrencyText,
} from './ReflectSummaryCard.jsx';

const clampPercent = (value) =>
  Math.max(0, Math.min(Number.isFinite(Number(value)) ? Number(value) : 0, 100));

const safeNumber = (value) => Number(value || 0);

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-3 min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : null}

        <h3 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      {subtitle ? (
        <p className="mt-1 truncate text-xs leading-4 text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function EmptyBlock({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-3 py-5 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function ProgressRing({ value, children, size = 58 }) {
  const safeValue = clampPercent(value);
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeValue / 100) * circumference;

  return (
    <motion.div
      className="relative shrink-0"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      style={{ width: size, height: size }}
    >
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children}
      </div>
    </motion.div>
  );
}

function Money({ value, currency, className, signed = false }) {
  const amount = safeNumber(value);
  const sign = signed && amount > 0 ? '+' : signed && amount < 0 ? '-' : '';

  return (
    <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap tabular-nums', className)}>
      {sign ? <span>{sign}</span> : null}
      <CurrencyAmount amount={Math.abs(amount)} currency={currency} compact />
    </span>
  );
}

function MiniMetric({ label, value, subtext, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'text-[hsl(var(--success))]'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'warning'
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-foreground';

  return (
    <motion.div
      className="min-w-0 rounded-xl border border-border/50 bg-background/30 px-2 py-1.5"
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <p className="truncate text-[8px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
        {label}
      </p>
      <div className={cn('mt-0.5 truncate text-[10px] font-bold tabular-nums sm:text-xs', toneClass)}>
        {value}
      </div>
      {subtext ? (
        <p className="mt-0.5 truncate text-[8px] leading-3 text-muted-foreground sm:text-[10px]">
          {subtext}
        </p>
      ) : null}
    </motion.div>
  );
}

function isGoalTransferTransaction(transaction) {
  return (
    transaction?.type === 'transfer' &&
    Boolean(
      transaction.savings_goal_id ||
        transaction.goal_id ||
        transaction.goal_contribution_id
    )
  );
}

function getGoalTrackState(goal) {
  const target = safeNumber(goal?.target_amount);
  const current = safeNumber(goal?.current_amount);

  if (!target || current >= target) {
    return { label: current >= target ? 'Funded' : 'No target', tone: 'good' };
  }

  if (!goal?.target_date) {
    return { label: 'No deadline', tone: 'default' };
  }

  const start = new Date(`${goal.start_date || goal.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)}T00:00:00`);
  const targetDate = new Date(`${goal.target_date}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(targetDate.getTime())) {
    return { label: 'Tracking', tone: 'default' };
  }

  const totalMs = Math.max(targetDate.getTime() - start.getTime(), 1);
  const elapsedMs = Math.max(today.getTime() - start.getTime(), 0);
  const expectedProgress = clampPercent((elapsedMs / totalMs) * 100);
  const actualProgress = getGoalProgress(goal);

  if (actualProgress + 5 >= expectedProgress) {
    return { label: 'On track', tone: 'good' };
  }

  return { label: 'Behind pace', tone: 'warning' };
}

function GoalProgressAnalysis({ goals, goalTransactions, currency, isYear = false }) {
  const activeGoals = Array.isArray(goals) ? goals : [];
  const safeGoalTransactions = Array.isArray(goalTransactions) ? goalTransactions : [];

  const stats = useMemo(() => {
    const totalSaved = activeGoals.reduce(
      (sum, goal) => sum + safeNumber(goal.current_amount),
      0
    );
    const totalTarget = activeGoals.reduce(
      (sum, goal) => sum + safeNumber(goal.target_amount),
      0
    );
    const periodContribution = safeGoalTransactions
      .filter(isGoalTransferTransaction)
      .reduce((sum, transaction) => sum + Math.max(0, safeNumber(transaction.amount)), 0);
    const monthlyRequired = activeGoals.reduce((sum, goal) => {
      const required = getMonthlyRequiredSaving(goal);
      return sum + (required === null ? 0 : safeNumber(required));
    }, 0);
    const completed = activeGoals.filter((goal) => getGoalRemaining(goal) <= 0).length;

    return {
      totalSaved,
      totalTarget,
      periodContribution,
      monthlyRequired,
      completed,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    };
  }, [activeGoals, safeGoalTransactions]);

  const priorityGoals = useMemo(
    () => sortGoalsByPriority(activeGoals).slice(0, 4),
    [activeGoals]
  );

  return (
    <ReflectCard className="overflow-hidden p-3 sm:p-4">
      <SectionHeading
        icon={Target}
        title="Goal Progress Analysis"
        subtitle="Savings goal progress, current-period contributions, and required monthly pace."
      />

      {activeGoals.length === 0 ? (
        <EmptyBlock
          title="No savings goals yet"
          text="Create savings goals from Manage Plan, then Reflect will show progress and pace analysis here."
        />
      ) : (
        <motion.div
          className="min-w-0 space-y-2.5"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.04 },
            },
          }}
        >
          <motion.div
            className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)] items-center gap-2"
            variants={{
              hidden: { y: 8, opacity: 0 },
              show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 210, damping: 20 } },
            }}
          >
            <ProgressRing value={stats.overallProgress}>
              <div>
                <p className="text-sm font-bold leading-none tabular-nums sm:text-base">
                  {Math.round(clampPercent(stats.overallProgress))}%
                </p>
                <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                  Saved
                </p>
              </div>
            </ProgressRing>

            <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
              <MiniMetric
                label="Saved"
                value={<Money value={stats.totalSaved} currency={currency} />}
                subtext={`Target ${formatCurrencyText(stats.totalTarget, currency)}`}
                tone="good"
              />
              <MiniMetric
                label={isYear ? 'This year' : 'This month'}
                value={<Money value={stats.periodContribution} currency={currency} />}
              />
              <MiniMetric
                label="Required/mo"
                value={<Money value={stats.monthlyRequired} currency={currency} />}
                subtext={`${stats.completed}/${activeGoals.length} funded`}
              />
            </div>
          </motion.div>

          <div className="min-w-0 space-y-2">
            {priorityGoals.map((goal, index) => {
              const progress = getGoalProgress(goal);
              const track = getGoalTrackState(goal);
              const monthlyRequired = getMonthlyRequiredSaving(goal);

              return (
                <motion.div
                  key={goal.id}
                  className="min-w-0 border-t border-border/45 pt-2 first:border-t-0 first:pt-0"
                  variants={{
                    hidden: { y: 8, opacity: 0 },
                    show: {
                      y: 0,
                      opacity: 1,
                      transition: { type: 'spring', stiffness: 220, damping: 22, delay: index * 0.02 },
                    },
                  }}
                >
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground sm:text-sm">
                        {goal.name}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]">
                        <Money value={goal.current_amount} currency={currency} /> of{' '}
                        <Money value={goal.target_amount} currency={currency} /> ·{' '}
                        {Math.round(progress)}%
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="hidden text-[10px] text-muted-foreground sm:inline">
                        {monthlyRequired === null
                          ? 'No deadline'
                          : `${formatCurrencyText(monthlyRequired, currency)}/mo`}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]',
                          track.tone === 'good'
                            ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
                            : track.tone === 'warning'
                              ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {track.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${clampPercent(progress)}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.1 + index * 0.03 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </ReflectCard>
  );
}

function typeLabel(type) {
  if (type === 'expense') return 'Expense';
  if (type === 'income') return 'Income';
  if (type === 'savings') return 'Savings';
  if (type === 'debt') return 'Debt';
  return 'Other';
}

function BudgetVsActual({ rows, currency }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const visibleRows = safeRows.slice(0, 8);

  const totals = safeRows.reduce(
    (sum, row) => ({
      planned: sum.planned + safeNumber(row.planned),
      actual: sum.actual + safeNumber(row.actual),
    }),
    { planned: 0, actual: 0 }
  );

  const variance = totals.planned - totals.actual;

  return (
    <ReflectCard className="p-3 sm:p-4">
      <SectionHeading
        icon={BarChart3}
        title="Budget vs Actual"
        subtitle="Planned category amounts compared with what was actually tracked."
      />

      {visibleRows.length === 0 ? (
        <EmptyBlock
          title="No plan comparison yet"
          text="Add planned category amounts and transactions to see budget variance here."
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric
              label="Planned"
              value={<Money value={totals.planned} currency={currency} />}
            />
            <MiniMetric
              label="Actual"
              value={<Money value={totals.actual} currency={currency} />}
            />
            <MiniMetric
              label={variance >= 0 ? 'Remaining' : 'Over plan'}
              value={<Money value={variance} currency={currency} signed />}
              tone={variance >= 0 ? 'good' : 'bad'}
            />
          </div>

          <div className="space-y-3">
            {visibleRows.map((row) => {
              const used = clampPercent(row.usedPercent);
              const isIncome = row.type === 'income';
              const good = isIncome ? row.actual >= row.planned : !row.isOver;

              return (
                <div key={row.id} className="rounded-2xl border border-border/60 bg-background/35 p-2.5">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <p className="truncate text-xs font-bold text-foreground">{row.name}</p>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">
                        {typeLabel(row.type)} · Planned{' '}
                        <Money value={row.planned} currency={currency} /> · Actual{' '}
                        <Money value={row.actual} currency={currency} />
                      </p>
                    </div>

                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums sm:text-[11px]',
                        good
                          ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {row.variance >= 0 ? 'Left ' : 'Over '}
                      {formatCurrencyText(Math.abs(row.variance), currency)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        row.isOver ? 'bg-red-500' : 'bg-primary'
                      )}
                      style={{ width: `${used}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground sm:text-[11px]">
                    <span>{Math.round(row.usedPercent)}% used</span>
                    <span>{row.isOver ? 'Above plan' : 'Within plan'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ReflectCard>
  );
}

function CategoryTrends({ rows, comparablePeriodLabel, isYear, currency }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const visibleRows = safeRows.slice(0, 6);

  return (
    <ReflectCard className="p-3 sm:p-4">
      <SectionHeading
        icon={TrendingUp}
        title="Category Trends"
        subtitle={
          isYear
            ? `Expense categories compared with ${comparablePeriodLabel}.`
            : `Expense categories compared with ${comparablePeriodLabel}.`
        }
      />

      {visibleRows.length === 0 ? (
        <EmptyBlock
          title="No trend data yet"
          text="Add expenses in this and the previous period to compare category movement."
        />
      ) : (
        <div className="space-y-3">
          {visibleRows.map((row) => {
            const positive = row.change > 0;
            const negative = row.change < 0;
            const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : CircleDot;
            const maxAmount = Math.max(row.current, row.previous, 1);
            const currentWidth = clampPercent((row.current / maxAmount) * 100);
            const previousWidth = clampPercent((row.previous / maxAmount) * 100);

            return (
              <div key={row.id} className="rounded-2xl border border-border/60 bg-background/35 p-2.5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <p className="truncate text-xs font-bold text-foreground">{row.name}</p>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">
                      Current <Money value={row.current} currency={currency} /> · Previous{' '}
                      <Money value={row.previous} currency={currency} />
                    </p>
                  </div>

                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums sm:text-[11px]',
                      positive
                        ? 'bg-destructive/10 text-destructive'
                        : negative
                          ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {negative ? '-' : positive ? '+' : ''}
                    {Math.abs(Math.round(row.changePercent))}%
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${currentWidth}%` }}
                    />
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                    <div
                      className="h-full rounded-full bg-muted-foreground/45 transition-all duration-700 ease-out"
                      style={{ width: `${previousWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ReflectCard>
  );
}

export default function ReflectDeepAnalysis({
  isYear,
  selectedYear,
  selectedMonth,
  goals = [],
  goalTransactions = [],
  currency,
}) {
  return (
    <section className="mb-5 space-y-3">
      <GoalProgressAnalysis
        isYear={isYear}
        goals={goals}
        goalTransactions={goalTransactions}
        currency={currency}
      />
    </section>
  );
}
