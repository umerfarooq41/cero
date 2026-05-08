import { useMemo, useState } from 'react';
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

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function Card({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function ReflectPeriodControl({
  currentMonth,
  mode,
  onModeChange,
  onChange,
  years,
}) {
  const [year, month] = currentMonth.split('-').map(Number);

  const updateYear = (nextYearValue) => {
    const nextYear = Number(nextYearValue);
    onChange(`${nextYear}-${String(month).padStart(2, '0')}`);
  };

  const updateMonth = (monthValue) => {
    onChange(`${year}-${String(Number(monthValue)).padStart(2, '0')}`);
  };

  return (
    <Card className="p-4 mb-4 bg-gradient-to-br from-background via-card to-muted/40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="grid grid-cols-2 rounded-lg bg-muted p-1 sm:w-auto">
          {['month', 'year'].map((option) => {
            const active = mode === option;

            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => onModeChange(option)}
                className={cn(
                  'h-9 rounded-md px-4 text-sm font-semibold capitalize transition',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            'grid gap-2 sm:flex sm:justify-end',
            mode === 'month' ? 'grid-cols-2' : 'grid-cols-1'
          )}
        >
          {mode === 'month' && (
            <Select value={String(month)} onValueChange={updateMonth}>
              <SelectTrigger
                aria-label="Month"
                className="h-10 min-w-[120px] bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={String(year)} onValueChange={updateYear}>
            <SelectTrigger
              aria-label="Year"
              className="h-10 min-w-[104px] bg-background"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

function InlineMoney({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle whitespace-nowrap leading-none [&_svg]:shrink-0 [&_img]:shrink-0',
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
        'p-4 overflow-hidden relative min-h-[112px]',
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
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/35 dark:bg-white/5" />

      <div className="relative flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-2 leading-none">
            {title}
          </p>

          <div
            className={cn(
              'text-xl font-bold tabular-nums leading-none flex items-center min-h-[24px]',
              toneClass
            )}
          >
            <InlineMoney>{value}</InlineMoney>
          </div>

          {subtitle && (
            <div className="mt-2 text-[11px] text-muted-foreground leading-snug flex items-center gap-x-1 gap-y-1 flex-wrap">
              {subtitle}
            </div>
          )}
        </div>

        <div
          className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
            tone === 'good' && 'bg-emerald-100 dark:bg-emerald-900/40',
            tone === 'bad' && 'bg-red-100 dark:bg-red-900/40',
            tone === 'blue' && 'bg-blue-100 dark:bg-blue-900/40',
            tone === 'purple' && 'bg-violet-100 dark:bg-violet-900/40',
            tone === 'default' && 'bg-muted'
          )}
        >
          <Icon className={cn('w-4 h-4', iconClass)} />
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ icon: Icon, title, text, tone = 'default' }) {
  const iconClass =
    tone === 'good'
      ? 'text-[hsl(var(--success))]'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'warning'
          ? 'text-amber-500'
          : 'text-primary';

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className={cn('w-4 h-4', iconClass)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {text}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function Reflect() {
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), 'yyyy-MM')
  );
  const [viewMode, setViewMode] = useState('month');

  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const budget = useBudgetSummary(currentMonth);

  const selectedYear = Number(currentMonth.slice(0, 4));
  const isYearMode = viewMode === 'year';
  const monthTransactions = useMemo(
    () => budget.transactions || [],
    [budget.transactions]
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = Math.min(currentYear, selectedYear) - 5;
    const maxYear = Math.max(currentYear, selectedYear) + 2;
    const options = new Set();

    for (let option = maxYear; option >= minYear; option -= 1) {
      options.add(option);
    }

    allTransactions.forEach((transaction) => {
      const transactionYear = Number(transaction.date?.slice(0, 4));

      if (Number.isFinite(transactionYear)) {
        options.add(transactionYear);
      }
    });

    return Array.from(options).sort((a, b) => b - a);
  }, [allTransactions, selectedYear]);

  const periodTransactions = useMemo(() => {
    if (!isYearMode) {
      return monthTransactions;
    }

    return allTransactions.filter((transaction) =>
      transaction.date?.startsWith(`${selectedYear}-`)
    );
  }, [allTransactions, isYearMode, monthTransactions, selectedYear]);

  const periodTotals = useMemo(() => {
    return periodTransactions.reduce(
      (totals, transaction) => {
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === 'income') {
          totals.income += amount;
        }

        if (transaction.type === 'expense') {
          totals.expenses += amount;
        }

        return totals;
      },
      { income: 0, expenses: 0 }
    );
  }, [periodTransactions]);

  const periodLabel = isYearMode
    ? String(selectedYear)
    : format(new Date(`${currentMonth}-01T00:00:00`), 'MMMM yyyy');
  const periodNoun = isYearMode ? 'year' : 'month';
  const periodDescriptor = isYearMode ? 'selected year' : 'selected month';

  const income = periodTotals.income;
  const expenses = periodTotals.expenses;
  const plannedExpenses = isYearMode
    ? 0
    : Number(budget.totalPlannedExpenses) || 0;
  const plannedIncome = isYearMode ? 0 : Number(budget.totalPlannedIncome) || 0;
  const leftToAllocate = isYearMode ? 0 : Number(budget.leftToAllocate) || 0;
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
    if (plannedExpenses === 0) return 0;

    const ratio = expenses / plannedExpenses;

    if (ratio <= 1) {
      return Math.round((1 - Math.abs(1 - ratio)) * 100);
    }

    return Math.max(0, Math.round((1 - (ratio - 1)) * 100));
  }, [expenses, plannedExpenses]);

  const performanceScore = isYearMode
    ? Math.max(0, Math.min(100, savingsRate))
    : efficiency;
  const performanceValue = isYearMode && income > 0 ? savingsRate : efficiency;
  const performanceColor = isYearMode
    ? savingsRate >= 20
      ? '#107C10'
      : savingsRate >= 0
        ? '#FFB900'
        : '#C50F1F'
    : efficiency >= 70
      ? '#107C10'
      : efficiency >= 40
        ? '#FFB900'
        : '#C50F1F';
  const spendingShare = income > 0 ? Math.round((expenses / income) * 100) : 0;

  const spendingBreakdown = useMemo(() => {
    const categorySpending = {};

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const name = category?.name || 'Uncategorized';
        categorySpending[name] =
          (categorySpending[name] || 0) + (Number(t.amount) || 0);
      });

    return Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, value], i) => ({
        name,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [periodTransactions, categories]);

  const cashFlow = useMemo(() => {
    if (isYearMode) {
      return MONTH_LABELS.map((label, index) => {
        const month = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
        const txns = allTransactions.filter((t) => t.date?.startsWith(month));

        const monthIncome = txns
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + (Number(t.amount) || 0), 0);

        const monthExpenses = txns
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + (Number(t.amount) || 0), 0);

        return {
          month: label,
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
        };
      });
    }

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(`${currentMonth}-01T00:00:00`), i);
      const month = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM');

      const txns = allTransactions.filter((t) => t.date?.startsWith(month));

      const monthIncome = txns
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const monthExpenses = txns
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      months.push({
        month: label,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      });
    }

    return months;
  }, [allTransactions, currentMonth, isYearMode, selectedYear]);

  const spendingTrend = useMemo(() => {
    if (isYearMode) {
      return MONTH_LABELS.map((label, index) => {
        const month = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
        const amount = allTransactions
          .filter(
            (t) => t.type === 'expense' && t.date?.startsWith(month)
          )
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return { label, amount };
      });
    }

    const days = {};

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const day = t.date?.slice(8, 10) || '01';
        days[day] = (days[day] || 0) + (Number(t.amount) || 0);
      });

    return Object.entries(days)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, amount]) => ({ label: day, amount }));
  }, [allTransactions, isYearMode, periodTransactions, selectedYear]);

  const topCategory = spendingBreakdown[0];
  const hasSpendingTrend = spendingTrend.some((point) => point.amount > 0);

  const insights = [
    {
      icon: netCashFlow >= 0 ? TrendingUp : TrendingDown,
      title: netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      text:
        netCashFlow >= 0 ? (
          <>
            You kept{' '}
            <InlineMoney>{formatCurrency(netCashFlow)}</InlineMoney> after
            expenses for the {periodDescriptor}.
          </>
        ) : (
          <>
            You spent{' '}
            <InlineMoney>{formatCurrency(Math.abs(netCashFlow))}</InlineMoney>{' '}
            more than your income for the {periodDescriptor}.
          </>
        ),
      tone: netCashFlow >= 0 ? 'good' : 'bad',
    },
    isYearMode
      ? {
          icon: Target,
          title: 'Yearly spending pace',
          text:
            income > 0
              ? `Expenses used ${spendingShare}% of income in ${selectedYear}.`
              : 'Add income transactions to compare yearly spending with income.',
          tone:
            income === 0
              ? 'warning'
              : spendingShare <= 80
                ? 'good'
                : spendingShare <= 100
                  ? 'warning'
                  : 'bad',
        }
      : {
          icon: Target,
          title: 'Budget efficiency',
          text:
            efficiency >= 80
              ? 'Strong control. Your spending is close to your planned budget.'
              : efficiency >= 50
                ? 'Some categories may need review before month end.'
                : 'Spending is far from plan. Review your largest categories.',
          tone: efficiency >= 80 ? 'good' : efficiency >= 50 ? 'warning' : 'bad',
        },
    {
      icon: topCategory ? CreditCard : Brain,
      title: topCategory ? `Largest spend: ${topCategory.name}` : 'No spending yet',
      text: topCategory ? (
        <>
          {topCategory.name} used{' '}
          <InlineMoney>{formatCurrency(topCategory.value)}</InlineMoney> in the{' '}
          {periodDescriptor}.
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
          ? `Your estimated savings rate is ${savingsRate}%.`
          : 'Add income transactions to calculate your savings rate.',
      tone: savingsRate >= 20 ? 'good' : savingsRate < 0 ? 'bad' : 'warning',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reflect</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Summary, trends, and useful insights
        </p>
      </div>

      <ReflectPeriodControl
        currentMonth={currentMonth}
        mode={viewMode}
        onModeChange={setViewMode}
        onChange={setCurrentMonth}
        years={yearOptions}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <SummaryCard
          title="Income"
          value={formatCurrency(income)}
          subtitle={
            plannedIncome > 0 ? (
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
            plannedExpenses > 0 ? (
              <>
                <InlineMoney>{formatCurrency(plannedExpenses)}</InlineMoney>
                <span>planned</span>
              </>
            ) : (
              `${periodLabel} actual`
            )
          }
          icon={ArrowDownRight}
          tone={expenses > plannedExpenses && plannedExpenses > 0 ? 'bad' : 'blue'}
        />

        <SummaryCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow)}
          subtitle={
            income > 0 ? `${savingsRate}% savings rate` : `This ${periodNoun}`
          }
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

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-4">
        <Card className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              {isYearMode
                ? `Cash Flow - ${selectedYear}`
                : 'Cash Flow - Last 6 Months'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Income, expenses, and monthly net
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
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
                <Bar
                  dataKey="income"
                  fill="#107C10"
                  radius={[6, 6, 0, 0]}
                  animationDuration={900}
                />
                <Bar
                  dataKey="expenses"
                  fill="#C50F1F"
                  radius={[6, 6, 0, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              {isYearMode ? 'Savings Rate' : 'Budget Efficiency'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isYearMode
                ? `Full-year cash flow for ${selectedYear}`
                : 'How closely spending follows your plan'}
            </p>
          </div>

          <div className="flex items-center justify-center py-3">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="3"
                />
                <motion.path
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${performanceScore}, 100` }}
                  transition={{ duration: 1 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={performanceColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{performanceValue}%</span>
                <span className="text-xs text-muted-foreground">
                  {isYearMode ? 'rate' : 'score'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center text-sm font-medium flex justify-center flex-wrap gap-x-1 gap-y-1">
            {isYearMode ? (
              income > 0 ? (
                netCashFlow >= 0 ? (
                  <>
                    <InlineMoney>{formatCurrency(netCashFlow)}</InlineMoney>
                    <span>kept after yearly expenses.</span>
                  </>
                ) : (
                  <>
                    <InlineMoney>{formatCurrency(Math.abs(netCashFlow))}</InlineMoney>
                    <span>shortfall for the selected year.</span>
                  </>
                )
              ) : (
                'Add income transactions to calculate yearly savings.'
              )
            ) : leftToAllocate === 0 ? (
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
        </Card>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4 mb-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Top Spending Categories</h3>

          {spendingBreakdown.length > 0 ? (
            <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row items-center gap-6">
              <div className="w-44 h-44 shrink-0">
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

              <div className="flex-1 space-y-3 w-full">
                {spendingBreakdown.map((category) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm flex-1 truncate">{category.name}</span>
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
              <p className="text-xs text-muted-foreground mt-1">
                Add expenses to see category breakdown.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">
            {isYearMode
              ? 'Monthly Spending in Selected Year'
              : 'Daily Spending in Selected Month'}
          </h3>

          {hasSpendingTrend ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) =>
                      isYearMode ? label : `Day ${label}`
                    }
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
              <p className="text-sm font-medium">No spending data yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expense transactions will appear here.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Smart Insights</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
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
    </div>
  );
}
