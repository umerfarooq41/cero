import React, { useMemo } from 'react';
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
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    PKR: 'Rs',
    AED: 'د.إ',
    TRY: '₺',
    RUB: '₽',
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

const clampPercent = (value) => Math.max(0, Math.min(Number(value || 0), 100));

function getSelectedPeriodProgress({ selectedYear, selectedMonth, isYear }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const currentMonth = currentMonthIndex + 1;
  const yearNumber = Number(selectedYear || currentYear);

  if (isYear) {
    const monthsPassed =
      yearNumber < currentYear
        ? 12
        : yearNumber > currentYear
          ? 0
          : currentMonth;

    return {
      daysLeft: 0,
      monthElapsedPercent: 100,
      yearElapsedPercent: clampPercent((monthsPassed / 12) * 100),
      monthsPassed: Math.max(monthsPassed, 1),
      isCurrentPeriod: yearNumber === currentYear,
    };
  }

  const monthNumber = Number(selectedMonth || currentMonth);
  const selectedDate = new Date(yearNumber, monthNumber - 1, 1);
  const selectedPeriodIndex = yearNumber * 12 + monthNumber;
  const currentPeriodIndex = currentYear * 12 + currentMonth;
  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

  let elapsedDay = 0;

  if (selectedPeriodIndex < currentPeriodIndex) {
    elapsedDay = daysInMonth;
  } else if (selectedPeriodIndex === currentPeriodIndex) {
    elapsedDay = now.getDate();
  }

  const daysLeft = Math.max(daysInMonth - elapsedDay, 1);
  const monthElapsedPercent = clampPercent((elapsedDay / daysInMonth) * 100);

  return {
    daysLeft,
    monthElapsedPercent,
    yearElapsedPercent: clampPercent(((selectedDate.getMonth() + 1) / 12) * 100),
    monthsPassed: Math.max(selectedDate.getMonth() + 1, 1),
    isCurrentPeriod: selectedPeriodIndex === currentPeriodIndex,
  };
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
  const safeValue = clampPercent(value);
  const scaleX = safeValue / 100;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full rounded-full origin-left transition-transform duration-700 ease-out will-change-transform',
          delay,
          className
        )}
        style={{ transform: `scaleX(${scaleX})` }}
      />
    </div>
  );
}

function PercentBar({ label, value, className, delay }) {
  const safeValue = clampPercent(value);

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
    <ReflectCard className="relative min-h-[220px] overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-5 shadow-md backdrop-blur-xl sm:col-span-2">
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
              'pt-3 text-2xl font-bold tracking-tight tabular-nums',
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
    <ReflectCard className="relative min-h-[160px] overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-4 shadow-md backdrop-blur-xl">
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
  selectedYear,
  selectedMonth,
  income,
  expenses,
  trackedSavings = 0,
  trackedDebt = 0,
  plannedExpenses,
  plannedSavings = 0,
  plannedDebt = 0,
  totalPlannedOutflow,
  totalTrackedOutflow,
  netCashFlow,
  netWorth,
  totalAssets,
  totalLiabilities,
  currency,
}) {
  const computed = useMemo(() => {
    const periodProgress = getSelectedPeriodProgress({
      selectedYear,
      selectedMonth,
      isYear,
    });

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

    const dailyLimit =
      monthlyBudgetDifference > 0
        ? monthlyBudgetDifference / periodProgress.daysLeft
        : 0;

    const monthlyStatus =
      plannedExpenses === 0
        ? 'Tracked'
        : monthlyBudgetUsed <= periodProgress.monthElapsedPercent
          ? 'Excellent'
          : monthlyBudgetUsed <= periodProgress.monthElapsedPercent + 10
            ? 'On Track'
            : 'Warning';

    const monthlyTone =
      plannedExpenses === 0
        ? 'info'
        : monthlyBudgetUsed <= periodProgress.monthElapsedPercent
          ? 'good'
          : monthlyBudgetUsed <= periodProgress.monthElapsedPercent + 10
            ? 'warning'
            : 'bad';

    const yearlyPlanCap =
      Number(totalPlannedOutflow ?? plannedExpenses + plannedSavings + plannedDebt) || 0;

    const yearlyTotalYtd =
      Number(totalTrackedOutflow ?? expenses + trackedSavings + trackedDebt) || 0;

    const yearlyPlanUsedPercent =
      yearlyPlanCap > 0 ? Math.min((yearlyTotalYtd / yearlyPlanCap) * 100, 100) : 0;

    const monthlyAverage = yearlyTotalYtd / periodProgress.monthsPassed;
    const paceDifference = periodProgress.yearElapsedPercent - yearlyPlanUsedPercent;

    const yearlyStatus =
      yearlyPlanCap === 0
        ? 'No Plan Yet'
        : yearlyPlanUsedPercent <= periodProgress.yearElapsedPercent
          ? 'Ahead of Plan'
          : yearlyPlanUsedPercent <= periodProgress.yearElapsedPercent + 10
            ? 'On Track'
            : 'Behind Plan';

    const yearlyTone =
      yearlyPlanCap === 0
        ? 'info'
        : yearlyPlanUsedPercent <= periodProgress.yearElapsedPercent
          ? 'good'
          : yearlyPlanUsedPercent <= periodProgress.yearElapsedPercent + 10
            ? 'warning'
            : 'bad';

    return {
      ...periodProgress,
      netWorthHealth,
      monthlyBudgetDifference,
      monthlyBudgetUsed,
      dailyLimit,
      monthlyStatus,
      monthlyTone,
      yearlyPlanCap,
      yearlyTotalYtd,
      yearlyPlanUsedPercent,
      monthlyAverage,
      paceDifference,
      yearlyStatus,
      yearlyTone,
    };
  }, [
    isYear,
    selectedYear,
    selectedMonth,
    expenses,
    plannedExpenses,
    plannedSavings,
    plannedDebt,
    totalAssets,
    totalLiabilities,
    trackedSavings,
    trackedDebt,
    totalPlannedOutflow,
    totalTrackedOutflow,
  ]);

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
              value={computed.netWorthHealth}
              className="bg-cyan-400"
              delay="delay-300"
            />

            <p className="text-xs text-muted-foreground">
              {Math.round(computed.netWorthHealth)}% asset-backed
            </p>
          </div>
        </div>
      </SecondaryCard>

      <SecondaryCard
        title={isYear ? 'Yearly Performance' : 'Budget Health'}
        value={isYear ? computed.yearlyStatus : computed.monthlyStatus}
        tone={isYear ? computed.yearlyTone : computed.monthlyTone}
      >
        <div className="space-y-3">
          {isYear ? (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total YTD</p>
                <div className="mt-1 text-xl font-bold tracking-tight tabular-nums text-foreground">
                  <CurrencyAmount amount={computed.yearlyTotalYtd} currency={currency} />
                </div>
              </div>

              <div className="space-y-2">
                <MoneyRow
                  label="Monthly Avg"
                  amount={computed.monthlyAverage}
                  currency={currency}
                  tone="text-muted-foreground"
                />

                <MoneyRow
                  label="Annual Cap"
                  amount={computed.yearlyPlanCap}
                  currency={currency}
                  tone="text-muted-foreground"
                />
              </div>

              <div className="space-y-3">
                <PercentBar
                  label="Year Passed"
                  value={computed.yearElapsedPercent}
                  className="bg-cyan-400"
                  delay="delay-300"
                />

                <PercentBar
                  label="Plan Used"
                  value={computed.yearlyPlanUsedPercent}
                  className={
                    computed.yearlyTone === 'good'
                      ? 'bg-emerald-400'
                      : computed.yearlyTone === 'warning'
                        ? 'bg-amber-400'
                        : computed.yearlyTone === 'bad'
                          ? 'bg-red-400'
                          : 'bg-cyan-400'
                  }
                  delay="delay-500"
                />
              </div>

              <p className="text-xs leading-snug text-muted-foreground">
                {computed.yearlyPlanCap === 0
                  ? 'Add yearly or monthly plans to compare usage against the year.'
                  : computed.paceDifference >= 0
                    ? `${Math.round(computed.paceDifference)}% ahead of yearly pace.`
                    : `${Math.abs(Math.round(computed.paceDifference))}% behind yearly pace.`}
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
                    computed.monthlyBudgetDifference >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  <CurrencyAmount
                    amount={Math.abs(computed.monthlyBudgetDifference)}
                    currency={currency}
                  />{' '}
                  {computed.monthlyBudgetDifference >= 0 ? 'Left' : 'Over'}
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
                    computed.monthlyBudgetDifference >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                />
              </div>

              {plannedExpenses > 0 && (
                <>
                  <AnimatedBar
                    value={computed.monthlyBudgetUsed}
                    className={
                      computed.monthlyTone === 'good'
                        ? 'bg-emerald-400'
                        : computed.monthlyTone === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }
                    delay="delay-500"
                  />

                  <p className="text-xs leading-snug text-muted-foreground">
                    Daily Limit:{' '}
                    <span className="font-semibold text-foreground">
                      <CurrencyAmount amount={computed.dailyLimit} currency={currency} compact /> / day
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
