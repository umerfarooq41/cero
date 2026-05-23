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

  return (
    <section
      className={cn(
        'min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl sm:p-4 md:p-5',
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold tracking-tight text-foreground md:text-base">
                Top goal progress
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your highest-priority savings goal.
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="shrink-0 self-start gap-1 text-xs">
          <Link to="/transactions?tab=scheduled">
            View Scheduled
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {topGoal ? (
        <div className="min-w-0 rounded-2xl border border-border/60 bg-background/35 p-3 sm:p-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="break-words text-base font-bold leading-6 tracking-tight text-foreground">
                {topGoal.name}
              </p>
              <p className="mt-1 break-words text-sm font-semibold leading-5 text-muted-foreground tabular-nums">
                {formatCurrency(Number(topGoal.current_amount || 0))} /{' '}
                {formatCurrency(Number(topGoal.target_amount || 0))}
              </p>
            </div>

            <span className="w-fit shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {getGoalProgress(topGoal)}% complete
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${getGoalProgress(topGoal)}%` }}
            />
          </div>

          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-card/45 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Required monthly
              </p>
              <p className="mt-1 break-words text-sm font-bold leading-5 text-foreground tabular-nums">
                {getMonthlyRequiredSaving(topGoal) === null
                  ? 'No target date'
                  : formatCurrency(getMonthlyRequiredSaving(topGoal))}
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/45 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Target
              </p>
              <p className="mt-1 break-words text-sm font-bold leading-5 text-foreground">
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
