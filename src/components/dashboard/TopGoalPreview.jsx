import { Link } from 'react-router-dom';
import { ArrowRight, Flag, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  formatGoalDate,
  getGoalProgress,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
} from '@/lib/goals';
import { cn } from '@/lib/utils';

function getTopGoal(goals = []) {
  return sortGoalsByPriority(goals.filter((goal) => !goal.is_archived))[0] || null;
}

export default function TopGoalPreview({ goals = [], formatCurrency, className }) {
  const topGoal = getTopGoal(goals);
  const progress = topGoal ? getGoalProgress(topGoal) : 0;

  return (
    <section
      className={cn(
        'rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl md:p-5',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Target className="h-4 w-4 shrink-0 text-muted-foreground" />

            <h2 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground md:text-base">
              Top goal progress
            </h2>
          </div>

          <p className="mt-1 text-left text-xs leading-5 text-muted-foreground">
            Your highest-priority savings goal.
          </p>
        </div>

        <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 px-2 text-xs">
          <Link to="/transactions?tab=scheduled">
            Scheduled
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {topGoal ? (
        <div className="rounded-2xl border border-border/60 bg-background/35 p-3 sm:p-4">
          <div className="flex min-w-0 items-start justify-between gap-2.5 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold tracking-tight text-foreground sm:text-base">
                {topGoal.name}
              </p>
              <p className="mt-1 truncate text-[12px] font-semibold text-muted-foreground tabular-nums sm:text-sm">
                {formatCurrency(Number(topGoal.current_amount || 0))} /{' '}
                {formatCurrency(Number(topGoal.target_amount || 0))}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary sm:px-2.5 sm:text-[11px]">
              {progress}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="min-w-0 rounded-2xl border border-border/50 bg-card/45 p-2.5 sm:p-3">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                Required monthly
              </p>
              <p className="mt-1 truncate text-[12px] font-bold text-foreground tabular-nums sm:text-sm">
                {getMonthlyRequiredSaving(topGoal) === null
                  ? 'No target date'
                  : formatCurrency(getMonthlyRequiredSaving(topGoal))}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl border border-border/50 bg-card/45 p-2.5 sm:p-3">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                Target
              </p>
              <p className="mt-1 truncate text-[12px] font-bold text-foreground sm:text-sm">
                {formatGoalDate(topGoal.target_date)}
              </p>
            </div>
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
    </section>
  );
}
