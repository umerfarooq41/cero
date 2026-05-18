import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, subMonths, addMonths } from 'date-fns';
import {
  PencilLine,
  Copy,
  X,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { budgetPlansApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import PageHeader from '@/components/layout/PageHeader';
import UnifiedCategorySection from '@/components/plan/UnifiedCategorySection';
import CategoryIconBadge from '@/components/shared/CategoryIcon';
import {
  useBudgetSummary,
  useAllocations,
  useCategories,
} from '@/hooks/useBudgetData';

import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import { useCurrency, useCurrencyFormatter } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencyNoun as getSharedCurrencyNoun,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';

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

function PlanOverview({
  activeTab,
  setActiveTab,
  categories,
  subcategories,
  budget,
  currency,
}) {
  const tab = TABS.find((t) => t.key === activeTab) || TABS[0];

  const sectionCategories = categories.filter(
    (c) => c.type === activeTab && !c.parent_id
  );

  const chartData = sectionCategories
    .map((category, index) => {
      const childCategories = subcategories.filter(
        (s) => s.parent_id === category.id
      );

      const planned =
        childCategories.length > 0
          ? childCategories.reduce(
              (sum, child) =>
                sum + Number(budget.getCategoryPlanned(child.id) || 0),
              0
            )
          : Number(budget.getCategoryPlanned(category.id) || 0);

      const tracked =
        childCategories.length > 0
          ? childCategories.reduce(
              (sum, child) =>
                sum + Number(budget.getCategorySpent(child.id) || 0),
              0
            )
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
      };
    })
    .filter((item) => item.planned > 0 || item.tracked > 0);

  const totalTracked = chartData.reduce((sum, item) => sum + item.tracked, 0);
  const totalPlanned = chartData.reduce((sum, item) => sum + item.planned, 0);
  const totalRemaining = totalPlanned - totalTracked;

  const progress =
    totalPlanned > 0 ? Math.min((totalTracked / totalPlanned) * 100, 100) : 0;

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
      color: tab.shades[index],
      value: Math.max(Number(item.tracked || 0) || Number(item.planned || 0), 0.01),
    }));

    const others = sorted.slice(4);

    if (others.length === 0) return topFour;

    const othersTracked = others.reduce(
      (sum, item) => sum + Number(item.tracked || 0),
      0
    );
    const othersPlanned = others.reduce(
      (sum, item) => sum + Number(item.planned || 0),
      0
    );

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
              {tab.label} of{' '}
              <Money amount={totalPlanned} currency={currency} compact />
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {totalRemaining >= 0 ? 'Left' : 'Over'}
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${
                totalRemaining < 0 ? 'text-red-600' : 'text-foreground'
              }`}
            >
              <Money
                amount={Math.abs(totalRemaining)}
                currency={currency}
                compact
              />
            </p>
          </div>
        </div>

        <div className="relative mx-auto mt-4 flex h-52 w-full max-w-[280px] items-center justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-sector]:outline-none">
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
                wrapperStyle={{
                  outline: 'none',
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
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
            {tab.title} Breakdown
          </h3>
        </div>

        <div className="divide-y">
          {chartData.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No {tab.title.toLowerCase()} data yet
            </div>
          ) : (
            chartData.map((item) => {
              const percent =
                item.planned > 0
                  ? Math.min((item.tracked / item.planned) * 100, 100)
                  : 0;

              return (
                <div key={item.id} className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <CategoryIconBadge
                      icon={item.category?.icon}
                      color={item.categoryColor || item.color}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {item.name}
                        </p>

                        <p className="shrink-0 text-sm font-bold tabular-nums">
                          <Money
                            amount={item.tracked}
                            currency={currency}
                            compact
                          />
                        </p>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            backgroundColor:
                              item.remaining < 0 ? '#DC2626' : item.color,
                          }}
                        />
                      </div>

                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                        <span>
                          {formatNumber(item.tracked)} /{' '}
                          {formatNumber(item.planned)}
                        </span>

                        <span
                          className={
                            item.remaining < 0
                              ? 'font-medium text-red-600'
                              : ''
                          }
                        >
                          {item.remaining >= 0
                            ? `${formatNumber(item.remaining)} left`
                            : `${formatNumber(Math.abs(item.remaining))} over`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
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

  const [currentMonth, setCurrentMonth] = useState(
    monthFromUrl || format(new Date(), 'yyyy-MM')
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');

  const queryClient = useQueryClient();
  const currency = useCurrency();
  const formatCurrency = useCurrencyFormatter();

  const budget = useBudgetSummary(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);

  const prevMonth = format(
    subMonths(new Date(currentMonth + '-01'), 1),
    'yyyy-MM'
  );

  const { data: prevAllocations = [] } = useAllocations(prevMonth);

  const enterEditMode = useCallback(() => {
    const initial = {};

    allocations.forEach((a) => {
      initial[a.category_id] = a.planned_amount || 0;
    });

    categories.forEach((c) => {
      if (!(c.id in initial)) initial[c.id] = 0;
    });

    setEditValues(initial);
    setIsEditMode(true);
  }, [allocations, categories]);

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditValues({});
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const existing = {};

      allocations.forEach((a) => {
        existing[a.category_id] = a;
      });

      const promises = Object.entries(editValues)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([catId, amount]) =>
          budgetPlansApi.upsert({
            id: existing[catId]?.id,
            category_id: catId,
            month: currentMonth,
            planned_amount: Number(amount),
          })
        );

      await Promise.all(promises);

      queryClient.invalidateQueries();
      setIsEditMode(false);
      setEditValues({});
      toast.success('Plan saved');
    } catch (error) {
      console.error('Plan save failed:', error);
      toast.error(error.message || 'Could not save plan');
    } finally {
      setSaving(false);
    }
  };

  const copyFromPrev = () => {
    const newValues = { ...editValues };

    prevAllocations.forEach((a) => {
      newValues[a.category_id] = a.planned_amount || 0;
    });

    setEditValues(newValues);
    toast.success('Copied from last month');
  };

  const onEditChange = useCallback((catId, value) => {
    setEditValues((prev) => ({
      ...prev,
      [catId]: Number(value || 0),
    }));
  }, []);

  const sumEditType = (type) => {
    return categories
      .filter((c) => c.type === type)
      .reduce((sum, c) => {
        const subs = categories.filter((s) => s.parent_id === c.id);

        if (subs.length > 0 && !c.parent_id) return sum;

        return sum + Number(editValues[c.id] || 0);
      }, 0);
  };

  const editTotalIncome = isEditMode
    ? sumEditType('income')
    : budget.totalPlannedIncome;

  const editTotalExpenses = isEditMode ? sumEditType('expense') : 0;
  const editTotalSavings = isEditMode ? sumEditType('savings') : 0;
  const editTotalDebt = isEditMode ? sumEditType('debt') : 0;

  const leftToAllocate = isEditMode
    ? editTotalIncome - editTotalExpenses - editTotalSavings - editTotalDebt
    : budget.leftToAllocate;

  const totalIncomeDisplay = isEditMode ? editTotalIncome : budget.totalIncome;

  const prevValuesMap = {};

  prevAllocations.forEach((a) => {
    prevValuesMap[a.category_id] = a.planned_amount || 0;
  });

  const allSubs = useMemo(
    () => categories.filter((c) => c.parent_id),
    [categories]
  );

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income' && !c.parent_id),
    [categories]
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense' && !c.parent_id),
    [categories]
  );

  const savingsCategories = useMemo(
    () => categories.filter((c) => c.type === 'savings' && !c.parent_id),
    [categories]
  );

  const debtCategories = useMemo(
    () => categories.filter((c) => c.type === 'debt' && !c.parent_id),
    [categories]
  );

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Plan"
        subtitle={`Give every ${getCurrencyName(currency)} a purpose`}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 md:px-6 lg:py-8">
        <div className="mb-4 animate-child">
          <AnimatePresence mode="wait">
            {isEditMode ? (
              <motion.div
                key="edit-header"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-2 shadow-sm backdrop-blur-xl"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  className="gap-1.5 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>

                <span className="text-sm font-semibold">Edit Plan</span>

                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="read-header"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center justify-center">
                  <div className="flex w-full max-w-md items-center rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl"
                      onClick={() =>
                        setCurrentMonth(
                          format(
                            subMonths(new Date(`${currentMonth}-01`), 1),
                            'yyyy-MM'
                          )
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <button
                      type="button"
                      className="flex flex-1 flex-col items-center justify-center rounded-xl px-3 py-1.5 hover:bg-secondary/60"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {format(new Date(`${currentMonth}-01`), 'MMMM yyyy')}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Budget period
                      </span>
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl"
                      onClick={() =>
                        setCurrentMonth(
                          format(
                            addMonths(new Date(`${currentMonth}-01`), 1),
                            'yyyy-MM'
                          )
                        )
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="icon"
                      className="ml-1 h-9 w-9 shrink-0 rounded-xl"
                      onClick={() => navigate(`/edit-plan?month=${currentMonth}`)}
                    >
                      <PencilLine className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="animate-child space-y-4 pt-4"
        >
          <LeftToAllocateBanner
            leftToAllocate={leftToAllocate}
            totalIncome={totalIncomeDisplay}
            isEditMode={isEditMode}
            formatCurrency={formatCurrency}
            />

          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex justify-end overflow-hidden"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyFromPrev}
                  className="gap-2 text-xs"
                >
                  <Copy className="h-4 w-4" />
                  Copy from last month
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {isEditMode ? (
            <>
              {[
                ['Income', incomeCategories],
                ['Expenses', expenseCategories],
                ['Savings', savingsCategories],
                ['Debt', debtCategories],
              ].map(([title, sectionCategories]) => (
                <UnifiedCategorySection
                  key={title}
                  title={title}
                  categories={sectionCategories}
                  subcategories={allSubs}
                  isEditMode={isEditMode}
                  getCategorySpent={budget.getCategorySpent}
                  getCategoryPlanned={budget.getCategoryPlanned}
                  editValues={editValues}
                  onEditChange={onEditChange}
                  prevValues={prevValuesMap}
                  currency={currency}
                  formatCurrency={formatCurrency}
                />
              ))}
            </>
          ) : (
            <PlanOverview
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              categories={categories}
              subcategories={allSubs}
              budget={budget}
              currency={currency}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}