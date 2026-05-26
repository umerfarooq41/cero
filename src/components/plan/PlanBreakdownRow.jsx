import CategoryIconBadge from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';
import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function getBudgetType(item) {
  return (
    item.budgetType ||
    item.budget_type ||
    item.type ||
    item.category?.type ||
    item.category?.budget_type ||
    'expense'
  );
}

function getSourceBadgeTone(item) {
  if (item.sourceType === 'goal') return 'savings';

  return getBudgetType(item) || 'transfer';
}

function getActionLabel(type) {
  if (type === 'income') return 'Received';
  if (type === 'savings') return 'Saved';
  if (type === 'debt') return 'Paid';

  return 'Used';
}

function getStatusLabel(type, rawPercent, isOverBudget, tracked) {
  if (tracked <= 0) return 'Unused';

  if (type === 'income' && rawPercent >= 100) return 'Received';
  if (type === 'savings' && rawPercent >= 100) return 'Saved';
  if (type === 'debt' && rawPercent >= 100) return 'Paid';

  if (type === 'expense') {
    if (isOverBudget) return 'Over budget';
    if (rawPercent >= 75) return 'Near limit';
  }

  return 'On track';
}

export default function PlanBreakdownRow({ item, currency }) {
  const isSourceRow = Boolean(item.sourceType);
  const type = getBudgetType(item);
  const planned = Number(item.planned || 0);
  const tracked = Number(item.tracked || 0);
  const rawPercent = planned > 0 ? (tracked / planned) * 100 : tracked > 0 ? 100 : 0;
  const isOverBudget = type === 'expense' && tracked > planned;
  const accentColor = item.categoryColor || item.color || 'hsl(var(--primary))';
  const amountColor = isOverBudget ? '#dc2626' : accentColor;
  const actionLabel = getActionLabel(type);
  const statusLabel = getStatusLabel(type, rawPercent, isOverBudget, tracked);

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
              className="shrink-0 text-sm font-bold tabular-nums"
              style={{ color: amountColor }}
            >
              <PlanMoney amount={planned} currency={currency} compact />
            </p>
          </div>

          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium leading-4 text-muted-foreground tabular-nums">
            <span>{actionLabel}</span>
            <span className="font-bold" style={{ color: amountColor }}>
              <PlanMoney amount={tracked} currency={currency} compact />
            </span>
            <span className="text-muted-foreground/70">·</span>
            <span>{Math.round(rawPercent)}%</span>
            <span className="text-muted-foreground/70">·</span>
            <span className="font-semibold" style={{ color: amountColor }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
