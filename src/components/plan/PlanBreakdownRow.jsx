import CategoryIconBadge from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';
import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function getProgressColor(item, rawPercent) {
  if (item.remaining < 0 || rawPercent > 100) return '#DC2626';
  if (rawPercent >= 100) return '#F59E0B';
  return item.color || item.categoryColor || 'hsl(var(--primary))';
}

function getTrackedVerb(item) {
  const type =
    item.budgetType ||
    item.budget_type ||
    item.type ||
    item.category?.type ||
    item.category?.budget_type;

  if (type === 'income') return 'received';
  if (type === 'savings') return 'saved';
  if (type === 'debt') return 'paid';

  return 'spent';
}

function getSourceBadgeTone(item) {
  if (item.sourceType === 'goal') return 'savings';

  return (
    item.budgetType ||
    item.budget_type ||
    item.type ||
    item.category?.type ||
    item.category?.budget_type ||
    'transfer'
  );
}

export default function PlanBreakdownRow({ item, currency }) {
  const isSourceRow = Boolean(item.sourceType);

  const rawPercent = item.planned > 0 ? (item.tracked / item.planned) * 100 : 0;
  const percent = Math.min(rawPercent, 100);
  const progressColor = getProgressColor(item, rawPercent);
  const trackedVerb = getTrackedVerb(item);

  return (
    <div
      className={cn(
        'px-3 py-3 transition-colors sm:px-4',
        isSourceRow && 'app-card-surface-soft'
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

                <SourceBadge
                  type={item.sourceType}
                  tone={getSourceBadgeTone(item)}
                />
              </div>
            </div>

            <p
              className={cn(
                'shrink-0 text-sm font-bold tabular-nums',
                item.remaining < 0 ? 'text-red-600' : 'text-foreground'
              )}
            >
              <PlanMoney amount={item.planned} currency={currency} compact />
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
              <PlanMoney amount={item.tracked} currency={currency} compact />{' '}
              {trackedVerb}
            </span>

            <span
              className={cn(
                'shrink-0 font-semibold',
                item.remaining < 0 || rawPercent > 100
                  ? 'text-red-600'
                  : rawPercent >= 100
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
              )}
            >
              {Math.round(rawPercent)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}