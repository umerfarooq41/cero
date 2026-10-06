import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  getGoalProgress,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
  todayIsoDate,
} from '@/lib/goals';
import ReflectCard from './ReflectCard.jsx';
import {
  CurrencyAmount,
  formatCurrencyText,
} from './ReflectSummaryCard.jsx';

const clampPercent = (value) =>
  Math.max(0, Math.min(Number.isFinite(Number(value)) ? Number(value) : 0, 100));

const safeNumber = (value) => Number(value || 0);

function isGoalComplete(goal) {
  const target = safeNumber(goal?.target_amount);
  const current = safeNumber(goal?.current_amount);

  return target > 0 && current >= target;
}

function isActiveGoal(goal) {
  if (goal?.is_archived) return false;
  if (isGoalComplete(goal)) return false;

  return true;
}

function shouldShowGoalInReflect(goal, isYear) {
  if (isYear) {
    return isActiveGoal(goal) || isGoalComplete(goal);
  }

  return isActiveGoal(goal);
}

function getTransactionGoalId(transaction) {
  return (
    transaction?.savings_goal_id ||
    transaction?.goal_id ||
    transaction?.source_id ||
    null
  );
}

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <h3 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
          {title}
        </h3>
      </div>

      {subtitle ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function EmptyBlock({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 app-card-surface-soft px-3 py-5 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function ProgressRing({ value, children, size = 74 }) {
  const safeValue = clampPercent(value);
  const stroke = 8;
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
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap tabular-nums',
        className
      )}
    >
      {sign ? <span>{sign}</span> : null}
      <CurrencyAmount amount={Math.abs(amount)} currency={currency} compact />
    </span>
  );
}

function MetricLine({ label, value, subtext, tone = 'default', delay = 0 }) {
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
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border/45 app-card-surface-soft px-2.5 py-2"
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay }}
    >
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {subtext ? (
          <p className="mt-0.5 truncate text-[10px] leading-3 text-muted-foreground">
            {subtext}
          </p>
        ) : null}
      </div>

      <div className={cn('min-w-0 text-right text-sm font-bold tabular-nums', toneClass)}>
        {value}
      </div>
    </motion.div>
  );
}

function isGoalTransferTransaction(transaction) {
  return (
    transaction?.type === 'transfer' &&
    Boolean(
      transaction.savings_goal_id ||
        transaction.goal_id ||
        transaction.goal_contribution_id ||
        transaction.source_type === 'goal' ||
        transaction.source_type === 'savings_goal'
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

  const fallbackStart = todayIsoDate();
  const start = new Date(
    `${goal.start_date || goal.created_at?.slice(0, 10) || fallbackStart}T00:00:00`
  );
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
  const reflectGoals = useMemo(
    () =>
      Array.isArray(goals)
        ? goals.filter((goal) => shouldShowGoalInReflect(goal, isYear))
        : [],
    [goals, isYear]
  );

  const reflectGoalIds = useMemo(
    () => new Set(reflectGoals.map((goal) => goal.id).filter(Boolean)),
    [reflectGoals]
  );

  const safeGoalTransactions = useMemo(() => {
    if (!Array.isArray(goalTransactions)) return [];
    if (reflectGoalIds.size === 0) return [];

    return goalTransactions.filter((transaction) => {
      if (!isGoalTransferTransaction(transaction)) return false;

      const goalId = getTransactionGoalId(transaction);
      return goalId ? reflectGoalIds.has(goalId) : false;
    });
  }, [goalTransactions, reflectGoalIds]);

  const stats = useMemo(() => {
    const totalSaved = reflectGoals.reduce(
      (sum, goal) => sum + safeNumber(goal.current_amount),
      0
    );
    const totalTarget = reflectGoals.reduce(
      (sum, goal) => sum + safeNumber(goal.target_amount),
      0
    );
    const periodContribution = safeGoalTransactions
      .filter(isGoalTransferTransaction)
      .reduce((sum, transaction) => sum + Math.max(0, safeNumber(transaction.amount)), 0);
    const monthlyRequired = reflectGoals.reduce((sum, goal) => {
      const required = getMonthlyRequiredSaving(goal);
      return sum + (required === null ? 0 : safeNumber(required));
    }, 0);
    const completed = reflectGoals.filter(isGoalComplete).length;

    return {
      totalSaved,
      totalTarget,
      periodContribution,
      monthlyRequired,
      completed,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    };
  }, [reflectGoals, safeGoalTransactions]);

  const priorityGoals = useMemo(
    () => sortGoalsByPriority(reflectGoals).slice(0, 3),
    [reflectGoals]
  );

  return (
    <ReflectCard className="overflow-hidden p-3 sm:p-4">
      <SectionHeading
        icon={Target}
        title="Goal Progress Analysis"
        subtitle="Goals, contributions, and required monthly pace."
      />

      {reflectGoals.length === 0 ? (
        <EmptyBlock
          title={isYear ? 'No goals to summarize' : 'No active savings goals'}
          text={
            isYear
              ? 'Goals completed or active during the year will appear here.'
              : 'Create a new goal in Manage Plan, then Reflect will show progress and pace analysis here. Completed goals stay out of monthly active goal analysis.'
          }
        />
      ) : (
        <motion.div
          className="min-w-0 space-y-3"
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
            className="grid min-w-0 grid-cols-[74px_minmax(0,1fr)] items-center gap-3"
            variants={{
              hidden: { y: 8, opacity: 0 },
              show: {
                y: 0,
                opacity: 1,
                transition: { type: 'spring', stiffness: 210, damping: 20 },
              },
            }}
          >
            <ProgressRing value={stats.overallProgress}>
              <div>
                <p className="text-base font-bold leading-none tabular-nums">
                  {Math.round(clampPercent(stats.overallProgress))}%
                </p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Saved
                </p>
              </div>
            </ProgressRing>

            <div className="min-w-0 space-y-1.5">
              <MetricLine
                label="Saved"
                value={<Money value={stats.totalSaved} currency={currency} />}
                subtext={`Target ${formatCurrencyText(stats.totalTarget, currency)}`}
                tone="good"
                delay={0.04}
              />
              <MetricLine
                label={isYear ? 'This year' : 'This month'}
                value={<Money value={stats.periodContribution} currency={currency} />}
                delay={0.08}
              />
              <MetricLine
                label="Required/mo"
                value={<Money value={stats.monthlyRequired} currency={currency} />}
                subtext={`${stats.completed}/${reflectGoals.length} funded`}
                delay={0.12}
              />
            </div>
          </motion.div>

          <div className="min-w-0 space-y-2.5 border-t border-border/45 pt-3">
            {priorityGoals.map((goal, index) => {
              const progress = getGoalProgress(goal);
              const track = getGoalTrackState(goal);
              const monthlyRequired = getMonthlyRequiredSaving(goal);

              return (
                <motion.div
                  key={goal.id}
                  className="min-w-0"
                  variants={{
                    hidden: { y: 8, opacity: 0 },
                    show: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 220,
                        damping: 22,
                        delay: index * 0.02,
                      },
                    },
                  }}
                >
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {goal.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold',
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
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 18,
                        delay: 0.1 + index * 0.03,
                      }}
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

export default function ReflectDeepAnalysis({
  isYear,
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
