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
  desktop = false, section = 'all', isYear, income = 0, expenses = 0, trackedSavings = 0, trackedDebt = 0,
  plannedExpenses = 0, totalTrackedOutflow = 0, netCashFlow = 0,
  netWorth = 0, totalAssets = 0, totalLiabilities = 0, currency,
}) {
  const used = plannedExpenses > 0 ? (expenses / plannedExpenses) * 100 : 0;
  const remaining = plannedExpenses - expenses;
  const money = (amount) => <CurrencyAmount amount={amount} currency={currency} compact />;
  const metric = (label, value, color = '') => (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-none bg-transparent px-2 py-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 flex justify-center cero-secondary-amount tabular-nums ${color}`}>{money(value)}</p>
    </div>
  );
  if (desktop) return <div className="space-y-6">
    {section !== "budget" && <section aria-label="Financial summary" className="grid grid-cols-3 gap-6 border-b border-border pb-6">
      {[
        ['Operating cash flow',netCashFlow,netCashFlow < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]',[['Income received',income],['Expenses',expenses]]],
        ['Total outflow',totalTrackedOutflow,'',[['Debt paid',trackedDebt],['Goal savings',trackedSavings]]],
        ['Current net worth',netWorth,netWorth < 0 ? 'text-destructive' : '',[['Assets',totalAssets],['Liabilities',totalLiabilities]]]
      ].map(([label,value,tone,rows]) => <div key={label} className="min-w-0"><h3 className="text-sm font-medium text-muted-foreground">{label}</h3><p className={`my-2 cero-primary-amount tabular-nums ${tone}`}>{money(value)}</p><div className="space-y-2">{rows.map(([name,amount]) => <MoneyRow key={name} label={name} amount={amount} currency={currency}/>)}</div></div>)}
    </section>}
    {section !== "summary" && <section className="max-w-3xl space-y-4" aria-label="Budget health"><h3 className="cero-section-title">Budget health</h3>{plannedExpenses > 0 ? <><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Expense budget {remaining < 0 ? 'over' : 'remaining'}</p><p className={`mt-1 text-2xl font-semibold ${remaining < 0 ? 'text-destructive' : ''}`}>{money(Math.abs(remaining))}</p></div><span className={remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}>{Math.round(used)}% used</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${remaining < 0 ? 'bg-destructive' : 'bg-primary'}`} style={{width: `${Math.max(0,Math.min(100,used))}%`}}/></div><div className="flex justify-between text-sm text-muted-foreground"><span>Spent {money(expenses)}</span><span>Planned {money(plannedExpenses)}</span></div></> : <p className="text-sm text-muted-foreground">No expense budget planned for this period.</p>}</section>}
  </div>;
  return (
    <div className="cero-reflect-summary mb-3 grid gap-3">
      {section !== "budget" && <section className="cero-reflect-summary-section px-0 py-3">
        <div className="cero-hero text-center py-4"><p className="text-sm text-muted-foreground">Operating cash flow</p><p className={cn('cero-primary-amount mt-2',netCashFlow < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]')}>{money(netCashFlow)}</p><p className="mt-1 text-xs text-muted-foreground">{isYear?'Yearly':'Monthly'} cash flow</p></div>
        <div className="grid grid-cols-2 gap-3 text-center py-3">{metric('Income received',income)}{metric('Expenses',expenses)}</div>
        <div className="border-t border-border py-3"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">Current net worth</p><p className="cero-secondary-amount">{money(netWorth)}</p></div></div>
        <details className="group"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm text-primary">Financial details<span className="group-open:rotate-180">⌄</span></summary>{[['Assets',totalAssets],['Liabilities',totalLiabilities],['Debt paid',trackedDebt],['Goal savings',trackedSavings],['Total outflow',totalTrackedOutflow]].map(([label,amount])=><MoneyRow key={label} label={label} amount={amount} currency={currency}/>)}</details>
      </section>}
      {section !== "summary" && <section className="cero-reflect-summary-section px-0 py-3">
        <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /><h3 className="cero-section-title">Budget health</h3></div>
        {plannedExpenses > 0 ? <>
          <div className="cero-hero flex flex-col items-center gap-2 text-center">
            <div><p className="text-[11px] text-muted-foreground">Expense budget {remaining >= 0 ? 'remaining' : 'over'}</p>
              <p className={`mt-1 cero-primary-amount ${remaining < 0 ? 'text-destructive' : ''}`}>{money(Math.abs(remaining))}</p></div>
            <span className="text-xs font-semibold tabular-nums">{Math.round(used)}% used</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, used))}%` }} /></div>
          <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted-foreground"><span>Spent {money(expenses)}</span><span>Planned {money(plannedExpenses)}</span></div>
        </> : <p className="text-xs text-muted-foreground">No expense budget planned for this period.</p>}
        {isYear ? <p className="mt-3 text-[11px] text-muted-foreground">Yearly budget figures for the selected reporting year.</p> : null}
      </section>}
    </div>
  );
}
