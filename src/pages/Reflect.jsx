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
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const YEARS = Array.from({ length: 9 }, (_, index) => {
  const currentYear = new Date().getFullYear();
  return currentYear - 4 + index;
});

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

function MonthYearToggle({ currentMonth, onChange }) {
  const [mode, setMode] = useState('month');
  const [year, month] = currentMonth.split('-');

  const updateMonth = (nextMonth) => {
    onChange(`${year}-${nextMonth}`);
  };

  const updateYear = (nextYear) => {
    onChange(`${nextYear}-${month}`);
  };

  return (
    <Card className="p-4 mb-4 bg-gradient-to-br from-background via-card to-muted/40">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 mb-4">
        {['month', 'year'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              'h-10 rounded-xl text-sm font-semibold capitalize transition-all',
              mode === item
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {mode === 'month' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => updateMonth(e.target.value)}
              className="w-full h-11 rounded-2xl border border-border bg-background px-4 text-sm font-medium outline-none"
            >
              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => updateYear(e.target.value)}
              className="w-full h-11 rounded-2xl border border-border bg-background px-4 text-sm font-medium outline-none"
            >
              {YEARS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Year
          </label>
          <select
            value={year}
            onChange={(e) => updateYear(e.target.value)}
            className="w-full h-11 rounded-2xl border border-border bg-background px-4 text-sm font-medium outline-none"
          >
            {YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}
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

  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const budget = useBudgetSummary(currentMonth);

  const monthTransactions = budget.transactions || [];

  const income = Number(budget.totalIncome) || 0;
  const expenses = Number(budget.totalExpenses) || 0;
  const plannedExpenses = Number(budget.totalPlannedExpenses) || 0;
  const plannedIncome = Number(budget.totalPlannedIncome) || 0;
  const leftToAllocate = Number(budget.leftToAllocate) || 0;
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
    if (ratio <= 1) return Math.round((1 - Math.abs(1 - ratio)) * 100);
    return Math.max(0, Math.round((1 - (ratio - 1)) * 100));
  }, [expenses, plannedExpenses]);

  const spendingBreakdown = useMemo(() => {
    const categorySpending = {};

    monthTransactions
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
  }, [monthTransactions, categories]);

  const cashFlow = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(`${currentMonth}-01`), i);
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
  }, [currentMonth, allTransactions]);

  const dailySpending = useMemo(() => {
    const days = {};

    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const day = t.date?.slice(8, 10) || '01';
        days[day] = (days[day] || 0) + (Number(t.amount) || 0);
      });

    return Object.entries(days)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, amount]) => ({ day, amount }));
  }, [monthTransactions]);

  const topCategory = spendingBreakdown[0];

  const insights = [
    {
      icon: netCashFlow >= 0 ? TrendingUp : TrendingDown,
      title: netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      text:
        netCashFlow >= 0 ? (
          <>
            You kept <InlineMoney>{formatCurrency(netCashFlow)}</InlineMoney>{' '}
            after expenses this month.
          </>
        ) : (
          <>
            You spent{' '}
            <InlineMoney>{formatCurrency(Math.abs(netCashFlow))}</InlineMoney>{' '}
            more than your income this month.
          </>
        ),
      tone: netCashFlow >= 0 ? 'good' : 'bad',
    },
    {
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
          <InlineMoney>{formatCurrency(topCategory.value)}</InlineMoney> this
          month.
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

      <MonthYearToggle currentMonth={currentMonth} onChange={setCurrentMonth} />

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
              'No planned income'
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
              'No planned expenses'
            )
          }
          icon={ArrowDownRight}
          tone={expenses > plannedExpenses && plannedExpenses > 0 ? 'bad' : 'blue'}
        />

        <SummaryCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow)}
          subtitle={savingsRate ? `${savingsRate}% savings rate` : 'This month'}
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

      {/* rest of your existing chart/insight sections remain unchanged */}
    </div>
  );
}