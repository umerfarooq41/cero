import { useState, useCallback, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import {
  PencilLine,
  Copy,
  X,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CreditCard,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { budgetPlansApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import MonthSelector from '@/components/shared/MonthSelector';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import UnifiedCategorySection from '@/components/plan/UnifiedCategorySection';

import {
  useBudgetSummary,
  useAllocations,
  useCategories,
} from '@/hooks/useBudgetData';

import { useCurrency, useCurrencyFormatter } from '@/hooks/useCurrency';

const TABS = [
  {
    key: 'income',
    title: 'Income',
    label: 'received',
    color: '#16A34A',
    bg: 'bg-green-50',
    text: 'text-green-700',
    ring: 'ring-green-200',
    icon: ArrowUpRight,
    shades: ['#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC'],
  },
  {
    key: 'expense',
    title: 'Expenses',
    label: 'spent',
    color: '#DC2626',
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
    icon: ArrowDownRight,
    shades: ['#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171'],
  },
  {
    key: 'savings',
    title: 'Savings',
    label: 'saved',
    color: '#2563EB',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
    icon: PiggyBank,
    shades: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA'],
  },
  {
    key: 'debt',
    title: 'Debt',
    label: 'paid',
    color: '#7C3AED',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    ring: 'ring-purple-200',
    icon: CreditCard,
    shades: ['#581C87', '#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA'],
  },
];

const formatNumber = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
};

const getCurrencyCode = (currency) => {
  if (typeof currency === 'string') return currency;
  return currency?.code || currency?.currency || 'SAR';
};

const getCurrencySymbol = (currency) => {
  const code = getCurrencyCode(currency);

  if (code === 'SAR') return 'SAR';

  const map = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    PKR: 'Rs',
    AED: 'د.إ',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: 'ر.ع.',
  };

  return currency?.symbol || map[code] || code;
};

function Money({ amount, currency, compact = false, className = '' }) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {code === 'SAR' ? (
        <img
          src="/sar.svg"
          alt="SAR"
          className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}
      <span>{formatNumber(amount)}</span>
    </span>
  );
}

function CategoryIcon({ category, color }) {
  const icon = category?.icon || category?.icon_name || category?.iconName;

  if (!icon) return <span className="text-sm">•</span>;

  if (typeof icon === 'function') {
    const Icon = icon;
    return <Icon className="h-4 w-4" style={{ color }} />;
  }

  if (typeof icon === 'object' && icon?.render) {
    const Icon = icon;
    return <Icon className="h-4 w-4" style={{ color }} />;
  }

  return <span className="text-base leading-none">{icon}</span>;
}

function DonutTooltip({ active, payload, currency, tab }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  const tracked = Number(item?.tracked || 0);
  const planned = Number(item?.planned || 0);
  const percent = planned > 0 ? Math.round((tracked / planned) * 100) : 0;

  return (
    <div className="rounded-2xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-sm font-semibold">{item?.name}</p>
      <div className="mt-1 flex items-center justify-between gap-5 text-xs text-muted-foreground">
        <span>{tab.label}</span>
        <Money amount={tracked} currency={currency} compact />
      </div>
      <p className="mt-1 text-xs font-medium" style={{ color: item?.color }}>
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
      };
    })
    .filter((item) => item.planned > 0 || item.tracked > 0);

  const totalTracked = chartData.reduce((sum, item) => sum + item.tracked, 0);
  const totalPlanned = chartData.reduce((sum, item) => sum + item.planned, 0);
  const totalRemaining = totalPlanned - totalTracked;

  const progress =
    totalPlanned > 0 ? Math.min((totalTracked / totalPlanned) * 100, 100) : 0;

  const pieData =
    chartData.length > 0
      ? chartData.map((item) => ({
          ...item,
          value: Math.max(item.tracked, 0.01),
        }))
      : [
          {
            name: 'No data',
            value: 1,
            tracked: 0,
            planned: 0,
            color: '#E5E7EB',
          },
        ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1 rounded-[1.75rem] bg-muted/60 p-1.5">
        {TABS.map((item) => {
          const TabIcon = item.icon;
          const active = item.key === activeTab;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[1.25rem] px-1.5 text-[11px] font-semibold transition ${
                active
                  ? `${item.bg} ${item.text} shadow-sm ring-1 ${item.ring}`
                  : 'text-muted-foreground hover:bg-background/70'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span className="leading-none">{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-[2rem] border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
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
              className={`text-sm font-bold ${
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

        <div className="relative mx-auto mt-4 h-52 max-w-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={66}
                outerRadius={92}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                stroke="none"
                isAnimationActive
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={chartData.length > 0 ? entry.color : '#E5E7EB'}
                  />
                ))}
              </Pie>

              <Tooltip
                content={
                  <DonutTooltip
                    currency={currency}
                    tab={tab}
                  />
                }
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {tab.label}
            </p>
            <p className="mt-1 text-xl font-bold">
              <Money amount={totalTracked} currency={currency} compact />
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
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
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: `${item.color}18`,
                        color: item.color,
                      }}
                    >
                      <CategoryIcon category={item.category} color={item.color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {item.name}
                        </p>

                        <p className="shrink-0 text-sm font-bold">
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

                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
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
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
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
    <div className="max-w-3xl mx-auto px-4 pb-28">
      <div className="sticky top-0 z-30 pt-6 pb-2 bg-background/95 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          {isEditMode ? (
            <motion.div
              key="edit-header"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between"
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

              <h1 className="text-base font-semibold">Edit Plan</h1>

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
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Monthly budget · {getCurrencyCode(currency)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <MonthSelector
                  currentMonth={currentMonth}
                  onChange={setCurrentMonth}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={enterEditMode}
                >
                  <PencilLine className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="space-y-4 pt-4"
      >
        <LeftToAllocateBanner
          leftToAllocate={leftToAllocate}
          totalIncome={totalIncomeDisplay}
          isEditMode={isEditMode}
          currency={currency}
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
                <Copy className="w-3.5 h-3.5" />
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

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-0 right-0 px-4 z-40 max-w-3xl mx-auto"
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 text-sm font-semibold gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Plan'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}