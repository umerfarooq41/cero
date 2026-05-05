import React from 'react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

const fallbackFormatCurrency = (amount) =>
  Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PlanCategoryRow({
  category,
  spent,
  planned,
  isSubcategory,
  formatCurrency,
}) {
  const money = formatCurrency || fallbackFormatCurrency;

  const percentage = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
  const remaining = planned - spent;
  const isOver = spent > planned && planned > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 px-4',
        isSubcategory && 'pl-14'
      )}
    >
      {!isSubcategory && (
        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
      )}

      {isSubcategory && (
        <div className="w-2 h-2 rounded-full bg-border shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={cn(
              'text-sm truncate',
              isSubcategory ? 'text-muted-foreground' : 'font-medium'
            )}
          >
            {category.name}
          </span>

          <span
            className={cn(
              'text-sm font-medium tabular-nums shrink-0 ml-2 inline-flex items-center gap-1',
              isOver ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {remaining >= 0 ? (
              <>
                {money(remaining)}
                <span>left</span>
              </>
            ) : (
              <>
                {money(Math.abs(remaining))}
                <span>over</span>
              </>
            )}
          </span>
        </div>

        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOver
                ? 'bg-destructive'
                : category.type === 'income'
                  ? 'bg-[hsl(var(--success))]'
                  : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}