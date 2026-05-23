import React, { useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDot,
  Target,
  TrendingDown,
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
    <div className="mb-5 min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        <h3 className="min-w-0 text-sm font-semibold leading-5 tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      {subtitle ? (
        <p className="mt-1 text-left text-xs leading-5 text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function EmptyBlock({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function ProgressRing({ value, children, size = 92 }) {
  const safeValue = clampPercent(value);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function Money({ value, currency, compact = true }) {
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap tabular-nums">
      <CurrencyAmount amount={safeNumber(value)} currency={currency} compact={compact} />
    </span>
  );
}

function getGoalIdFromTransaction(transaction) {
  return (
    transaction?.savings_goal_id ||
    transaction?.goal_id ||
    transaction?.goal_contribution_id ||
    transaction?.source_id ||
    null
  );
}

function getGoalTransactionAmount(transaction) {
  return Math.abs(safeNumber(transaction?.amount));
}

function getGoalStats(goals, goalTransactions, isYear) {
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeTransactions = Array.isArray(goalTransactions) ? goalTransactions : [];

  const totalContributed = safeTransactions.reduce(
    (sum, transaction) => sum + getGoalTransactionAmount(transaction),
    0
  );

  const contributionByGoal = safeTransactions.reduce((acc, transaction) => {
    const goalId = getGoalIdFromTransaction(transaction);
    if (!goalId) return acc;

    acc[goalId] = (acc[goalId] || 0) + getGoalTransactionAmount(transaction);
    return acc;
  }, {});

  const activeGoals = safeGoals.filter((goal) => !goal.is_archived);
  const completedGoals = activeGoals.filter((goal) => getGoalProgress(goal) >= 100);
  const totalTarget = activeGoals.reduce(
    (sum, goal) => sum + safeNumber(goal.target_amount),
    0
  );
  const totalCurrent = activeGoals.reduce(
    (sum, goal) => sum + safeNumber(goal.current_amount),
    0
  );
  const totalRequiredMonthly = activeGoals.reduce(
    (sum, goal) => sum + getMonthlyRequiredSaving(goal),
    0
  );

  const totalProgress =
    totalTarget > 0 ? clampPercent((totalCurrent / totalTarget) * 100) : 0;

  const averageMonthlyContribution = isYear
    ? totalContributed / 12
    : totalContributed;

  const topContributedGoal = activeGoals
    .map((goal) => ({
      ...goal,
      periodContribution: safeNumber(contributionByGoal[goal.id]),
    }))
    .filter((goal) => goal.periodContribution > 0)
    .sort((a, b) => b.periodContribution - a.periodContribution)[0];

  const goalsBehindSchedule = activeGoals
    .map((goal) => {
      const required = getMonthlyRequiredSaving(goal);
      const contributed = safeNumber(contributionByGoal[goal.id]);
      const progress = getGoalProgress(goal);
      const remaining = getGoalRemaining(goal);

      return {
        ...goal,
        required,
        contributed,
        progress,
        remaining,
        behindAmount: Math.max(required - contributed, 0),
      };
    })
    .filter((goal) => goal.progress < 100 && goal.behindAmount > 0)
    .sort((a, b) => b.behindAmount - a.behindAmount);

  return {
    activeGoals,
    completedGoals,
    totalContributed,
    averageMonthlyContribution,
    totalTarget,
    totalCurrent,
    totalProgress,
    totalRequiredMonthly,
    topContributedGoal,
    goalsBehindSchedule,
  };
}

function GoalProgressAnalysis({
  isYear,
  goals = [],
  goalTransactions = [],
  currency,
}) {
  const stats = useMemo(
    () => getGoalStats(goals, goalTransactions, isYear),
    [goals, goalTransactions, isYear]
  );

  const priorityGoals = sortGoalsByPriority(stats.activeGoals).slice(0, 3);
  const hasGoals = stats.activeGoals.length > 0;
  const contributionLabel = isYear
    ? 'Goal contributions this year'
    : 'Goal contributions this month';

  return (
    <ReflectCard className="p-5">
      <SectionHeading
        icon={Target}
        title="Goal Progress Analysis"
        subtitle={
          isYear
            ? 'Yearly savings goal progress, average contribution, and goals behind pace.'
            : 'Monthly goal contribution progress, required savings, and goals needing attention.'
        }
      />

      {!hasGoals ? (
        <EmptyBlock
          title="No active goals yet"
          text="Create savings goals in Manage Plan to see contribution progress and target analysis here."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-background/35 p-4">
              <ProgressRing value={stats.totalProgress}>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {Math.round(stats.totalProgress)}%
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>
                </div>
              </ProgressRing>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-border/60 bg-background/35 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {contributionLabel}
                </p>
                <p className="mt-2 truncate text-lg font-bold text-foreground">
                  <Money value={stats.totalContributed} currency={currency} />
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-border/60 bg-background/35 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Required monthly saving
                </p>
                <p className="mt-2 truncate text-lg font-bold text-foreground">
                  <Money value={stats.totalRequiredMonthly} currency={currency} />
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-border/60 bg-background/35 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isYear ? 'Average monthly contribution' : 'Ahead / behind target'}
                </p>
                <p className="mt-2 truncate text-lg font-bold text-foreground">
                  {isYear ? (
                    <Money
                      value={stats.averageMonthlyContribution}
                      currency={currency}
                    />
                  ) : (
                    <Money
                      value={stats.totalContributed - stats.totalRequiredMonthly}
                      currency={currency}
                    />
                  )}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-border/60 bg-background/35 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isYear ? 'Goals completed this year' : 'Goals behind schedule'}
                </p>
                <p className="mt-2 truncate text-lg font-bold text-foreground">
                  {isYear
                    ? stats.completedGoals.length
                    : stats.goalsBehindSchedule.length}
                </p>
              </div>
            </div>
          </div>

          {stats.topContributedGoal ? (
            <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Top contributed goal
              </p>
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {stats.topContributedGoal.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(getGoalProgress(stats.topContributedGoal))}% complete
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary">
                  <Money
                    value={stats.topContributedGoal.periodContribution}
                    currency={currency}
                  />
                </p>
              </div>
            </div>
          ) : null}

          {priorityGoals.length > 0 ? (
            <div className="space-y-3">
              {priorityGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const remaining = getGoalRemaining(goal);
                const required = getMonthlyRequiredSaving(goal);
                const isBehind = stats.goalsBehindSchedule.some(
                  (item) => item.id === goal.id
                );

                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-border/60 bg-background/35 p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {goal.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          <Money value={goal.current_amount} currency={currency} /> /{' '}
                          <Money value={goal.target_amount} currency={currency} /> ·{' '}
                          {Math.round(progress)}% complete
                        </p>
                      </div>

                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          isBehind
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {isBehind ? 'Behind' : 'On pace'}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        Remaining <Money value={remaining} currency={currency} />
                      </span>
                      <span>
                        Required <Money value={required} currency={currency} />/mo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </ReflectCard>
  );
}

function BudgetVsActual({ rows, currency }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const visibleRows = safeRows.slice(0, 6);

  const typeLabel = (type) => {
    if (type === 'income') return 'Income';
    if (type === 'expense') return 'Expense';
    if (type === 'savings') return 'Savings';
    if (type === 'debt') return 'Debt';
    return 'Budget';
  };

  return (
    <ReflectCard className="p-5">
      <SectionHeading
        icon={BarChart3}
        title="Budget vs Actual"
        subtitle="Planned money compared with tracked activity for this period."
      />

      {visibleRows.length === 0 ? (
        <EmptyBlock
          title="No budget comparison yet"
          text="Create a monthly plan and add transactions to compare planned and actual progress."
        />
      ) : (
        <div className="space-y-3">
          {visibleRows.map((row) => {
            const used = clampPercent(row.usedPercent);
            const good = !row.isOver;

            return (
              <div
                key={`${row.type}-${row.id || row.name}`}
                className="rounded-2xl border border-border/60 bg-background/35 p-4"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {typeLabel(row.type)} · Planned{' '}
                      <Money value={row.planned} currency={currency} /> · Actual{' '}
                      <Money value={row.actual} currency={currency} />
                    </p>
                  </div>

                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                      good
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    )}
                  >
                    {row.variance >= 0 ? 'Left ' : 'Over '}
                    {formatCurrencyText(Math.abs(row.variance), currency)}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      row.isOver ? 'bg-red-500' : 'bg-primary'
                    )}
                    style={{ width: `${used}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{Math.round(row.usedPercent)}% used</span>
                  <span>{row.isOver ? 'Above plan' : 'Within plan'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ReflectCard>
  );
}

function CategoryTrends({ rows, comparablePeriodLabel, isYear, currency }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const visibleRows = safeRows.slice(0, 6);

  return (
    <ReflectCard className="p-5">
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
              <div
                key={row.id || row.name}
                className="rounded-2xl border border-border/60 bg-background/35 p-4"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current <Money value={row.current} currency={currency} /> ·
                      Previous <Money value={row.previous} currency={currency} />
                    </p>
                  </div>

                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                      positive
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : negative
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {Math.abs(Math.round(row.changePercent || 0))}%
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
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
    <section className="mb-5 space-y-4">
      <GoalProgressAnalysis
        isYear={isYear}
        goals={goals}
        goalTransactions={goalTransactions}
        currency={currency}
      />
    </section>
  );
}