import { Badge } from '@/components/ui/badge';
import CategoryIconBadge from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';
import PlanMoney, { formatPlanNumber } from './PlanMoney';

const SOURCE_BADGE_CLASS = {
  recurring:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  goal: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

export default function PlanBreakdownRow({ item, currency }) {
  const isSourceRow = Boolean(item.sourceType);
  const percent =
    item.planned > 0 ? Math.min((item.tracked / item.planned) * 100, 100) : 0;

  const rightAmount = isSourceRow ? item.planned : item.tracked;

  return (
    <div className={cn('px-4 py-4', isSourceRow && 'bg-white/10 dark:bg-white/[0.015]')}>
      <div className="flex items-center gap-3">
        <CategoryIconBadge
          icon={item.icon || item.category?.icon}
          color={item.categoryColor || item.color}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{item.name}</p>

                {item.sourceType && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'h-5 rounded-full px-2 text-[10px] font-semibold leading-none',
                      SOURCE_BADGE_CLASS[item.sourceType]
                    )}
                  >
                    {item.sourceType === 'goal' ? 'Goal' : 'Recurring'}
                  </Badge>
                )}
              </div>
            </div>

            <p className="shrink-0 text-sm font-bold tabular-nums">
              <PlanMoney amount={rightAmount} currency={currency} compact />
            </p>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                backgroundColor: item.remaining < 0 ? '#DC2626' : item.color,
              }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              {formatPlanNumber(item.tracked)} / {formatPlanNumber(item.planned)}
            </span>

            <span className={item.remaining < 0 ? 'font-medium text-red-600' : ''}>
              {item.remaining >= 0
                ? `${formatPlanNumber(item.remaining)} left`
                : `${formatPlanNumber(Math.abs(item.remaining))} over`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
