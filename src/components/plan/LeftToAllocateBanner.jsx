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
  sticky = false,
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
        sticky ? 'sticky top-[72px] z-20' : 'relative z-auto',
        'rounded-3xl border border-border/60 bg-card/75 px-4 py-2.5 shadow-md backdrop-blur-xl transition-all duration-300',
        isEditMode ? bgColor : 'border-border'
      )}
    >
      <div className="relative grid grid-cols-2 items-center">
        <div className="min-w-0 pr-4 text-center">
          <div className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
            Income
          </div>

          <div className="inline-flex items-center justify-center gap-1 text-lg font-bold tracking-tight text-foreground tabular-nums sm:text-xl [&_svg]:h-[1em] [&_svg]:w-[1em]">
            <span className="inline-flex items-center gap-1 leading-none">
              {money(totalIncome)}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />

        <div className="relative min-w-0 pl-4 pr-10 text-center">
          <div className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
            Left to allocate
          </div>

          <div
            className={cn(
              'inline-flex items-center justify-center gap-1 text-lg font-bold tracking-tight tabular-nums sm:text-xl [&_svg]:h-[1em] [&_svg]:w-[1em]',
              stateColor
            )}
          >
            {isOver && <span className="leading-none">-</span>}

            <span className="inline-flex items-center gap-1 leading-none">
              {money(Math.abs(leftToAllocate))}
            </span>
          </div>

          <div
            className={cn(
              'absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 shrink-0 items-center justify-center rounded-full',
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