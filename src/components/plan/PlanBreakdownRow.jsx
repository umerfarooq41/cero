import { Badge } from '@/components/ui/badge';
import CategoryIconBadge from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';
import PlanMoney, { formatPlanNumber } from './PlanMoney';

const SOURCE_BADGE_CLASS = {
  recurring:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  goal: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

function getProgressColor(item) {
  if (item.remaining < 0) return '#DC2626';
  if (item.planned > 0 && item.tracked >= item.planned) return '#F59E0B';
  return item.color || item.categoryColor || 'hsl(var(--primary))';
}

export default function PlanBreakdownRow({ item, currency }) {
  const isSourceRow = Boolean(item.sourceType);
  const percent =
    item.planned > 0 ? Math.min((item.tracked / item.planned) * 100, 100) : 0;

  const rightAmount = isSourceRow ? item.planned : item.tracked;
  const progressColor = getProgressColor(item);

  return (
    <div
      className={cn(
        'px-3 py-3.5 transition-colors sm:px-4',
        isSourceRow && 'bg-white/10 dark:bg-white/[0.015]'
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <CategoryIconBadge
          icon={item.icon || item.category?.icon}
          color={item.categoryColor || item.color}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <p className="min-w-0 truncate text-sm font-bold leading-5 text-foreground">
                  {item.name}
                </p>

                {item.sourceType && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'h-5 shrink-0 rounded-full px-2 text-[10px] font-semibold leading-none',
                      SOURCE_BADGE_CLASS[item.sourceType]
                    )}
                  >
                    {item.sourceType === 'goal' ? 'Goal' : 'Recurring'}
                  </Badge>
                )}
              </div>

              <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <PlanMoney amount={item.tracked} currency={currency} compact />
                <span>of</span>
                <PlanMoney amount={item.planned} currency={currency} compact />
                <span>·</span>
                <span>{Math.round(percent)}% used</span>
              </div>
            </div>

            <p
              className={cn(
                'shrink-0 text-sm font-bold tabular-nums',
                item.remaining < 0 ? 'text-red-600' : 'text-foreground'
              )}
            >
              <PlanMoney amount={rightAmount} currency={currency} compact />
            </p>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-muted-foreground tabular-nums">
            <span className="truncate">
              {item.remaining >= 0 ? 'Remaining' : 'Over plan'}
            </span>

            <span
              className={cn(
                'shrink-0 font-medium',
                item.remaining < 0
                  ? 'text-red-600'
                  : item.remaining === 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
              )}
            >
              {item.remaining >= 0 ? (
                <>
                  <PlanMoney
                    amount={item.remaining}
                    currency={currency}
                    compact
                  />{' '}
                  left
                </>
              ) : (
                <>
                  <PlanMoney
                    amount={Math.abs(item.remaining)}
                    currency={currency}
                    compact
                  />{' '}
                  over
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}