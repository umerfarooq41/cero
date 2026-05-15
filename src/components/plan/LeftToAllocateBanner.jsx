import React from 'react';
import { Check, AlertTriangle, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const fallbackFormatCurrency = (amount) =>
  Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function LeftToAllocateBanner({
  leftToAllocate,
  totalIncome,
  isEditMode,
  formatCurrency,
}) {
  const money = formatCurrency || fallbackFormatCurrency;

  const isZero = Math.abs(leftToAllocate) < 0.01;
  const isOver = leftToAllocate < 0;
  const isUnder = leftToAllocate > 0;

  const stateColor = isZero
    ? 'text-[hsl(var(--success))]'
    : isOver
      ? 'text-destructive'
      : 'text-primary';

  const bgColor = isZero
    ? 'bg-[hsl(var(--success)/0.08)] border-[hsl(var(--success)/0.2)]'
    : isOver
      ? 'bg-destructive/5 border-destructive/20'
      : 'bg-primary/5 border-primary/20';


  return (
    <div
      className={cn(
        'sticky top-[72px] z-20 rounded-3xl border border-border bg-card px-4 py-3 shadow-md backdrop-blur-xl transition-all duration-300',
        isEditMode ? bgColor : 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Income
          </div>

          <div className="text-sm font-bold tabular-nums sm:text-base inline-flex items-center gap-1">
            {money(totalIncome)}
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex-1 flex flex-col items-center">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
            Left to Allocate
          </div>

          <div
            className={cn(
              'text-2xl font-bold tracking-tight tabular-nums inline-flex items-center gap-1',
              stateColor
            )}
          >
            {isOver && <span>-</span>}
            {money(Math.abs(leftToAllocate))}
          </div>

        </div>

        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            isZero
              ? 'bg-[hsl(var(--success)/0.15)]'
              : isOver
                ? 'bg-destructive/10'
                : 'bg-primary/10'
          )}
        >
          {isZero && <Check className={cn('w-4 h-4', stateColor)} />}
          {isOver && <AlertTriangle className={cn('w-4 h-4', stateColor)} />}
          {isUnder && <CircleDollarSign className={cn('w-4 h-4', stateColor)} />}
        </div>
      </div>
    </div>
  );
}