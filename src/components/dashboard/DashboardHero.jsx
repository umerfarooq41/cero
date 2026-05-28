import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  LayoutDashboard,
  Receipt,
  Target,
  TrendingDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function MetricCard({ label, value, detail, icon: Icon, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
      : tone === 'warning'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : tone === 'danger'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-primary/10 text-primary';

  return (
    <div className="app-card-surface-soft rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/75">
            {label}
          </p>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {value}
          </div>
          {detail ? (
            <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
              {detail}
            </p>
          ) : null}
        </div>

        {Icon ? (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', toneClass)}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PreviewRow({ icon: Icon, title, subtitle, amount, badge }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/35 py-3 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/70 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
          {badge ? (
            <span className="rounded-full border border-border/45 bg-background/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {amount ? (
        <div className="shrink-0 text-sm font-black tabular-nums text-foreground">
          {amount}
        </div>
      ) : null}
    </div>
  );
}

function getGoalAmount(goal) {
  return Number(goal?.current_amount ?? goal?.saved_amount ?? goal?.starting_amount ?? 0);
}

function getGoalTarget(goal) {
  return Number(goal?.target_amount ?? goal?.amount ?? 0);
}

export default function DashboardHero({
  budget,
  transactions = [],
  recurringTransactions = [],
  goals = [],
  formatCurrency,
}) {
  const currentMonthLabel = format(new Date(), 'MMMM yyyy');
  const plannedOutflow =
    Number(budget.totalPlannedExpenses || 0) +
    Number(budget.totalPlannedSavings || 0) +
    Number(budget.totalPlannedDebt || 0);
  const trackedOutflow =
    Number(budget.totalExpenses || 0) +
    Number(budget.totalTrackedSavings || 0) +
    Number(budget.totalTrackedDebt || 0);
  const topGoal = goals.find((goal) => getGoalTarget(goal) > 0);
  const goalProgress = topGoal
    ? Math.min((getGoalAmount(topGoal) / getGoalTarget(topGoal)) * 100, 100)
    : 0;
  const upcomingCount = recurringTransactions.filter((item) => !item.is_archived).length;
  const leftValue = Number(budget.leftToAllocate || 0);
  const leftTone = leftValue === 0 ? 'good' : leftValue > 0 ? 'warning' : 'danger';

  return (
    <section className="relative overflow-hidden rounded-[2rem] app-card-surface-strong p-5 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-[hsl(var(--success)/0.11)] blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/45 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Financial home base
          </div>

          <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
            Your monthly plan, clear from the first glance.
          </h1>

          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
            Build a monthly plan where every penny you earn has a purpose. Track your budget, scheduled bills, accounts, and goals from one clean website-style command center.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm font-bold shadow-sm">
              <Link to="/manage-plan">
                Set up budget
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-sm font-bold">
              <Link to="/transactions">Review activity</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            label="Left to allocate"
            value={formatCurrency(leftValue)}
            detail={`${currentMonthLabel} budget balance`}
            icon={CircleDollarSign}
            tone={leftTone}
          />

          <MetricCard
            label="Tracked"
            value={formatCurrency(trackedOutflow)}
            detail={`of ${formatCurrency(plannedOutflow || 0)} planned outflow`}
            icon={TrendingDown}
            tone="default"
          />

          <div className="app-card-surface-soft rounded-3xl p-4 sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/75">
                  Website preview
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">
                  Money command center
                </h2>
              </div>
              <span className="rounded-full border border-border/50 bg-background/45 px-3 py-1 text-xs font-bold text-muted-foreground">
                {transactions.length} posted
              </span>
            </div>

            <PreviewRow
              icon={CalendarCheck}
              title="Monthly plan"
              subtitle="Income, expenses, savings, and debt"
              amount={formatCurrency(Number(budget.totalPlannedIncome || 0))}
              badge="Plan"
            />
            <PreviewRow
              icon={Receipt}
              title="Scheduled bills"
              subtitle={`${upcomingCount} active recurring rules`}
              amount={formatCurrency(Number(budget.totalPlannedExpenses || 0))}
              badge="Due"
            />
            <PreviewRow
              icon={Target}
              title={topGoal?.name || 'Savings goals'}
              subtitle={topGoal ? `${Math.round(goalProgress)}% complete` : 'Create your first goal'}
              amount={topGoal ? formatCurrency(getGoalTarget(topGoal)) : null}
              badge="Goal"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
