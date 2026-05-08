import { useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CreditCard,
  PieChart as PieChartIcon,
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
import {
  ChartCard,
  GlassCard,
  InsightCard,
  MetricCard,
  MoneyAmount,
  PageHeader,
  TonePill,
} from '@/components/shared/Premium';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--secondary-foreground))',
  'hsl(var(--border))',
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

const INITIAL_MONTH = format(new Date(), 'MM');
const INITIAL_YEAR = format(new Date(), 'yyyy');

function moneyWithSign(value, formatCurrency, showPlus = false) {
  const amount = Number(value) || 0;

  return (
    <MoneyAmount>
      {amount < 0 && <span>-</span>}
      {amount > 0 && showPlus && <span>+</span>}
      {formatCurrency(Math.abs(amount))}
    </MoneyAmount>
  );
}

function chartTooltip(formatCurrency) {
  return {
    cursor: { fill: 'hsl(var(--muted) / 0.55)' },
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '16px',
      fontSize: '12px',
      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.10)',
    },
    formatter: (value) => formatCurrency(value),
  };
}

function PeriodFilter({ mode, setMode, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, years }) {
  return (
    <GlassCard className="p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 rounded-2xl bg-secondary/75 p-1">
          {['month', 'year'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all',
                mode === item
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {mode === 'month' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-10 w-[8.5rem] rounded-2xl bg-secondary/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-10 w-[7rem] rounded-2xl bg-secondary/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </GlassCard>
  );
}

function EfficiencyGauge({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="flex items-center justify-center py-3">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 36 36" className="h-44 w-44 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            strokeWidth="3"
            className="transition-all duration-700"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tight">{score}%</span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            score
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Reflect() {
  const [mode, setMode] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(INITIAL_MONTH);
  const [selectedYear, setSelectedYear] = useState(INITIAL_YEAR);

  const formatCurrency = useCurrencyFormatter();

  const currentMonth = `${selectedYear}-${selectedMonth}`;
  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const budget = useBudgetSummary(currentMonth);

  const years = useMemo(() => {
    const fromTransactions = allTransactions
      .map((transaction) => transaction.date?.slice(0, 4))
      .filter(Boolean);
    return [...new Set([selectedYear, INITIAL_YEAR, ...fromTransactions])]
      .sort((a, b) => Number(b) - Number(a));
  }, [allTransactions, selectedYear]);

  const periodTransactions = useMemo(() => {
    if (mode === 'month') return budget.transactions || [];
    return allTransactions.filter((transaction) => transaction.date?.startsWith(selectedYear));
  }, [mode, budget.transactions, allTransactions, selectedYear]);

  const income = periodTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const expenses = periodTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const plannedExpenses = Number(budget.totalPlannedExpenses) || 0;
  const plannedIncome = Number(budget.totalPlannedIncome) || 0;
  const leftToAllocate = Number(budget.leftToAllocate) || 0;
  const netCashFlow = income - expenses;

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

  const netWorth = totalAssets - totalLiabilities;
  const savingsRate = income > 0 ? Math.round((netCashFlow / income) * 100) : 0;

  const efficiency = useMemo(() => {
    if (mode === 'year') {
      if (income <= 0) return 0;
      return Math.max(0, Math.min(100, Math.round((netCashFlow / income) * 100)));
    }

    if (plannedExpenses === 0) return 0;

    const ratio = expenses / plannedExpenses;
    if (ratio <= 1) return Math.round((1 - Math.abs(1 - ratio)) * 100);
    return Math.max(0, Math.round((1 - (ratio - 1)) * 100));
  }, [mode, income, netCashFlow, plannedExpenses, expenses]);

  const spendingBreakdown = useMemo(() => {
    const categorySpending = {};

    periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const category = categories.find((item) => item.id === transaction.category_id);
        const name = category?.name || 'Uncategorized';
        categorySpending[name] = (categorySpending[name] || 0) + (Number(transaction.amount) || 0);
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
    if (mode === 'year') {
      return MONTHS.map((month) => {
        const monthKey = `${selectedYear}-${month.value}`;
        const transactions = allTransactions.filter((transaction) => transaction.date?.startsWith(monthKey));
        const monthIncome = transactions
          .filter((transaction) => transaction.type === 'income')
          .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
        const monthExpenses = transactions
          .filter((transaction) => transaction.type === 'expense')
          .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

        return {
          month: month.short,
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
        };
      });
    }

    const months = [];

    for (let index = 5; index >= 0; index -= 1) {
      const monthDate = subMonths(new Date(`${currentMonth}-01`), index);
      const monthKey = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM');
      const transactions = allTransactions.filter((transaction) => transaction.date?.startsWith(monthKey));

      const monthIncome = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

      const monthExpenses = transactions
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

  const spendingTimeline = useMemo(() => {
    if (mode === 'year') {
      return MONTHS.map((month) => {
        const monthKey = `${selectedYear}-${month.value}`;
        const amount = allTransactions
          .filter((transaction) => transaction.type === 'expense' && transaction.date?.startsWith(monthKey))
          .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
        return { label: month.short, amount };
      });
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
      .map(([day, amount]) => ({ label: day, amount }));
  }, [mode, periodTransactions, allTransactions, selectedYear]);

  const topCategory = spendingBreakdown[0];
  const periodLabel =
    mode === 'month'
      ? `${MONTHS.find((month) => month.value === selectedMonth)?.label} ${selectedYear}`
      : selectedYear;

  const insights = [
    {
      icon: netCashFlow >= 0 ? TrendingUp : TrendingDown,
      title: netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      tone: netCashFlow >= 0 ? 'income' : 'debt',
      text:
        netCashFlow >= 0 ? (
          <>
            You kept {moneyWithSign(netCashFlow, formatCurrency)} after expenses in {periodLabel}.
          </>
        ) : (
          <>
            Spending exceeded income by {moneyWithSign(Math.abs(netCashFlow), formatCurrency)} in {periodLabel}.
          </>
        ),
    },
    {
      icon: Target,
      title: mode === 'month' ? 'Budget efficiency' : 'Year cash control',
      tone: efficiency >= 75 ? 'income' : efficiency >= 50 ? 'warning' : 'debt',
      text:
        efficiency >= 75
          ? 'Strong control. Your spending pattern is staying healthy.'
          : efficiency >= 50
            ? 'A few categories deserve attention before the pattern hardens.'
            : 'The period is drifting. Review the largest spend areas first.',
    },
    {
      icon: topCategory ? CreditCard : Brain,
      title: topCategory ? `Largest spend: ${topCategory.name}` : 'No spending yet',
      tone: topCategory ? 'expense' : 'income',
      text: topCategory ? (
        <>
          {topCategory.name} used {formatCurrency(topCategory.value)} during this period.
        </>
      ) : (
        'Once you add expenses, your top spending categories will appear here.'
      ),
    },
    {
      icon: PiggyBank,
      title: 'Savings rate',
      tone: savingsRate >= 20 ? 'savings' : savingsRate < 0 ? 'debt' : 'warning',
      text:
        income > 0
          ? `Estimated savings rate is ${savingsRate}% for ${periodLabel}.`
          : 'Add income transactions to calculate your savings rate.',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-nav sm:px-6 sm:pt-5 lg:pt-6">
      <PageHeader
        title="Reflect"
        description="A calm analytics cockpit for cash flow, budget health, and net worth."
        icon={BarChart3}
        actions={<TonePill>{periodLabel}</TonePill>}
      />

      <PeriodFilter
        mode={mode}
        setMode={setMode}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        years={years}
      />

      <GlassCard className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <TonePill>
              {netCashFlow >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {netCashFlow >= 0 ? 'Cash positive' : 'Cash negative'}
            </TonePill>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              {moneyWithSign(netCashFlow, formatCurrency, true)}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Income and expenses across {periodLabel}, with the budget signal kept close enough to guide your next move.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-border/70 bg-secondary/45 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Net worth</p>
              <div className="mt-2 text-xl font-semibold">
                {moneyWithSign(netWorth, formatCurrency)}
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-secondary/45 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Savings rate</p>
              <div className="mt-2 text-xl font-semibold">{savingsRate}%</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="Income"
          label="Income"
          value={formatCurrency(income)}
          detail={plannedIncome > 0 && mode === 'month' ? <>{formatCurrency(plannedIncome)} planned</> : periodLabel}
          icon={ArrowDownRight}
        />
        <MetricCard
          label="Expenses"
          value={formatCurrency(expenses)}
          detail={plannedExpenses > 0 && mode === 'month' ? <>{formatCurrency(plannedExpenses)} planned</> : periodLabel}
          icon={ArrowUpRight}
        />
        <MetricCard
          label="Net Cash Flow"
          value={moneyWithSign(netCashFlow, formatCurrency)}
          detail={income > 0 ? `${savingsRate}% savings rate` : 'Waiting for income'}
          icon={Wallet}
        />
        <MetricCard
          label="Net Worth"
          value={moneyWithSign(netWorth, formatCurrency)}
          detail={
            <span className="flex flex-wrap gap-x-1 gap-y-1">
              <span>{formatCurrency(totalAssets)} assets</span>
              <span>{formatCurrency(totalLiabilities)} debt</span>
            </span>
          }
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <ChartCard
          title="Cash Flow Trend"
          subtitle={mode === 'year' ? 'Full year by month' : 'Last 6 months'}
          icon={BarChart3}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip {...chartTooltip(formatCurrency)} />
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} animationDuration={900} />
                <Bar dataKey="expenses" fill="hsl(var(--muted-foreground))" radius={[8, 8, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={mode === 'month' ? 'Budget Efficiency' : 'Cash Control'}
          subtitle={mode === 'month' ? 'Actual expenses against plan' : 'Net cash retained from income'}
          icon={Target}
        >
          <EfficiencyGauge value={efficiency} />
          <div className="text-center text-sm font-medium text-muted-foreground">
            {mode === 'month' ? (
              Math.abs(leftToAllocate) < 0.01 ? (
                'Every planned amount is allocated.'
              ) : leftToAllocate > 0 ? (
                <span className="inline-flex flex-wrap justify-center gap-1">
                  {formatCurrency(leftToAllocate)} still left to allocate.
                </span>
              ) : (
                <span className="inline-flex flex-wrap justify-center gap-1">
                  {formatCurrency(Math.abs(leftToAllocate))} over-allocated.
                </span>
              )
            ) : (
              `${savingsRate}% estimated savings rate this year.`
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <ChartCard title="Top Spending" subtitle="Largest expense categories" icon={PieChartIcon}>
          {spendingBreakdown.length > 0 ? (
            <div className="flex flex-col items-center gap-5 xl:flex-row">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={900}
                    >
                      {spendingBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltip(formatCurrency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full flex-1 space-y-3">
                {spendingBreakdown.map((category) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="flex-1 truncate text-sm">{category.name}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      <MoneyAmount>{formatCurrency(category.value)}</MoneyAmount>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold">No expense data yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add expenses to see category breakdown.</p>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title={mode === 'month' ? 'Daily Spending' : 'Monthly Spending'}
          subtitle={mode === 'month' ? 'Expense rhythm this month' : 'Expense rhythm this year'}
          icon={TrendingDown}
        >
          {spendingTimeline.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTimeline}>
                  <defs>
                    <linearGradient id="spendingFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip {...chartTooltip(formatCurrency)} labelFormatter={(label) => (mode === 'month' ? `Day ${label}` : label)} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fill="url(#spendingFill)"
                    strokeWidth={2.5}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold">No spending timeline yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Expense transactions will appear here.</p>
            </div>
          )}
        </ChartCard>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Smart Insights</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.title} icon={insight.icon} title={insight.title}>
              {insight.text}
            </InsightCard>
          ))}
        </div>
      </div>
    </div>
  );
}
