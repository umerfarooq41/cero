import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export const getCurrencyCode = (currency) => {
  if (typeof currency === 'string') return currency;
  return currency?.code || currency?.currency || 'SAR';
};

export const getCurrencySymbol = (currency) => {
  const code = getCurrencyCode(currency);

  const map = {
    SAR: 'SAR',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    PKR: 'Rs',
    AED: 'د.إ',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: 'ر.ع.',
  };

  return currency?.symbol || map[code] || code;
};

export const formatNumber = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
};

export const formatCurrencyText = (value, currency) => {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  if (code === 'SAR') return `SAR ${formatNumber(value)}`;

  return `${symbol} ${formatNumber(value)}`;
};

function RiyalIcon({ className }) {
  return (
    <span
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        WebkitMask: "url('/sar.svg') center / contain no-repeat",
        mask: "url('/sar.svg') center / contain no-repeat",
      }}
    />
  );
}

export function CurrencyAmount({
  amount,
  currency,
  compact = false,
  className,
}) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current',
        className
      )}
    >
      {code === 'SAR' ? (
        <RiyalIcon
          className={compact ? 'h-[0.82em] w-[0.82em]' : 'h-[0.9em] w-[0.9em]'}
        />
      ) : (
        <span>{symbol}</span>
      )}

      <span>{formatNumber(amount)}</span>
    </span>
  );
}

export function InlineMoney({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle whitespace-nowrap leading-none text-current',
        className
      )}
    >
      {children}
    </span>
  );
}

function MoneyRow({ label, amount, currency, tone }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>

      <span className={cn('font-semibold tabular-nums', tone)}>
        <CurrencyAmount amount={amount} currency={currency} compact />
      </span>
    </div>
  );
}

function HeroCashFlowCard({
  isYear,
  income,
  expenses,
  plannedIncome,
  plannedExpenses,
  netCashFlow,
  savingsRate,
  currency,
}) {
  const positive = netCashFlow >= 0;

  const savedProgress =
    income > 0 ? Math.min((Math.max(netCashFlow, 0) / income) * 100, 100) : 0;

  const expenseProgress =
    income > 0 ? Math.min((Math.max(expenses, 0) / income) * 100, 100) : 0;

  return (
    <ReflectCard
      className={cn(
        'relative min-h-[220px] overflow-hidden rounded-3xl border p-5 sm:col-span-2',
        positive
          ? 'border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-card to-card'
          : 'border-red-500/15 bg-gradient-to-br from-red-500/10 via-card to-card'
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1',
          positive ? 'bg-emerald-400/70' : 'bg-red-400/70'
        )}
      />

      <div
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl',
          positive ? 'bg-emerald-500/15' : 'bg-red-500/15'
        )}
      />

      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isYear ? 'Yearly Cash Flow' : 'Monthly Cash Flow'}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {isYear
                  ? 'Full-year income, expenses, and saved amount'
                  : 'Income, expenses, and saved amount'}
              </p>
            </div>

            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                positive
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-500 dark:text-red-400'
              )}
            >
              {positive ? 'Positive' : 'Negative'}
            </span>
          </div>

          <div
            className={cn(
              'pt-3 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl',
              positive
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            )}
          >
            <CurrencyAmount amount={netCashFlow} currency={currency} />
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            {savingsRate ? `${savingsRate}% savings rate` : 'This period'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <MoneyRow
              label={isYear ? 'Year income tracked' : 'Income tracked'}
              amount={income}
              currency={currency}
              tone="text-emerald-600 dark:text-emerald-400"
            />

            {!isYear && plannedIncome > 0 && (
              <MoneyRow
                label="Income planned"
                amount={plannedIncome}
                currency={currency}
                tone="text-muted-foreground"
              />
            )}

            <MoneyRow
              label={isYear ? 'Year expenses tracked' : 'Expenses tracked'}
              amount={expenses}
              currency={currency}
              tone="text-red-600 dark:text-red-400"
            />

            {!isYear && plannedExpenses > 0 && (
              <MoneyRow
                label="Expenses planned"
                amount={plannedExpenses}
                currency={currency}
                tone="text-muted-foreground"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  positive ? 'bg-emerald-400' : 'bg-red-400'
                )}
                style={{ width: `${savedProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(savedProgress)}% saved from income</span>
              <span>{Math.round(expenseProgress)}% spent</span>
            </div>
          </div>
        </div>
      </div>
    </ReflectCard>
  );
}

function SecondaryCard({ title, value, children, tone = 'default' }) {
  const valueClass =
    tone === 'good'
      ? 'text-emerald-500 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-red-500 dark:text-red-400'
        : tone === 'info'
          ? 'text-cyan-500 dark:text-cyan-400'
          : 'text-foreground';

  const accentClass =
    tone === 'good'
      ? 'bg-emerald-400/70'
      : tone === 'bad'
        ? 'bg-red-400/70'
        : tone === 'info'
          ? 'bg-cyan-400/70'
          : 'bg-muted-foreground/50';

  const glowClass =
    tone === 'good'
      ? 'bg-emerald-500/10'
      : tone === 'bad'
        ? 'bg-red-500/10'
        : tone === 'info'
          ? 'bg-cyan-500/10'
          : 'bg-muted/40';

  return (
    <ReflectCard className="relative min-h-[160px] overflow-hidden rounded-3xl border border-white/5 bg-card p-4">
      <div className={cn('absolute inset-x-0 top-0 h-1', accentClass)} />

      <div
        className={cn(
          'pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl',
          glowClass
        )}
      />

      <div className="relative flex h-full flex-col justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>

          <div
            className={cn(
              'mt-3 text-2xl font-bold tracking-tight tabular-nums',
              valueClass
            )}
          >
            {value}
          </div>
        </div>

        {children}
      </div>
    </ReflectCard>
  );
}

export default function ReflectSummaryCard({
  isYear,
  income,
  expenses,
  plannedIncome,
  plannedExpenses,
  netCashFlow,
  netWorth,
  totalAssets,
  totalLiabilities,
  savingsRate,
  currency,
}) {
  const netWorthHealth =
    totalAssets > 0
      ? Math.max(
          0,
          Math.min(((totalAssets - totalLiabilities) / totalAssets) * 100, 100)
        )
      : 0;

  const budgetDifference = plannedExpenses - expenses;

  const budgetHealth =
    isYear || plannedExpenses === 0
      ? 'Tracked'
      : expenses <= plannedExpenses
        ? 'Excellent'
        : 'Warning';

  const budgetTone =
    isYear || plannedExpenses === 0
      ? 'info'
      : expenses <= plannedExpenses
        ? 'good'
        : 'bad';

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <HeroCashFlowCard
        isYear={isYear}
        income={income}
        expenses={expenses}
        plannedIncome={plannedIncome}
        plannedExpenses={plannedExpenses}
        netCashFlow={netCashFlow}
        savingsRate={savingsRate}
        currency={currency}
      />

      <SecondaryCard
        title="Net Worth"
        value={<CurrencyAmount amount={netWorth} currency={currency} />}
        tone={netWorth >= 0 ? 'info' : 'bad'}
      >
        <div className="space-y-3">
          <MoneyRow
            label="Assets"
            amount={totalAssets}
            currency={currency}
            tone="text-emerald-600 dark:text-emerald-400"
          />

          <MoneyRow
            label="Liabilities"
            amount={totalLiabilities}
            currency={currency}
            tone="text-red-600 dark:text-red-400"
          />

          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{ width: `${netWorthHealth}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {Math.round(netWorthHealth)}% asset-backed position
            </p>
          </div>
        </div>
      </SecondaryCard>

      <SecondaryCard
        title={isYear ? 'Year Summary' : 'Budget Health'}
        value={budgetHealth}
        tone={budgetTone}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <MoneyRow
              label={isYear ? 'Year expenses tracked' : 'Planned expenses'}
              amount={isYear ? expenses : plannedExpenses}
              currency={currency}
              tone="text-muted-foreground"
            />

            {!isYear && (
              <MoneyRow
                label="Tracked expenses"
                amount={expenses}
                currency={currency}
                tone={
                  expenses <= plannedExpenses || plannedExpenses === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }
              />
            )}
          </div>

          <p className="text-xs leading-snug text-muted-foreground">
            {isYear
              ? 'Full-year spending summary based on tracked transactions.'
              : plannedExpenses === 0
                ? 'No planned expense budget for this period.'
                : budgetDifference >= 0
                  ? 'Spending remains under planned budget.'
                  : 'Spending exceeded planned budget.'}
          </p>

          {!isYear && plannedExpenses > 0 && (
            <div
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                budgetDifference >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              {budgetDifference >= 0 ? 'Under by ' : 'Over by '}
              <CurrencyAmount
                amount={Math.abs(budgetDifference)}
                currency={currency}
                compact
              />
            </div>
          )}
        </div>
      </SecondaryCard>
    </div>
  );
}