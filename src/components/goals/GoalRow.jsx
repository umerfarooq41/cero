import CategoryIconBadge from '@/components/shared/CategoryIcon';
import {
  formatGoalDate,
  getGoalProgress,
  getGoalRemaining,
  getMonthlyRequiredSaving,
} from '@/lib/goals';
import { cn } from '@/lib/utils';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';

const formatNumber = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
};

function Money({ amount, currency, compact = false, className = '' }) {
  const code = getSharedCurrencyCode(currency);
  const symbol = getSharedCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums',
        className
      )}
    >
      {code === 'SAR' ? (
        <span
          className={cn(
            'inline-block shrink-0 bg-current align-middle',
            compact ? 'h-[0.8em] w-[0.8em]' : 'h-[0.9em] w-[0.9em]'
          )}
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

export default function GoalRow({
  goal,
  currency,
  onClick,
  className,
}) {
  const current = Number(goal?.current_amount || 0);
  const target = Number(goal?.target_amount || 0);
  const progress = getGoalProgress(goal);
  const remaining = getGoalRemaining(goal);
  const monthlyRequired = getMonthlyRequiredSaving(goal);
  const isComplete = remaining <= 0;

  const color = goal?.color_key || '#2563EB';

  return (
    <button
      type="button"
      onClick={() => onClick?.(goal)}
      className={cn(
        'w-full px-4 py-4 text-left transition-colors hover:bg-muted/40',
        !onClick && 'cursor-default hover:bg-transparent',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <CategoryIconBadge
          icon={goal?.icon_key || 'target'}
          color={color}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold">
              {goal?.name || 'Savings goal'}
            </p>

            <p className="shrink-0 text-sm font-bold tabular-nums">
              <Money amount={current} currency={currency} compact />
            </p>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isComplete
                  ? 'hsl(var(--success))'
                  : color,
              }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground tabular-nums">
            <span className="min-w-0 truncate">
              {progress}% complete · Target{' '}
              <Money amount={target} currency={currency} compact />
              {' · '}
              {isComplete ? (
                'Funded'
              ) : monthlyRequired === null ? (
                'Set deadline'
              ) : (
                <>
                  <Money amount={monthlyRequired} currency={currency} compact />
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
