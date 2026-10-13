import { useMemo } from 'react';
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
  isYear, income = 0, expenses = 0, trackedSavings = 0, trackedDebt = 0,
  plannedExpenses = 0, totalTrackedOutflow = 0, netCashFlow = 0,
  netWorth = 0, totalAssets = 0, totalLiabilities = 0, currency,
}) {
  const used = plannedExpenses > 0 ? (expenses / plannedExpenses) * 100 : 0;
  const remaining = plannedExpenses - expenses;
  const money = (amount) => <CurrencyAmount amount={amount} currency={currency} compact />;
  const metric = (label, value, color = '') => (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-muted/45 px-3 py-2.5 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 flex justify-center text-base font-semibold tabular-nums ${color}`}>{money(value)}</p>
    </div>
  );
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <section className="rounded-2xl app-card-surface p-3.5">
        <div className="mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Financial summary</h3></div>
        <p className="text-[11px] text-muted-foreground">Operating cash flow</p>
        <p className={`mt-1 text-xl font-bold tabular-nums ${netCashFlow >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>{money(netCashFlow)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metric('Income received', income, 'text-[hsl(var(--success))]')}
          {metric('Expenses', expenses)}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <div><p className="text-[11px] text-muted-foreground">Total outflow</p><p className="text-sm font-semibold">{money(totalTrackedOutflow)}</p></div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p>Debt paid: {money(trackedDebt)}</p><p className="mt-1">Goal savings: {money(trackedSavings)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <div><p className="text-[11px] text-muted-foreground">Current net worth</p><p className="text-base font-semibold">{money(netWorth)}</p></div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p>Assets: {money(totalAssets)}</p><p className="mt-1">Liabilities: {money(totalLiabilities)}</p>
          </div>
        </div>
      </section>
      <section className="rounded-2xl app-card-surface p-3.5">
        <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Budget health</h3></div>
        {plannedExpenses > 0 ? <>
          <div className="flex items-end justify-between gap-2">
            <div><p className="text-[11px] text-muted-foreground">Expense budget {remaining >= 0 ? 'remaining' : 'over'}</p>
              <p className={`mt-1 text-xl font-semibold ${remaining < 0 ? 'text-destructive' : ''}`}>{money(Math.abs(remaining))}</p></div>
            <span className="text-xs font-semibold tabular-nums">{Math.round(used)}% used</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, used))}%` }} /></div>
          <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted-foreground"><span>Spent {money(expenses)}</span><span>Planned {money(plannedExpenses)}</span></div>
        </> : <p className="text-xs text-muted-foreground">No expense budget planned for this period.</p>}
        {isYear ? <p className="mt-3 text-[11px] text-muted-foreground">Yearly budget figures for the selected reporting year.</p> : null}
      </section>
    </div>
  );
}
