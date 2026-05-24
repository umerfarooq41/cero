import React, { useMemo } from 'react';
import { Activity, BarChart3, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';
import ReflectCard from './ReflectCard.jsx';

export const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);

export const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

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
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums',
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

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

export function InlineMoney({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle whitespace-nowrap leading-none text-current tabular-nums',
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

function getToneClasses(tone = 'default') {
  if (tone === 'good') {
    return {
      text: 'text-[hsl(var(--success))]',
      bg: 'bg-[hsl(var(--success)/0.1)]',
      ring: 'ring-[hsl(var(--success)/0.15)]',
      glow: 'bg-[hsl(var(--success)/0.1)]',
    };
  }

  if (tone === 'bad') {
    return {
      text: 'text-destructive',
      bg: 'bg-destructive/10',
      ring: 'ring-destructive/15',
      glow: 'bg-destructive/10',
    };
  }

  if (tone === 'warning') {
    return {
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/15',
      glow: 'bg-amber-500/10',
    };
  }

  if (tone === 'info') {
    return {
      text: 'text-primary',
      bg: 'bg-primary/10',
      ring: 'ring-primary/15',
      glow: 'bg-muted/40',
    };
  }

  return {
    text: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/15',
    glow: 'bg-muted/40',
  };
}

function CardHeading({ icon: Icon, title, badge }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        <p className="min-w-0 text-sm font-bold leading-5 text-foreground">
          {title}
        </p>
      </div>

      {badge}
    </div>
  );
}

function MoneyRow({ label, amount, currency, tone }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
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
        <span className="tabular-nums text-foreground">
          <span className="tabular-nums">{Math.round(safeValue)}%</span>
        </span>
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
  const tone = positive ? 'good' : 'bad';

  const savedProgress =
    income > 0 ? Math.min((Math.max(netCashFlow, 0) / income) * 100, 100) : 0;

  const expenseProgress =
    income > 0 ? Math.min((Math.max(expenses, 0) / income) * 100, 100) : 0;

  return (
    <ReflectCard className="relative overflow-hidden p-3 sm:col-span-2 sm:p-4">
      <div className="relative flex h-full flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <CardHeading
            icon={BarChart3}
            title={isYear ? 'Yearly Cash Flow' : 'Monthly Cash Flow'}
            tone={tone}
            badge={
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                  positive
                    ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {positive ? 'Positive' : 'Negative'}
              </span>
            }
          />

          <div
            className={cn(
              'pt-2 text-base font-bold tracking-tight tabular-nums sm:text-lg',
              positive
                ? 'text-[hsl(var(--success))]'
                : 'text-destructive'
            )}
          >
            <CurrencyAmount amount={netCashFlow} currency={currency} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-2">
            <MoneyRow
              label="Income"
              amount={income}
              currency={currency}
              tone="text-[hsl(var(--success))]"
            />

            <MoneyRow
              label="Expenses"
              amount={expenses}
              currency={currency}
              tone="text-destructive"
            />
          </div>

          <div className="space-y-1.5">
            <AnimatedBar
              value={savedProgress}
              className={positive ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">{Math.round(savedProgress)}% saved</span>
              <span className="tabular-nums">{Math.round(expenseProgress)}% spent</span>
            </div>
          </div>
        </div>
      </div>
    </ReflectCard>
  );
}

function SecondaryCard({
  icon: Icon,
  title,
  value,
  children,
  tone = 'default',
}) {
  const toneClasses = getToneClasses(tone);

  return (
    <ReflectCard className="relative overflow-hidden p-3 sm:p-4">
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full blur-3xl',
          toneClasses.glow
        )}
      />

      <div className="relative flex h-full flex-col justify-between gap-3">
        <div>
          <CardHeading icon={Icon} title={title} tone={tone} />

          <div
            className={cn(
              'mt-2 text-base font-bold tracking-tight tabular-nums',
              toneClasses.text
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
        icon={Wallet}
        title="Net Worth"
        value={<CurrencyAmount amount={netWorth} currency={currency} />}
        tone={netWorth >= 0 ? 'info' : 'bad'}
      >
        <div className="space-y-3">
          <MoneyRow
            label="Assets"
            amount={totalAssets}
            currency={currency}
            tone="text-[hsl(var(--success))]"
          />

          <MoneyRow
            label="Liabilities"
            amount={totalLiabilities}
            currency={currency}
            tone="text-destructive"
          />

          <div className="space-y-1.5">
            <AnimatedBar
              value={computed.netWorthHealth}
              className="bg-cyan-400"
              delay="delay-300"
            />

            <p className="text-xs text-muted-foreground">
              <span className="tabular-nums">{Math.round(computed.netWorthHealth)}% asset-backed</span>
            </p>
          </div>
        </div>
      </SecondaryCard>

      <SecondaryCard
        icon={Activity}
        title={isYear ? 'Yearly Performance' : 'Budget Health'}
        value={isYear ? computed.yearlyStatus : computed.monthlyStatus}
        tone={isYear ? computed.yearlyTone : computed.monthlyTone}
      >
        <div className="space-y-3">
          {isYear ? (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total YTD
                </p>
                <div className="mt-1 text-base font-bold tracking-tight tabular-nums text-foreground">
                  <CurrencyAmount
                    amount={computed.yearlyTotalYtd}
                    currency={currency}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
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

              <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
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
                    'mt-1 text-base font-bold tracking-tight tabular-nums',
                    computed.monthlyBudgetDifference >= 0
                      ? 'text-[hsl(var(--success))]'
                      : 'text-destructive'
                  )}
                >
                  <CurrencyAmount
                    amount={Math.abs(computed.monthlyBudgetDifference)}
                    currency={currency}
                  />{' '}
                  {computed.monthlyBudgetDifference >= 0 ? 'Left' : 'Over'}
                </div>
              </div>

              <div className="space-y-1.5">
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
                      ? 'text-[hsl(var(--success))]'
                      : 'text-destructive'
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

                  <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                    Daily Limit:{' '}
                    <span className="font-semibold text-foreground">
                      <CurrencyAmount
                        amount={computed.dailyLimit}
                        currency={currency}
                        compact
                      />{' '}
                      / day
                    </span>
                  </p>
                </>
              )}

              {plannedExpenses === 0 && (
                <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
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