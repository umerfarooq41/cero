import { CreditCard, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, MoneyAmount } from '@/components/shared/Premium';

const fallbackFormatCurrency = (amount) =>
  Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function SummaryCard({
  label,
  icon: Icon,
  amount = 0,
  planned = 0,
  type,
  faded,
  formatCurrency,
}) {
  const safeAmount = Number(amount) || 0;
  const safePlanned = Number(planned) || 0;
  const money = formatCurrency || fallbackFormatCurrency;

  const percentage = safePlanned > 0 ? Math.min((safeAmount / safePlanned) * 100, 100) : 0;
  const isOver = type !== 'income' && safeAmount > safePlanned && safePlanned > 0;

  const toneMap = {
    income: 'income',
    expense: isOver ? 'debt' : 'expense',
    savings: 'savings',
    debt: 'debt',
  };

  const barColorMap = {
    income: 'bg-emerald-500',
    expense: isOver ? 'bg-red-500' : 'bg-blue-500',
    savings: 'bg-teal-500',
    debt: 'bg-red-500',
  };

  const textColorMap = {
    income: 'text-emerald-700 dark:text-emerald-300',
    expense: isOver ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300',
    savings: 'text-teal-700 dark:text-teal-300',
    debt: 'text-red-700 dark:text-red-300',
  };

  return (
    <GlassCard
      tone={toneMap[type] || 'default'}
      className={cn('p-3.5 transition-all duration-300 sm:p-4', faded && 'opacity-55')}
    >
      <div className="flex min-h-[6.75rem] flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className={cn('text-xl font-semibold tabular-nums tracking-[-0.01em] sm:text-2xl', textColorMap[type])}>
            <MoneyAmount>{money(safeAmount)}</MoneyAmount>
          </div>

          {safePlanned > 0 ? (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', barColorMap[type])}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] leading-4 text-muted-foreground">
                {safeAmount === 0 ? (
                  type === 'income' ? (
                    'Waiting for income'
                  ) : (
                    <>
                      <span>0% of</span>
                      <MoneyAmount>{money(safePlanned)}</MoneyAmount>
                    </>
                  )
                ) : isOver ? (
                  <>
                    <MoneyAmount>{money(safeAmount - safePlanned)}</MoneyAmount>
                    <span>over planned</span>
                  </>
                ) : (
                  <>
                    <span>{Math.round(percentage)}% of</span>
                    <MoneyAmount>{money(safePlanned)}</MoneyAmount>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">No planned amount</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default function SummaryCards({
  budget,
  savingsSpent = 0,
  debtSpent = 0,
  isEditMode,
  formatCurrency,
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 transition-all duration-300 lg:grid-cols-4',
        isEditMode && 'mb-1'
      )}
    >
      <SummaryCard
        label="Income"
        icon={TrendingUp}
        type="income"
        amount={budget?.totalIncome}
        planned={budget?.totalPlannedIncome}
        faded={isEditMode}
        formatCurrency={formatCurrency}
      />

      <SummaryCard
        label="Expenses"
        icon={TrendingDown}
        type="expense"
        amount={budget?.totalExpenses}
        planned={budget?.totalPlannedExpenses}
        faded={isEditMode}
        formatCurrency={formatCurrency}
      />

      <SummaryCard
        label="Savings"
        icon={PiggyBank}
        type="savings"
        amount={savingsSpent}
        planned={budget?.totalPlannedSavings}
        faded={isEditMode}
        formatCurrency={formatCurrency}
      />

      <SummaryCard
        label="Debt"
        icon={CreditCard}
        type="debt"
        amount={debtSpent}
        planned={budget?.totalPlannedDebt}
        faded={isEditMode}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
