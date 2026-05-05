import React from 'react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function AllocationRow({
  category,
  value,
  lastMonthHint,
  onChange,
  isSubcategory,
  formatCurrency,
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2.5 px-4',
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
        <span
          className={cn(
            'text-sm truncate block',
            isSubcategory ? 'text-muted-foreground' : 'font-medium'
          )}
        >
          {category.name}
        </span>

        {lastMonthHint > 0 && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            Last month:
            {formatCurrency
              ? formatCurrency(lastMonthHint)
              : Number(lastMonthHint || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </span>
        )}
      </div>

      <div className="w-28 shrink-0">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="h-8 text-right text-sm tabular-nums"
        />
      </div>
    </div>
  );
}