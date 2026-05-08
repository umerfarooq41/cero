import { AlertTriangle, Check, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, MoneyAmount } from '@/components/shared/Premium';

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

  const tone = isZero ? 'income' : isOver ? 'debt' : 'analytics';
  const stateColor = isZero
    ? 'text-emerald-700 dark:text-emerald-300'
    : isOver
      ? 'text-red-700 dark:text-red-300'
      : 'text-violet-700 dark:text-violet-300';

  const label = isZero ? 'Every amount is assigned' : isOver ? 'Over allocated' : 'Left to allocate';
  const helper = isEditMode
    ? isZero
      ? 'You are ready to save this budget.'
      : isOver
        ? 'Reduce planned spending, savings, or debt payments.'
        : 'Give this remaining money a clear category.'
    : 'Income minus planned expenses, savings, and debt.';

  return (
    <GlassCard tone={tone} className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Monthly income
          </p>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            <MoneyAmount>{money(totalIncome)}</MoneyAmount>
          </div>
        </div>

        <div className="hidden h-16 w-px bg-border/70 lg:block" />

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                isZero && 'bg-emerald-500/12',
                isOver && 'bg-red-500/12',
                isUnder && 'bg-violet-500/12'
              )}
            >
              {isZero && <Check className={cn('h-5 w-5', stateColor)} />}
              {isOver && <AlertTriangle className={cn('h-5 w-5', stateColor)} />}
              {isUnder && <CircleDollarSign className={cn('h-5 w-5', stateColor)} />}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">{label}</p>
              <div className={cn('mt-1 flex items-center gap-1 text-4xl font-extrabold tracking-tight', stateColor)}>
                <MoneyAmount>
                  {isOver && <span>-</span>}
                  {money(Math.abs(leftToAllocate))}
                </MoneyAmount>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
        </div>
      </div>
    </GlassCard>
  );
}
