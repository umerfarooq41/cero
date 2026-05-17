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
        'sticky top-[72px] z-20 rounded-3xl border border-border/60 bg-card/75 px-4 py-3 shadow-md backdrop-blur-xl transition-all duration-300',
        isEditMode ? bgColor : 'border-border'
      )}
    >
      <div className="relative grid grid-cols-2 items-center">
        <div className="min-w-0 pr-4 text-center">
          <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Income
          </div>

          <div className="inline-flex items-center justify-center gap-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {money(totalIncome)}
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />

        <div className="relative min-w-0 pl-4 pr-11 text-center">
          <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Left to Allocate
          </div>

          <div
            className={cn(
              'inline-flex items-center justify-center gap-1 text-2xl font-bold tracking-tight tabular-nums',
              stateColor
            )}
          >
            {isOver && <span>-</span>}
            {money(Math.abs(leftToAllocate))}
          </div>

          <div
            className={cn(
              'absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 shrink-0 items-center justify-center rounded-full',
              isZero
                ? 'bg-[hsl(var(--success)/0.15)]'
                : isOver
                  ? 'bg-destructive/10'
                  : 'bg-primary/10'
            )}
          >
            {isZero && <Check className={cn('h-4 w-4', stateColor)} />}
            {isOver && <AlertTriangle className={cn('h-4 w-4', stateColor)} />}
            {isUnder && (
              <CircleDollarSign className={cn('h-4 w-4', stateColor)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}