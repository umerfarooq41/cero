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

function getGoalSavedAmount(goal) {
  return Math.max(0, Number(goal?.current_amount ?? goal?.saved_amount ?? 0));
}

function getGoalTargetAmount(goal) {
  return Math.max(0, Number(goal?.target_amount ?? 0));
}

function isGoalComplete(goal) {
  const target = getGoalTargetAmount(goal);
  const saved = getGoalSavedAmount(goal);

  if (target <= 0) return false;

  return saved >= target || getGoalProgress(goal) >= 100;
}

function isDashboardGoalCandidate(goal) {
  return Boolean(
    goal &&
      !goal.is_archived &&
      getGoalTargetAmount(goal) > 0 &&
      !isGoalComplete(goal)
  );
}

function getTopGoal(goals = []) {
  return sortGoalsByPriority(goals.filter(isDashboardGoalCandidate))[0] || null;
}

function SmallMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl app-card-surface-soft p-2.5 sm:p-3">
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
  const savedAmount = topGoal ? getGoalSavedAmount(topGoal) : 0;
  const targetAmount = topGoal ? getGoalTargetAmount(topGoal) : 0;
  const progress = topGoal ? getGoalProgress(topGoal) : 0;
  const monthlyRequired = topGoal ? getMonthlyRequiredSaving(topGoal) : null;

  return (
    <DashboardSectionCard
      title="Top goal progress"
      subtitle="Your highest-priority active savings goal."
      icon={Target}
      className={className}
      action={
        <DashboardGhostAction>
          <Link to="/manage-plan?tab=goals">
            View all
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
                {formatCurrency(savedAmount)} / {formatCurrency(targetAmount)}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary sm:px-2.5 sm:py-1 sm:text-[11px]">
              {progress}%
              <span className="hidden sm:inline"> complete</span>
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary sm:mt-4">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
            <SmallMetric
              label="Required monthly"
              value={
                monthlyRequired === null
                  ? 'No target'
                  : formatCurrency(monthlyRequired)
              }
            />

            <SmallMetric label="Target" value={formatGoalDate(topGoal.target_date)} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 app-card-surface-soft px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Flag className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No active savings goals</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Completed goals stay in Manage Plan. Create a new goal to show progress here.
          </p>
          <Button asChild size="sm" className="mt-4 rounded-xl">
            <Link to="/manage-plan?tab=goals">Manage Goals</Link>
          </Button>
        </div>
      )}
    </DashboardSectionCard>
  );
}
