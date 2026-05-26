import React from 'react';
import { Check, AlertTriangle, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyNumberText } from '@/lib/currencies';

const fallbackFormatCurrency = (amount) =>
  formatCurrencyNumberText(Math.abs(amount || 0));

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

  const stateBorder = isZero
    ? 'border-[hsl(var(--success)/0.22)]'
    : isOver
      ? 'border-destructive/25'
      : 'border-primary/25';

  return (
    <div
      className={cn(
        sticky ? 'sticky top-[72px] z-20' : 'relative z-auto',
        'rounded-3xl border border-border/60 bg-card/75 px-3 py-2.5 shadow-md backdrop-blur-xl transition-all duration-300 sm:px-4',
        isEditMode ? stateBorder : 'border-border'
      )}
    >
      <div className="relative grid grid-cols-2 items-center">
        <div className="min-w-0 pr-3 text-center sm:pr-4">
          <div className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
            Income
          </div>

          <div className="inline-flex max-w-full items-center justify-center gap-1 truncate text-sm font-bold tracking-tight text-foreground tabular-nums sm:text-lg [&_svg]:h-[1em] [&_svg]:w-[1em]">
            <span className="inline-flex min-w-0 items-center gap-1 truncate leading-none">
              {money(totalIncome)}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />

        <div className="min-w-0 pl-3 sm:pl-4">
          <div className="flex min-w-0 items-center justify-center gap-2">
            <div className="min-w-0 flex-1 text-center">
              <div className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                Left to allocate
              </div>

              <div
                className={cn(
                  'inline-flex max-w-full items-center justify-center gap-1 truncate text-sm font-bold tracking-tight tabular-nums sm:text-lg [&_svg]:h-[1em] [&_svg]:w-[1em]',
                  stateColor
                )}
              >
                {isOver && <span className="shrink-0 leading-none">-</span>}

                <span className="inline-flex min-w-0 items-center gap-1 truncate leading-none">
                  {money(Math.abs(leftToAllocate))}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
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
    </div>
  );
}