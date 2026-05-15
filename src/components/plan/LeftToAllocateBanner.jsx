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

  const feedbackText = isZero
    ? 'All money assigned ✓'
    : isOver
      ? (
          <span className="inline-flex items-center gap-1">
            <span>Over by</span>
            {money(Math.abs(leftToAllocate))}
          </span>
        )
      : 'Unassigned money remaining';

  return (
    <div
      className={cn(
        'sticky top-0 z-20 surface-card card-elevated backdrop-blur-xl border border-white/40 dark:border-white/[0.05] rounded-xl p-4 transition-all duration-300',
        isEditMode ? bgColor : 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
            Income
          </div>

          <div className="text-sm font-bold tabular-nums sm:text-base inline-flex items-center gap-1">
            {money(totalIncome)}
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex-1 flex flex-col items-center">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
            Left to Allocate
          </div>

          <div
            className={cn(
              'text-xl font-bold tabular-nums tracking-tight inline-flex items-center gap-1 sm:text-2xl',
              stateColor
            )}
          >
            {isOver && <span>-</span>}
            {money(Math.abs(leftToAllocate))}
          </div>

          {isEditMode && (
            <div className={cn('text-[11px] font-medium mt-0.5', stateColor)}>
              {feedbackText}
            </div>
          )}
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