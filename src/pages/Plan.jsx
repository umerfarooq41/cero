import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  PencilLine,
  PiggyBank,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/layout/PageHeader';
import MonthSelector from '@/components/shared/MonthSelector';
import CategoryIconBadge from '@/components/shared/CategoryIcon';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import {
  useAllocations,
  useBudgetSummary,
  useCategories,
} from '@/hooks/useBudgetData';
import { useCurrency, useCurrencyFormatter } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencyNoun as getSharedCurrencyNoun,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';

const TABS = [
  {
    key: 'income',
    title: 'Income',
    label: 'received',
    color: '#16A34A',
    activeClass:
      'bg-emerald-500/10 text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.18)] dark:text-emerald-400 dark:shadow-[0_8px_24px_rgba(16,185,129,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-400',
    icon: ArrowUpRight,
    shades: ['#14532D', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC'],
  },
  {
    key: 'expense',
    title: 'Expenses',
    label: 'spent',
    color: '#DC2626',
    activeClass:
      'bg-red-500/10 text-red-700 shadow-[0_8px_24px_rgba(239,68,68,0.18)] dark:text-red-400 dark:shadow-[0_8px_24px_rgba(239,68,68,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-red-500/5 hover:text-red-700 dark:hover:text-red-400',
    icon: ArrowDownRight,
    shades: ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171'],
  },
  {
    key: 'savings',
    title: 'Savings',
    label: 'saved',
    color: '#2563EB',
    activeClass:
      'bg-blue-500/10 text-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.18)] dark:text-blue-400 dark:shadow-[0_8px_24px_rgba(59,130,246,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-blue-500/5 hover:text-blue-700 dark:hover:text-blue-400',
    icon: PiggyBank,
    shades: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
  },
  {
    key: 'debt',
    title: 'Debt',
    label: 'paid',
    color: '#7C3AED',
    activeClass:
      'bg-purple-500/10 text-purple-700 shadow-[0_8px_24px_rgba(124,58,237,0.18)] dark:text-purple-400 dark:shadow-[0_8px_24px_rgba(124,58,237,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-purple-500/5 hover:text-purple-700 dark:hover:text-purple-400',
    icon: CreditCard,
    shades: ['#581C87', '#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'],
  },
];

const SOURCE_BADGE_CLASS = {
  recurring: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  goal: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

const formatNumber = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
};

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);
const getCurrencyName = (currency) => getSharedCurrencyNoun(currency);
const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function normalizeType(value) {
  const type = String(value || '').toLowerCase();
  if (type === 'transfer' || type === 'debt_payment' || type === 'debt') return 'debt';
  if (type === 'income') return 'income';
  if (type === 'savings') return 'savings';
  return 'expense';
}

function getCategoryType(category, categories = []) {
  if (!category) return null;
  if (category.type) return normalizeType(category.type);

  const parent = categories.find((item) => item.id === category.parent_id);
  return parent ? normalizeType(parent.type) : null;
}

function getAllocationSourceType(allocation) {
  return allocation?.source_type || allocation?.item_type || allocation?.plan_item_type || 'category';
}

function isActiveRule(rule) {
  if (!rule || rule.is_archived) return false;
  if (rule.is_active === false) return false;
  const status = String(rule.status || '').toLowerCase();
  return status !== 'paused' && status !== 'inactive' && status !== 'archived';
}

function getMonthEnd(month) {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
}

function recurringIsRelevant(rule, month) {
  if (!isActiveRule(rule) || !rule?.next_due_date || !month) return false;

  const nextDue = new Date(`${String(rule.next_due_date).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(nextDue.getTime())) return false;

  const monthEnd = getMonthEnd(month);
  const frequency = String(rule.frequency || 'monthly').toLowerCase();

  if (frequency.includes('year')) {
    const selectedMonth = new Date(`${month}-01T00:00:00`);
    return nextDue.getMonth() === selectedMonth.getMonth() && nextDue <= monthEnd;
  }

  return nextDue <= monthEnd;
}

function formatDateText(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getDueText(value) {
  if (!value) return 'Due date not set';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 'Due date not set';

  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff > 1) return `Due in ${diff}d`;
  if (diff === -1) return 'Overdue by 1d';
  return `Overdue by ${Math.abs(diff)}d`;
}

function Money({ amount, currency, compact = false, className = '' }) {
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
        <span
          className={cn(
            'inline-block shrink-0 bg-current align-middle',
            compact ? 'h-[0.8em] w-[0.8em]' : 'h-[0.9em] w-[0.9em]'
          )}
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

function DonutTooltip({ active, payload, currency, tab }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  const tracked = Number(item?.tracked || 0);
  const planned = Number(item?.planned || 0);
  const percent = planned > 0 ? Math.round((tracked / planned) * 100) : 0;

  return (
    <div className="rounded-xl border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-bold tabular-nums">{item?.name}</p>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{tab.label}</span>
        <Money amount={tracked} currency={currency} compact />
      </div>

      <p className="mt-1 text-[11px] font-semibold tabular-nums" style={{ color: item?.color }}>
        {percent}% tracked
      </p>
    </div>
  );
}

function ReadOnlyBreakdownRow({ item, currency }) {
  const percent = item.planned > 0 ? Math.min((item.tracked / item.planned) * 100, 100) : 0;

  return (
    <div className={cn('px-4 py-4', item.sourceType && 'bg-white/10 dark:bg-white/[0.015]')}>
      <div className="flex items-center gap-3">
        <CategoryIconBadge
          icon={item.icon || item.category?.icon}
          color={item.categoryColor || item.color}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                {item.sourceType && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'h-5 rounded-full px-2 text-[10px] font-semibold leading-none',
                      SOURCE_BADGE_CLASS[item.sourceType]
                    )}
                  >
                    {item.sourceType === 'goal' ? 'Goal' : 'Recurring'}
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>

            <p className="shrink-0 text-sm font-bold tabular-nums">
              <Money amount={item.tracked} currency={currency} compact />
            </p>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percent}%`,
                backgroundColor: item.remaining < 0 ? '#DC2626' : item.color,
              }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              {formatNumber(item.tracked)} / {formatNumber(item.planned)}
            </span>

            <span className={item.remaining < 0 ? 'font-medium text-red-600' : ''}>
              {item.remaining >= 0
                ? `${formatNumber(item.remaining)} left`
                : `${formatNumber(Math.abs(item.remaining))} over`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanOverview({
  activeTab,
  setActiveTab,
  categories,
  subcategories,
  budget,
  currency,
  allocations,
}) {
  const tab = TABS.find((t) => t.key === activeTab) || TABS[0];

  const extraPlanRows = useMemo(() => {
    return allocations
      .filter((allocation) => {
        const sourceType = getAllocationSourceType(allocation);
        return sourceType !== 'category' && !allocation.category_id && normalizeType(allocation.budget_type) === activeTab;
      })
      .map((allocation, index) => {
        const planned = Number(allocation.planned_amount || 0);
        const sourceType = getAllocationSourceType(allocation);

        return {
          id: `${sourceType}:${allocation.source_id || allocation.id}`,
          name: allocation.label || (sourceType === 'goal' ? 'Savings goal' : 'Recurring item'),
          planned,
          tracked: 0,
          remaining: planned,
          color: allocation.color || tab.shades[(index + 3) % tab.shades.length] || tab.color,
          icon: allocation.icon || (sourceType === 'goal' ? 'target' : 'receipt'),
          sourceType,
          description: '',
        };
      })
      .filter((item) => item.planned > 0);
  }, [activeTab, allocations, tab]);

  const sectionCategories = categories.filter(
    (c) => getCategoryType(c, categories) === activeTab && !c.parent_id
  );

  const categoryRows = sectionCategories
    .map((category, index) => {
      const childCategories = subcategories.filter((s) => s.parent_id === category.id);

      const planned =
        childCategories.length > 0
          ? childCategories.reduce((sum, child) => sum + Number(budget.getCategoryPlanned(child.id) || 0), 0)
          : Number(budget.getCategoryPlanned(category.id) || 0);

      const tracked =
        childCategories.length > 0
          ? childCategories.reduce((sum, child) => sum + Number(budget.getCategorySpent(child.id) || 0), 0)
          : Number(budget.getCategorySpent(category.id) || 0);

      return {
        id: category.id,
        name: category.name,
        category,
        planned,
        tracked,
        remaining: planned - tracked,
        color: tab.shades[index % tab.shades.length],
        categoryColor: category.color,
        icon: category.icon,
      };
    })
    .filter((item) => item.planned > 0 || item.tracked > 0);

  const chartData = [...categoryRows, ...extraPlanRows];
  const totalTracked = chartData.reduce((sum, item) => sum + item.tracked, 0);
  const totalPlanned = chartData.reduce((sum, item) => sum + item.planned, 0);
  const totalRemaining = totalPlanned - totalTracked;
  const progress = totalPlanned > 0 ? Math.min((totalTracked / totalPlanned) * 100, 100) : 0;

  const donutChartData = useMemo(() => {
    if (chartData.length === 0) {
      return [
        {
          name: 'No data',
          value: 1,
          tracked: 0,
          planned: 0,
          remaining: 0,
          color: '#E5E7EB',
        },
      ];
    }

    const sorted = [...chartData].sort((a, b) => {
      const aValue = Number(a.tracked || 0) || Number(a.planned || 0);
      const bValue = Number(b.tracked || 0) || Number(b.planned || 0);
      return bValue - aValue;
    });

    const topFour = sorted.slice(0, 4).map((item, index) => ({
      ...item,
      color: item.color || tab.shades[index],
      value: Math.max(Number(item.tracked || 0) || Number(item.planned || 0), 0.01),
    }));

    const others = sorted.slice(4);
    if (others.length === 0) return topFour;

    const othersTracked = others.reduce((sum, item) => sum + Number(item.tracked || 0), 0);
    const othersPlanned = others.reduce((sum, item) => sum + Number(item.planned || 0), 0);

    return [
      ...topFour,
      {
        id: `${activeTab}-others`,
        name: 'Others',
        planned: othersPlanned,
        tracked: othersTracked,
        remaining: othersPlanned - othersTracked,
        color: tab.shades[4] || tab.color,
        value: Math.max(othersTracked || othersPlanned, 0.01),
        isOthers: true,
      },
    ];
  }, [activeTab, chartData, tab]);

  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-4 gap-1 rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl">
        {TABS.map((item) => {
          const TabIcon = item.icon;
          const active = item.key === activeTab;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold leading-none transition-all duration-200 sm:gap-1.5 sm:px-3 sm:text-sm',
                active ? item.activeClass : item.inactiveClass
              )}
            >
              <TabIcon className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
              <span className="min-w-0 truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight tabular-nums">
              <Money amount={totalTracked} currency={currency} />
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {tab.label} of <Money amount={totalPlanned} currency={currency} compact />
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">{totalRemaining >= 0 ? 'Left' : 'Over'}</p>
            <p className={`text-sm font-bold tabular-nums ${totalRemaining < 0 ? 'text-red-600' : 'text-foreground'}`}>
              <Money amount={Math.abs(totalRemaining)} currency={currency} compact />
            </p>
          </div>
        </div>

        <div className="relative mx-auto mt-4 flex h-52 w-full max-w-[280px] items-center justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={66}
                outerRadius={92}
                paddingAngle={donutChartData.length > 1 ? 3 : 0}
                stroke="none"
                isAnimationActive
              >
                {donutChartData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={chartData.length > 0 ? entry.color : '#E5E7EB'}
                    stroke="none"
                    tabIndex={-1}
                    focusable="false"
                    style={{ outline: 'none' }}
                  />
                ))}
              </Pie>

              <Tooltip
                content={<DonutTooltip currency={currency} tab={tab} />}
                cursor={false}
                offset={12}
                wrapperStyle={{ outline: 'none', zIndex: 30, pointerEvents: 'none' }}
                allowEscapeViewBox={{ x: false, y: false }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {tab.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wide">
            {activeTab === 'savings' ? 'Savings & Goals Breakdown' : `${tab.title} Breakdown`}
          </h3>
        </div>

        <div className="divide-y divide-border/50">
          {chartData.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No {tab.title.toLowerCase()} data yet
            </div>
          ) : (
            chartData.map((item) => (
              <ReadOnlyBreakdownRow key={item.id} item={item} currency={currency} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Plan() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const monthFromUrl = searchParams.get('month');

  const [currentMonth, setCurrentMonth] = useState(monthFromUrl || format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('expense');

  const currency = useCurrency();
  const formatCurrency = useCurrencyFormatter();

  const budget = useBudgetSummary(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);

  const allSubs = useMemo(() => categories.filter((c) => c.parent_id), [categories]);

  const plannedTotals = useMemo(() => {
    const totals = {
      income: Number(budget.totalPlannedIncome || 0),
      expense: Number(budget.totalPlannedExpenses || 0),
      savings: Number(budget.totalPlannedSavings || 0),
      debt: Number(budget.totalPlannedDebt || 0),
    };

    allocations.forEach((allocation) => {
      const sourceType = getAllocationSourceType(allocation);
      if (sourceType === 'category' || allocation.category_id) return;

      const type = normalizeType(allocation.budget_type);
      totals[type] += Number(allocation.planned_amount || 0);
    });

    return totals;
  }, [allocations, budget.totalPlannedDebt, budget.totalPlannedExpenses, budget.totalPlannedIncome, budget.totalPlannedSavings]);

  const leftToAllocate =
    plannedTotals.income - plannedTotals.expense - plannedTotals.savings - plannedTotals.debt;

  const handleMonthChange = (month) => {
    setCurrentMonth(month);
    const params = new URLSearchParams(location.search);
    params.set('month', month);
    navigate(`/plan?${params.toString()}`, { replace: true });
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Plan"
        subtitle={`Give every ${getCurrencyName(currency)} a purpose`}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 md:px-6 lg:py-8">
        <div className="mb-4 animate-child">
          <div className="flex items-center justify-center">
            <MonthSelector
              currentMonth={currentMonth}
              onChange={handleMonthChange}
              subtitle="Budget period"
              trailingAction={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl"
                  onClick={() => navigate(`/manage-plan?tab=monthly-plan&month=${currentMonth}`)}
                  aria-label="Manage monthly plan"
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>

        <div className="animate-child space-y-4 pt-4">
          <LeftToAllocateBanner
            leftToAllocate={leftToAllocate}
            totalIncome={plannedTotals.income}
            isEditMode={false}
            formatCurrency={formatCurrency}
            sticky={false}
          />

          <PlanOverview
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categories={categories}
            subcategories={allSubs}
            budget={budget}
            currency={currency}
            allocations={allocations}
            recurringTransactions={recurringTransactions}
            savingsGoals={savingsGoals}
          />
        </div>
      </main>
    </div>
  );
}
