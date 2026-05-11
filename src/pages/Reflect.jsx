import React, { useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CreditCard,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';

import PageHeader from '@/components/layout/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useAccounts,
  useAllTransactions,
  useBudgetSummary,
  useCategories,
  useCurrencyFormatter,
} from '@/hooks/useBudgetData';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  '#0078D4',
  '#107C10',
  '#C50F1F',
  '#8764B8',
  '#CA5010',
  '#008272',
  '#4F6BED',
  '#FFB900',
];

const MONTHS = [
  { value: '01', label: 'January', short: 'Jan' },
  { value: '02', label: 'February', short: 'Feb' },
  { value: '03', label: 'March', short: 'Mar' },
  { value: '04', label: 'April', short: 'Apr' },
  { value: '05', label: 'May', short: 'May' },
  { value: '06', label: 'June', short: 'Jun' },
  { value: '07', label: 'July', short: 'Jul' },
  { value: '08', label: 'August', short: 'Aug' },
  { value: '09', label: 'September', short: 'Sep' },
  { value: '10', label: 'October', short: 'Oct' },
  { value: '11', label: 'November', short: 'Nov' },
  { value: '12', label: 'December', short: 'Dec' },
];

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => String(currentYear - 3 + index));
};

function Card({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('rounded-2xl border border-border bg-card shadow-sm', className)}
    >
      {children}
    </motion.div>
  );
}

function PeriodSelector({ mode, setMode, month, setMonth, year, setYear }) {
  return (
    <Card className="mb-4 overflow-hidden bg-gradient-to-br from-background via-card to-muted/40">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-3 inline-flex rounded-2xl bg-secondary/80 p-1">
          <button
            type="button"
            onClick={() => setMode('month')}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
              mode === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Month
          </button>

          <button
            type="button"
            onClick={() => setMode('year')}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
              mode === 'year'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Year
          </button>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reflect Period
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">
            {mode === 'month'
              ? `${MONTHS.find((item) => item.value === month)?.label || 'Month'} ${year}`
              : `${year} full-year summary`}
          </h2>
        </div>
      </div>

      <div className={cn('grid gap-3 p-4', mode === 'month' ? 'grid-cols-2' : 'grid-cols-1')}>
        {mode === 'month' && (
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {buildYearOptions().map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}

function InlineMoney({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle whitespace-nowrap leading-none text-current',
        '[&_svg]:shrink-0 [&_img]:shrink-0 [&_img]:opacity-100 [&_img]:dark:invert',
        className
      )}
    >
      {children}
    </span>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'bad'
        ? 'text-red-700 dark:text-red-300'
        : tone === 'blue'
          ? 'text-blue-700 dark:text-blue-300'
          : tone === 'purple'
            ? 'text-violet-700 dark:text-violet-300'
            : 'text-foreground';

  const iconClass =
    tone === 'good'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'bad'
        ? 'text-red-700 dark:text-red-300'
        : tone === 'blue'
          ? 'text-blue-700 dark:text-blue-300'
          : tone === 'purple'
            ? 'text-violet-700 dark:text-violet-300'
            : 'text-muted-foreground';

  return (
    <Card
      className={cn(
        'relative min-h-[112px] overflow-hidden p-4',
        tone === 'good' &&
          'bg-gradient-to-br from-emerald-50 via-card to-card dark:from-emerald-950/30',
        tone === 'bad' &&
          'bg-gradient-to-br from-red-50 via-card to-card dark:from-red-950/30',
        tone === 'blue' &&
          'bg-gradient-to-br from-blue-50 via-card to-card dark:from-blue-950/30',
        tone === 'purple' &&
          'bg-gradient-to-br from-violet-50 via-card to-card dark:from-violet-950/30'
      )}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/35 dark:bg-white/5" />

      <div className="relative flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs leading-none text-muted-foreground">{title}</p>

          <div
            className={cn(
              'flex min-h-[24px] items-center text-xl font-bold leading-none tabular-nums',
              toneClass
            )}
          >
            <InlineMoney>{value}</InlineMoney>
          </div>

          {subtitle && (
            <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] leading-snug text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm',
            tone === 'good' && 'bg-emerald-100 dark:bg-emerald-900/40',
            tone === 'bad' && 'bg-red-100 dark:bg-red-900/40',
            tone === 'blue' && 'bg-blue-100 dark:bg-blue-900/40',
            tone === 'purple' && 'bg-violet-100 dark:bg-violet-900/40',
            tone === 'default' && 'bg-muted'
          )}
        >
          <Icon className={cn('h-4 w-4', iconClass)} />
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ icon: Icon, title, text, tone = 'default' }) {
  const toneStyles = {
    good: 'border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-950/70 dark:text-emerald-300',
    bad: 'border-red-200/70 bg-red-500/10 text-red-700 dark:border-red-950/70 dark:text-red-300',
    warning: 'border-amber-200/70 bg-amber-500/10 text-amber-700 dark:border-amber-950/70 dark:text-amber-300',
    default: 'border-primary/20 bg-primary/10 text-primary',
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex gap-3 p-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
            toneStyles[tone] || toneStyles.default
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Reflect() {
  const today = new Date();
  const [mode, setMode] = useState('month');
  const [selectedYear, setSelectedYear] = useState(format(today, 'yyyy'));
  const [selectedMonth, setSelectedMonth] = useState(format(today, 'MM'));

  const currentMonth = `${selectedYear}-${selectedMonth}`;
  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const budget = useBudgetSummary(currentMonth);

  const periodLabel =
    mode === 'month'
      ? format(new Date(`${currentMonth}-01`), 'MMMM yyyy')
      : selectedYear;

  const periodTransactions = useMemo(() => {
    if (mode === 'year') {
      return allTransactions.filter((transaction) =>
        transaction.date?.startsWith(selectedYear)
      );
    }

    return budget.transactions || [];
  }, [mode, selectedYear, allTransactions, budget.transactions]);

  const income = useMemo(() => {
    return periodTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions]);

  const expenses = useMemo(() => {
    return periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions]);

  const plannedExpenses = mode === 'month' ? Number(budget.totalPlannedExpenses) || 0 : 0;
  const plannedIncome = mode === 'month' ? Number(budget.totalPlannedIncome) || 0 : 0;
  const leftToAllocate = mode === 'month' ? Number(budget.leftToAllocate) || 0 : 0;
  const netCashFlow = income - expenses;

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, account) => {
      const balance = Number(account.balance) || 0;
      return sum + (account.category === 'asset' ? balance : -Math.abs(balance));
    }, 0);
  }, [accounts]);

  const totalAssets = useMemo(() => {
    return accounts
      .filter((account) => account.category === 'asset')
      .reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
  }, [accounts]);

  const totalLiabilities = useMemo(() => {
    return accounts
      .filter((account) => account.category === 'liability')
      .reduce((sum, account) => sum + Math.abs(Number(account.balance) || 0), 0);
  }, [accounts]);

  const savingsRate = income > 0 ? Math.round((netCashFlow / income) * 100) : 0;

  const efficiency = useMemo(() => {
    if (mode === 'year') return 0;
    if (plannedExpenses === 0) return 0;

    const ratio = expenses / plannedExpenses;

    if (ratio <= 1) {
      return Math.round((1 - Math.abs(1 - ratio)) * 100);
    }

    return Math.max(0, Math.round((1 - (ratio - 1)) * 100));
  }, [mode, expenses, plannedExpenses]);

  const spendingBreakdown = useMemo(() => {
    const categorySpending = {};

    periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const category = categories.find((item) => item.id === transaction.category_id);
        const name = category?.name || 'Uncategorized';
        categorySpending[name] =
          (categorySpending[name] || 0) + (Number(transaction.amount) || 0);
      });

    return Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [periodTransactions, categories]);

  const cashFlow = useMemo(() => {
    const months = [];
    const baseDate = mode === 'year' ? new Date(`${selectedYear}-12-01`) : new Date(`${currentMonth}-01`);
    const count = mode === 'year' ? 12 : 6;

    for (let i = count - 1; i >= 0; i--) {
      const monthDate = subMonths(baseDate, i);
      const month = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM');

      const txns = allTransactions.filter((transaction) =>
        transaction.date?.startsWith(month)
      );

      const monthIncome = txns
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

      const monthExpenses = txns
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

      months.push({
        month: label,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      });
    }

    return months;
  }, [mode, selectedYear, currentMonth, allTransactions]);

  const dailySpending = useMemo(() => {
    if (mode === 'year') {
      return cashFlow.map((item) => ({ day: item.month, amount: item.expenses }));
    }

    const days = {};

    periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const day = transaction.date?.slice(8, 10) || '01';
        days[day] = (days[day] || 0) + (Number(transaction.amount) || 0);
      });

    return Object.entries(days)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, amount]) => ({ day, amount }));
  }, [mode, periodTransactions, cashFlow]);

  const topCategory = spendingBreakdown[0];

  const insights = [
    {
      icon: netCashFlow >= 0 ? TrendingUp : TrendingDown,
      title: netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      text:
        netCashFlow >= 0 ? (
          <>
            You kept <InlineMoney>{formatCurrency(netCashFlow)}</InlineMoney> after
            expenses in {periodLabel}.
          </>
        ) : (
          <>
            You spent <InlineMoney>{formatCurrency(Math.abs(netCashFlow))}</InlineMoney>{' '}
            more than your income in {periodLabel}.
          </>
        ),
      tone: netCashFlow >= 0 ? 'good' : 'bad',
    },
    {
      icon: Target,
      title: mode === 'year' ? 'Year review' : 'Budget efficiency',
      text:
        mode === 'year'
          ? 'Year mode summarizes actual transactions across all months. Switch to Month for plan efficiency.'
          : efficiency >= 80
            ? 'Strong control. Your spending is close to your planned budget.'
            : efficiency >= 50
              ? 'Some categories may need review before month end.'
              : 'Spending is far from plan. Review your largest categories.',
      tone: mode === 'year' ? 'default' : efficiency >= 80 ? 'good' : efficiency >= 50 ? 'warning' : 'bad',
    },
    {
      icon: topCategory ? CreditCard : Brain,
      title: topCategory ? `Largest spend: ${topCategory.name}` : 'No spending yet',
      text: topCategory ? (
        <>
          {topCategory.name} used <InlineMoney>{formatCurrency(topCategory.value)}</InlineMoney>{' '}
          in {periodLabel}.
        </>
      ) : (
        'Once you add expenses, your top spending categories will appear here.'
      ),
      tone: topCategory ? 'default' : 'good',
    },
    {
      icon: PiggyBank,
      title: 'Savings rate',
      text:
        income > 0
          ? `Your estimated savings rate is ${savingsRate}% for ${periodLabel}.`
          : 'Add income transactions to calculate your savings rate.',
      tone: savingsRate >= 20 ? 'good' : savingsRate < 0 ? 'bad' : 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Reflect"
        subtitle="Insights, trends, and financial clarity"
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-4 pb-24 lg:py-8">
        <PeriodSelector
          mode={mode}
          setMode={setMode}
          month={selectedMonth}
          setMonth={setSelectedMonth}
          year={selectedYear}
          setYear={setSelectedYear}
        />

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            title="Income"
            value={formatCurrency(income)}
            subtitle={
              mode === 'month' && plannedIncome > 0 ? (
                <>
                  <InlineMoney>{formatCurrency(plannedIncome)}</InlineMoney>
                  <span>planned</span>
                </>
              ) : (
                `${periodLabel} actual`
              )
            }
            icon={ArrowUpRight}
            tone="good"
          />

          <SummaryCard
            title="Expenses"
            value={formatCurrency(expenses)}
            subtitle={
              mode === 'month' && plannedExpenses > 0 ? (
                <>
                  <InlineMoney>{formatCurrency(plannedExpenses)}</InlineMoney>
                  <span>planned</span>
                </>
              ) : (
                `${periodLabel} actual`
              )
            }
            icon={ArrowDownRight}
            tone={mode === 'month' && expenses > plannedExpenses && plannedExpenses > 0 ? 'bad' : 'blue'}
          />

          <SummaryCard
            title="Net Cash Flow"
            value={formatCurrency(netCashFlow)}
            subtitle={income > 0 ? `${savingsRate}% savings rate` : periodLabel}
            icon={Wallet}
            tone={netCashFlow >= 0 ? 'good' : 'bad'}
          />

          <SummaryCard
            title="Net Worth"
            value={formatCurrency(netWorth)}
            subtitle={
              <>
                <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
                <span>assets •</span>
                <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
                <span>debt</span>
              </>
            }
            icon={TrendingUp}
            tone={netWorth >= 0 ? 'purple' : 'bad'}
          />
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Cash Flow - {mode === 'year' ? selectedYear : 'Last 6 Months'}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Income, expenses, and monthly net
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="income" fill="#107C10" radius={[6, 6, 0, 0]} animationDuration={900} />
                  <Bar dataKey="expenses" fill="#C50F1F" radius={[6, 6, 0, 0]} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-muted-foreground" />
                {mode === 'year' ? 'Year Position' : 'Budget Efficiency'}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === 'year'
                  ? 'Income minus expenses for the selected year'
                  : 'How closely spending follows your plan'}
              </p>
            </div>

            {mode === 'month' ? (
              <>
                <div className="flex items-center justify-center py-3">
                  <div className="relative h-40 w-40">
                    <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--secondary))"
                        strokeWidth="3"
                      />
                      <motion.path
                        initial={{ strokeDasharray: '0, 100' }}
                        animate={{ strokeDasharray: `${efficiency}, 100` }}
                        transition={{ duration: 1 }}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={efficiency >= 70 ? '#107C10' : efficiency >= 40 ? '#FFB900' : '#C50F1F'}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{efficiency}%</span>
                      <span className="text-xs text-muted-foreground">score</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-center text-sm font-medium">
                  {leftToAllocate === 0 ? (
                    'Every planned amount is allocated.'
                  ) : leftToAllocate > 0 ? (
                    <>
                      <InlineMoney>{formatCurrency(leftToAllocate)}</InlineMoney>
                      <span>still left to allocate.</span>
                    </>
                  ) : (
                    <>
                      <InlineMoney>{formatCurrency(Math.abs(leftToAllocate))}</InlineMoney>
                      <span>over-allocated.</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className={cn('text-3xl font-bold', netCashFlow >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300')}>
                  <InlineMoney>{formatCurrency(netCashFlow)}</InlineMoney>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Net cash flow across {selectedYear}
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Top Spending Categories</h3>

            {spendingBreakdown.length > 0 ? (
              <div className="flex flex-col items-center gap-6 md:flex-row lg:flex-col xl:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={900}
                      >
                        {spendingBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full flex-1 space-y-3">
                  {spendingBreakdown.map((category) => (
                    <div key={category.name} className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: category.color }} />
                      <span className="flex-1 truncate text-sm">{category.name}</span>
                      <span className="text-sm font-medium tabular-nums">
                        <InlineMoney>{formatCurrency(category.value)}</InlineMoney>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-medium">No expense data yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add expenses to see category breakdown.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">
              {mode === 'year' ? 'Monthly Spending This Year' : 'Daily Spending This Month'}
            </h3>

            {dailySpending.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => (mode === 'year' ? label : `Day ${label}`)}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#0078D4"
                      fill="#0078D4"
                      fillOpacity={0.14}
                      strokeWidth={2}
                      animationDuration={900}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-medium">No spending yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Expense transactions will appear here.
                </p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Smart Insights</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <InsightCard
                key={insight.title}
                icon={insight.icon}
                title={insight.title}
                text={insight.text}
                tone={insight.tone}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
