import CategoryIconBadge from '@/components/shared/CategoryIcon';
import {
  formatGoalDate,
  getGoalProgress,
  getGoalRemaining,
  getMonthlyRequiredSaving,
} from '@/lib/goals';
import { cn } from '@/lib/utils';

function GoalMoney({ value, formatCurrency }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap tabular-nums">
      {formatCurrency(Math.abs(Number(value || 0)))}
    </span>
  );
}

export default function GoalRow({
  goal,
  formatCurrency,
  color = '#2563EB',
  onClick,
  className,
}) {
  const current = Number(goal?.current_amount || 0);
  const target = Number(goal?.target_amount || 0);
  const progress = getGoalProgress(goal);
  const remaining = getGoalRemaining(goal);
  const monthlyRequired = getMonthlyRequiredSaving(goal);

  const isComplete = remaining <= 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(goal)}
      className={cn(
        'w-full px-4 py-4 text-left transition-colors hover:bg-muted/40',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <CategoryIconBadge
          icon={goal?.icon_key || 'target'}
          color={goal?.color_key || color}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold">
              {goal?.name || 'Savings goal'}
            </p>

            <p className="shrink-0 text-sm font-bold tabular-nums">
              {progress}%
            </p>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isComplete
                  ? 'hsl(var(--success))'
                  : goal?.color_key || color,
              }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground tabular-nums">
            <span className="min-w-0 truncate">
              <GoalMoney value={current} formatCurrency={formatCurrency} />
              {' / '}
              <GoalMoney value={target} formatCurrency={formatCurrency} />
              {' · '}
              {isComplete ? (
                'Funded'
              ) : monthlyRequired === null ? (
                'Set deadline'
              ) : (
                <>
                  <GoalMoney
                    value={monthlyRequired}
                    formatCurrency={formatCurrency}
                  />
                  {' / month'}
                </>
              )}
            </span>

            <span className="shrink-0">
              {formatGoalDate(goal?.target_date)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}