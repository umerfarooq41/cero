import { Link } from 'react-router-dom';
import { ArrowRight, Flag, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import DashboardSectionCard, {
  DashboardGhostAction,
} from '@/components/dashboard/DashboardSectionCard';
import {
  formatGoalDate,
  getGoalProgress,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
} from '@/lib/goals';

function getTopGoal(goals = []) {
  return sortGoalsByPriority(goals.filter((goal) => !goal.is_archived))[0] || null;
}

function SmallMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-background/35 p-2.5 sm:p-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-foreground tabular-nums sm:text-sm">
        {value}
      </p>
    </div>
  );
}

export default function TopGoalPreview({ goals = [], formatCurrency, className }) {
  const topGoal = getTopGoal(goals);

  return (
    <DashboardSectionCard
      title="Top goal progress"
      subtitle="Your highest-priority savings goal."
      icon={Target}
      className={className}
      action={
        <DashboardGhostAction>
          <Link to="/transactions?tab=scheduled">
            <span className="hidden sm:inline">View </span>Scheduled
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </DashboardGhostAction>
      }
    >
      {topGoal ? (
        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold tracking-tight text-foreground">
                {topGoal.name}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground tabular-nums sm:text-sm">
                {formatCurrency(Number(topGoal.current_amount || 0))} /{' '}
                {formatCurrency(Number(topGoal.target_amount || 0))}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary sm:px-2.5 sm:py-1 sm:text-[11px]">
              {getGoalProgress(topGoal)}%
              <span className="hidden sm:inline"> complete</span>
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary sm:mt-4">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${getGoalProgress(topGoal)}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
            <SmallMetric
              label="Required monthly"
              value={
                getMonthlyRequiredSaving(topGoal) === null
                  ? 'No target'
                  : formatCurrency(getMonthlyRequiredSaving(topGoal))
              }
            />

            <SmallMetric label="Target" value={formatGoalDate(topGoal.target_date)} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Flag className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No savings goal yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Create a savings goal in Manage Plan. Contributions happen from Transactions → Scheduled.
          </p>
          <Button asChild size="sm" className="mt-4 rounded-xl">
            <Link to="/manage-plan?tab=goals">Manage Goals</Link>
          </Button>
        </div>
      )}
    </DashboardSectionCard>
  );
}
