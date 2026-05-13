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

function AnimatedBar({ value, className, delay = 'delay-150' }) {
  const safeValue = Math.max(0, Math.min(Number(value || 0), 100));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          delay,
          className
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function PercentBar({ label, value, className, delay }) {
  const safeValue = Math.max(0, Math.min(Number(value || 0), 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{Math.round(safeValue)}%</span>
      </div>

      <AnimatedBar value={safeValue} className={className} delay={delay} />
    </div>
  );
}

function HeroCashFlowCard({
  isYear,
  income,
  expenses,
  netCashFlow,
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
          'pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl',
          positive ? 'bg-emerald-500/15' : 'bg-red-500/15'
        )}
      />

      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {isYear ? 'Yearly Cash Flow' : 'Monthly Cash Flow'}
            </p>

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
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <MoneyRow
              label="Income"
              amount={income}
              currency={currency}
              tone="text-emerald-600 dark:text-emerald-400"
            />

            <MoneyRow
              label="Expenses"
              amount={expenses}
              currency={currency}
              tone="text-red-600 dark:text-red-400"
            />
          </div>

          <div className="space-y-2">
            <AnimatedBar
              value={savedProgress}
              className={positive ? 'bg-emerald-400' : 'bg-red-400'}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(savedProgress)}% saved</span>
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
          : tone === 'warning'
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-foreground';

  const glowClass =
    tone === 'good'
      ? 'bg-emerald-500/10'
      : tone === 'bad'
        ? 'bg-red-500/10'
        : tone === 'info'
          ? 'bg-cyan-500/10'
          : tone === 'warning'
            ? 'bg-amber-500/10'
            : 'bg-muted/40';

  return (
    <ReflectCard className="relative min-h-[160px] overflow-hidden rounded-3xl border border-border bg-card p-4">
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
  trackedSavings = 0,
  trackedDebt = 0,
  plannedIncome,
  plannedExpenses,
  plannedSavings = 0,
  plannedDebt = 0,
  totalPlannedOutflow,
  totalTrackedOutflow,
  netCashFlow,
  netWorth,
  totalAssets,
  totalLiabilities,
  savingsRate,
  currency,
}) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(daysInMonth - currentDay, 1);
  const monthElapsedPercent = (currentDay / daysInMonth) * 100;
  const yearElapsedPercent = ((now.getMonth() + 1) / 12) * 100;

  const netWorthHealth =
    totalAssets > 0
      ? Math.max(
          0,
          Math.min(((totalAssets - totalLiabilities) / totalAssets) * 100, 100)
        )
      : 0;

  const monthlyBudgetDifference = plannedExpenses - expenses;
  const monthlyBudgetUsed =
    plannedExpenses > 0 ? Math.min((expenses / plannedExpenses) * 100, 100) : 0;

  const dailyLimit = monthlyBudgetDifference > 0 ? monthlyBudgetDifference / daysLeft : 0;

  const monthlyStatus =
    plannedExpenses === 0
      ? 'Tracked'
      : monthlyBudgetUsed <= monthElapsedPercent
        ? 'Excellent'
        : monthlyBudgetUsed <= monthElapsedPercent + 10
          ? 'On Track'
          : 'Warning';

  const monthlyTone =
    plannedExpenses === 0
      ? 'info'
      : monthlyBudgetUsed <= monthElapsedPercent
        ? 'good'
        : monthlyBudgetUsed <= monthElapsedPercent + 10
          ? 'warning'
          : 'bad';

  const yearlyPlanCap = Number(totalPlannedOutflow ?? plannedExpenses + plannedSavings + plannedDebt) || 0;
  const yearlyTotalYtd = Number(totalTrackedOutflow ?? expenses + trackedSavings + trackedDebt) || 0;
  const yearlyPlanUsedPercent =
    yearlyPlanCap > 0 ? Math.min((yearlyTotalYtd / yearlyPlanCap) * 100, 100) : 0;

  const monthsPassed = Math.max(now.getMonth() + 1, 1);
  const monthlyAverage = yearlyTotalYtd / monthsPassed;
  const paceDifference = yearElapsedPercent - yearlyPlanUsedPercent;

  const yearlyStatus =
    yearlyPlanCap === 0
      ? 'No Plan Yet'
      : yearlyPlanUsedPercent <= yearElapsedPercent
        ? 'Ahead of Plan'
        : yearlyPlanUsedPercent <= yearElapsedPercent + 10
          ? 'On Track'
          : 'Behind Plan';

  const yearlyTone =
    yearlyPlanCap === 0
      ? 'info'
      : yearlyPlanUsedPercent <= yearElapsedPercent
        ? 'good'
        : yearlyPlanUsedPercent <= yearElapsedPercent + 10
          ? 'warning'
          : 'bad';

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <HeroCashFlowCard
        isYear={isYear}
        income={income}
        expenses={expenses}
        netCashFlow={netCashFlow}
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
            <AnimatedBar
              value={netWorthHealth}
              className="bg-cyan-400"
              delay="delay-300"
            />

            <p className="text-xs text-muted-foreground">
              {Math.round(netWorthHealth)}% asset-backed
            </p>
          </div>
        </div>
      </SecondaryCard>

      <SecondaryCard
        title={isYear ? 'Yearly Performance' : 'Budget Health'}
        value={isYear ? yearlyStatus : monthlyStatus}
        tone={isYear ? yearlyTone : monthlyTone}
      >
        <div className="space-y-3">
          {isYear ? (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total YTD</p>
                <div className="mt-1 text-xl font-bold tracking-tight tabular-nums text-foreground">
                  <CurrencyAmount amount={yearlyTotalYtd} currency={currency} />
                </div>
              </div>

              <div className="space-y-2">
                <MoneyRow
                  label="Monthly Avg"
                  amount={monthlyAverage}
                  currency={currency}
                  tone="text-muted-foreground"
                />

                <MoneyRow
                  label="Annual Cap"
                  amount={yearlyPlanCap}
                  currency={currency}
                  tone="text-muted-foreground"
                />
              </div>

              <div className="space-y-3">
                <PercentBar
                  label="Year Passed"
                  value={yearElapsedPercent}
                  className="bg-cyan-400"
                  delay="delay-300"
                />

                <PercentBar
                  label="Plan Used"
                  value={yearlyPlanUsedPercent}
                  className={
                    yearlyTone === 'good'
                      ? 'bg-emerald-400'
                      : yearlyTone === 'warning'
                        ? 'bg-amber-400'
                        : yearlyTone === 'bad'
                          ? 'bg-red-400'
                          : 'bg-cyan-400'
                  }
                  delay="delay-500"
                />
              </div>

              <p className="text-xs leading-snug text-muted-foreground">
                {yearlyPlanCap === 0
                  ? 'Add yearly or monthly plans to compare usage against the year.'
                  : paceDifference >= 0
                    ? `${Math.round(paceDifference)}% ahead of yearly pace.`
                    : `${Math.abs(Math.round(paceDifference))}% behind yearly pace.`}
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Budget left
                </p>

                <div
                  className={cn(
                    'mt-1 text-xl font-bold tracking-tight tabular-nums',
                    monthlyBudgetDifference >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  <CurrencyAmount
                    amount={Math.abs(monthlyBudgetDifference)}
                    currency={currency}
                  />{' '}
                  {monthlyBudgetDifference >= 0 ? 'Left' : 'Over'}
                </div>
              </div>

              <div className="space-y-2">
                <MoneyRow
                  label="Planned"
                  amount={plannedExpenses}
                  currency={currency}
                  tone="text-muted-foreground"
                />

                <MoneyRow
                  label="Tracked"
                  amount={expenses}
                  currency={currency}
                  tone={
                    monthlyBudgetDifference >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                />
              </div>

              {plannedExpenses > 0 && (
                <>
                  <AnimatedBar
                    value={monthlyBudgetUsed}
                    className={
                      monthlyTone === 'good'
                        ? 'bg-emerald-400'
                        : monthlyTone === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }
                    delay="delay-500"
                  />

                  <p className="text-xs leading-snug text-muted-foreground">
                    Daily Limit:{' '}
                    <span className="font-semibold text-foreground">
                      <CurrencyAmount amount={dailyLimit} currency={currency} compact /> / day
                    </span>
                  </p>
                </>
              )}

              {plannedExpenses === 0 && (
                <p className="text-xs leading-snug text-muted-foreground">
                  No planned expense budget for this month.
                </p>
              )}
            </>
          )}
        </div>
      </SecondaryCard>
    </div>
  );
}
