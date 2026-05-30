import React, { useMemo } from 'react';
import { Activity, BarChart3, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
  formatCurrencyNumberText,
} from '@/lib/currencies';
import DashboardSectionCard from '@/components/dashboard/DashboardSectionCard.jsx';

export const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);

export const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

export const formatNumber = (value = 0) => {
  const number = Number(value || 0);

  return formatCurrencyNumberText(number, { smart: true });
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
      bar: 'bg-primary',
    };
  }

  if (tone === 'bad') {
    return {
      text: 'text-destructive',
      bg: 'bg-destructive/10',
      ring: 'ring-destructive/15',
      bar: 'bg-primary',
    };
  }

  if (tone === 'warning') {
    return {
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/15',
      bar: 'bg-primary',
    };
  }

  return {
    text: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/15',
    bar: 'bg-primary',
  };
}

function StatusPill({ children, tone = 'default' }) {
  const toneClasses = getToneClasses(tone);

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ring-1',
        toneClasses.bg,
        toneClasses.text,
        toneClasses.ring
      )}
    >
      {children}
    </span>
  );
}

function MoneyRow({ label, amount, currency, tone }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs leading-5">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>

      <span className={cn('shrink-0 font-semibold tabular-nums', tone)}>
        <CurrencyAmount amount={amount} currency={currency} compact />
      </span>
    </div>
  );
}

function AnimatedBar({ value, className, delay = 'delay-150' }) {
  const safeValue = clampPercent(value);
  const scaleX = safeValue / 100;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-primary/10">
      <div
        className={cn(
          'h-full origin-left rounded-full transition-transform duration-700 ease-out will-change-transform',
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
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {Math.round(safeValue)}%
        </span>
      </div>

      <AnimatedBar value={safeValue} className={className} delay={delay} />
    </div>
  );
}

function MetricProgressRow({
  label,
  value,
  valueText,
  className = 'bg-primary',
  delay = 'delay-150',
  valueClassName = 'text-foreground',
}) {
  const safeValue = clampPercent(value);

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-center justify-between gap-3 text-xs font-medium">
        <span className="min-w-0 truncate text-left text-muted-foreground">
          {label}
        </span>

        <span
          className={cn(
            'shrink-0 text-right font-bold tabular-nums',
            valueClassName
          )}
        >
          {valueText ?? `${Math.round(safeValue)}%`}
        </span>
      </div>

      <AnimatedBar value={safeValue} className={className} delay={delay} />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  subtitle,
  action,
  value,
  valueTone = 'default',
  children,
  className,
}) {
  const toneClasses = getToneClasses(valueTone);

  return (
    <DashboardSectionCard
      icon={Icon}
      title={title}
      subtitle={subtitle}
      action={action}
      className={cn('relative self-start p-3 sm:p-4 lg:h-full lg:self-stretch', className)}
      contentClassName="space-y-2.5"
    >
      <div
        className={cn(
          'text-lg font-bold tracking-tight tabular-nums sm:text-xl',
          toneClasses.text
        )}
      >
        {value}
      </div>

      {children}
    </DashboardSectionCard>
  );
}

function HeroCashFlowCard({
  isYear,
  income,
  expenses,
  netCashFlow,
  currency,
}) {
  const actualExpenses = Number(expenses || 0);
  const positive = netCashFlow >= 0;
  const tone = positive ? 'good' : 'bad';
  const expenseProgress =
    income > 0 ? Math.min((Math.max(actualExpenses, 0) / income) * 100, 100) : 0;

  return (
    <SummaryCard
      icon={BarChart3}
      title={isYear ? 'Yearly Cash Flow' : 'Monthly Cash Flow'}
      subtitle={
        isYear
          ? 'Actual income minus actual expenses.'
          : 'Actual income minus actual expenses.'
      }
      value={<CurrencyAmount amount={netCashFlow} currency={currency} />}
      valueTone={tone}
      action={<StatusPill tone={tone}>{positive ? 'Positive' : 'Negative'}</StatusPill>}
    >
      <div className="space-y-1.5">
        <MoneyRow
          label="Actual Income"
          amount={income}
          currency={currency}
          tone="text-[hsl(var(--success))]"
        />

        <MoneyRow
          label="Actual Expenses"
          amount={actualExpenses}
          currency={currency}
          tone={positive ? 'text-muted-foreground' : 'text-destructive'}
        />
      </div>

      <div className="space-y-2.5 pt-1">
        <MetricProgressRow
          label="Expenses"
          value={expenseProgress}
          valueText={`${Math.round(expenseProgress)}%`}
          className="bg-primary"
          delay="delay-300"
          valueClassName={positive ? 'text-primary' : 'text-destructive'}
        />
      </div>
    </SummaryCard>
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

  const netWorthTone = netWorth >= 0 ? 'info' : 'bad';
  const healthTone = isYear ? computed.yearlyTone : computed.monthlyTone;
  const healthToneClasses = getToneClasses(healthTone);
  const monthlyBudgetIsPositive = computed.monthlyBudgetDifference >= 0;

  return (
    <div className="mb-4 grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-4">
      <HeroCashFlowCard
        isYear={isYear}
        income={income}
        expenses={expenses}
        trackedSavings={trackedSavings}
        trackedDebt={trackedDebt}
        netCashFlow={netCashFlow}
        currency={currency}
      />

      <SummaryCard
        icon={Wallet}
        title="Net Worth"
        subtitle="Assets compared with liabilities."
        value={<CurrencyAmount amount={netWorth} currency={currency} />}
        valueTone={netWorthTone}
      >
        <div className="space-y-1.5">
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
        </div>

        <div className="space-y-2.5 pt-1">
          <MetricProgressRow
            label="Asset"
            value={computed.netWorthHealth}
            valueText={`${Math.round(computed.netWorthHealth)}%`}
            className="bg-primary"
            delay="delay-300"
            valueClassName="text-primary"
          />
        </div>
      </SummaryCard>

      <SummaryCard
        icon={Activity}
        title={isYear ? 'Yearly Performance' : 'Budget Health'}
        subtitle={isYear ? 'Tracked outflow against yearly planned pace.' : 'Tracked expenses against your monthly plan.'}
        value={
          isYear ? (
            <CurrencyAmount amount={computed.yearlyTotalYtd} currency={currency} />
          ) : (
            <>
              <CurrencyAmount
                amount={Math.abs(computed.monthlyBudgetDifference)}
                currency={currency}
              />{' '}
              <span className="text-[0.72em] font-semibold">
                {monthlyBudgetIsPositive ? 'Left' : 'Over'}
              </span>
            </>
          )
        }
        valueTone={healthTone}
        action={
          <StatusPill tone={healthTone}>
            {isYear ? computed.yearlyStatus : computed.monthlyStatus}
          </StatusPill>
        }
      >
        {isYear ? (
          <>
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

            <div className="space-y-2.5">
              <PercentBar
                label="Year Passed"
                value={computed.yearElapsedPercent}
                className="bg-primary/35"
                delay="delay-300"
              />

              <PercentBar
                label="Plan Used"
                value={computed.yearlyPlanUsedPercent}
                className={healthToneClasses.bar}
                delay="delay-500"
              />
            </div>

            <p className="text-[11px] leading-4 text-muted-foreground">
              {computed.yearlyPlanCap === 0
                ? 'Add plans to compare usage against the year.'
                : computed.paceDifference >= 0
                  ? `${Math.round(computed.paceDifference)}% ahead of yearly pace.`
                  : `${Math.abs(Math.round(computed.paceDifference))}% behind yearly pace.`}
            </p>
          </>
        ) : (
          <>
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
                tone={monthlyBudgetIsPositive ? 'text-[hsl(var(--success))]' : 'text-destructive'}
              />
            </div>

            {plannedExpenses > 0 ? (
              <div className="space-y-2.5 pt-1">
                <MetricProgressRow
                  label="Used"
                  value={computed.monthlyBudgetUsed}
                  valueText={`${Math.round(computed.monthlyBudgetUsed)}%`}
                  className="bg-primary"
                  delay="delay-500"
                  valueClassName="text-primary"
                />

                <p className="text-left text-[11px] leading-4 text-muted-foreground">
                  Daily{' '}
                  <span className="font-semibold text-foreground">
                    <CurrencyAmount amount={computed.dailyLimit} currency={currency} compact />
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-[11px] leading-4 text-muted-foreground">
                No planned expense budget for this month.
              </p>
            )}
          </>
        )}
      </SummaryCard>
    </div>
  );
}