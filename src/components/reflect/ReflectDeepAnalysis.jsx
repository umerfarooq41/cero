import React, { useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
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

      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children}
      </div>
    </div>
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
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-red-600 dark:text-red-400'
        : tone === 'warning'
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-foreground';

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className={cn('mt-1 text-sm font-bold tabular-nums', toneClass)}>
        {value}
      </div>
      {subtext ? <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{subtext}</p> : null}
    </div>
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
    <ReflectCard className="p-5">
      <SectionHeading
        icon={Target}
        title="Goal Progress Analysis"
        subtitle="Savings goal progress, current-period contributions, and required monthly pace."
      />

      {activeGoals.length === 0 ? (
        <EmptyBlock
          title="No savings goals yet"
          text="Create savings goals from Plan or Dashboard, then Reflect will show progress and pace analysis here."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center gap-4 rounded-3xl bg-muted/20 p-4">
            <ProgressRing value={stats.overallProgress}>
              <div>
                <p className="text-lg font-bold leading-none tabular-nums">
                  {Math.round(clampPercent(stats.overallProgress))}%
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Saved
                </p>
              </div>
            </ProgressRing>

            <div className="min-w-0 flex-1 space-y-2">
              <MiniMetric
                label="Saved toward goals"
                value={<Money value={stats.totalSaved} currency={currency} />}
                subtext={`Target ${formatCurrencyText(stats.totalTarget, currency)}`}
                tone="good"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <MiniMetric
                  label={isYear ? 'Contributed this year' : 'Contributed this month'}
                  value={<Money value={stats.periodContribution} currency={currency} />}
                />
                <MiniMetric
                  label="Required monthly"
                  value={<Money value={stats.monthlyRequired} currency={currency} />}
                  subtext={`${stats.completed}/${activeGoals.length} goals funded`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {priorityGoals.map((goal) => {
              const progress = getGoalProgress(goal);
              const track = getGoalTrackState(goal);
              const monthlyRequired = getMonthlyRequiredSaving(goal);

              return (
                <div key={goal.id} className="rounded-2xl border border-border/60 bg-card/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{goal.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <Money value={goal.current_amount} currency={currency} /> of{' '}
                        <Money value={goal.target_amount} currency={currency} />
                      </p>
                    </div>

                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        track.tone === 'good'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : track.tone === 'warning'
                            ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {track.label}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${clampPercent(progress)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{Math.round(progress)}% complete</span>
                    <span>
                      {monthlyRequired === null ? 'No deadline' : `${formatCurrencyText(monthlyRequired, currency)}/mo`}
                    </span>
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
    <ReflectCard className="p-5">
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
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
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
                <div key={row.id} className="rounded-2xl border border-border/60 bg-card/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
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
              <div key={row.id} className="rounded-2xl border border-border/60 bg-card/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current <Money value={row.current} currency={currency} /> · Previous{' '}
                      <Money value={row.previous} currency={currency} />
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
    <section className="mb-5 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Detailed Analysis</h3>
      </div>

      <GoalProgressAnalysis
        isYear={isYear}
        goals={goals}
        goalTransactions={goalTransactions}
        currency={currency}
      />
    </section>
  );
}
