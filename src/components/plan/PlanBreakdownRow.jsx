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

  return 'Spent';
}

function getStatusLabel(type, rawPercent, isOverBudget, tracked) {
  if (type === 'income') {
    if (tracked <= 0) return 'Not received';
    if (rawPercent >= 100) return 'Received';
    return 'Part received';
  }

  if (type === 'savings') {
    if (tracked <= 0) return 'Not saved';
    if (rawPercent >= 100) return 'Saved';
    return 'Part saved';
  }

  if (type === 'debt') {
    if (tracked <= 0) return 'Not paid';
    if (rawPercent >= 100) return 'Paid';
    return 'Part paid';
  }

  if (tracked <= 0) return 'Not started';
  if (isOverBudget) return 'Over budget';
  if (rawPercent >= 100) return 'Fully spent';

  return 'On track';
}
export default function PlanBreakdownRow({ item, currency }) {
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
      className="px-3 py-3 transition-colors hover:bg-accent/30 sm:px-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <CategoryIconBadge
          icon={item.icon || item.category?.icon}
          color={item.categoryColor || item.color}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="min-w-0 truncate text-sm font-medium leading-5 text-foreground">
              {item.name}
            </p>

            <SourceBadge
              type={item.sourceType}
              tone={getSourceBadgeTone(item)}
            />
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] font-normal leading-3.5 text-muted-foreground tabular-nums">
            <span>{actionLabel}</span>
            <span className="font-normal text-muted-foreground">
              <PlanMoney amount={tracked} currency={currency} compact />
            </span>
            <span className="text-muted-foreground/70">·</span>
            <span>{Math.round(rawPercent)}%</span>
            <span className="text-muted-foreground/70">·</span>
            <span>{statusLabel}</span>
          </div>
        </div>

        <p
          className="shrink-0 self-center text-right text-sm font-medium tabular-nums"
          style={{ color: amountColor }}
        >
          <PlanMoney amount={planned} currency={currency} compact />
        </p>
      </div>
    </div>
  );
}
