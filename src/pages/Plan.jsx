import { useState, useCallback, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import {
  PencilLine,
  Copy,
  X,
  Save,
  Wallet,
  Receipt,
  PiggyBank,
  CreditCard,
  CircleDollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { budgetPlansApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import MonthSelector from '@/components/shared/MonthSelector';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';

import {
  useBudgetSummary,
  useAllocations,
  useCategories,
} from '@/hooks/useBudgetData';

import { useCurrency } from '@/hooks/useCurrency';

const COLORS = {
  income: ['#22C55E', '#86EFAC', '#16A34A', '#BBF7D0'],
  expense: ['#E11D48', '#FB7185', '#FDA4AF', '#FFE4E6'],
  savings: ['#2563EB', '#60A5FA', '#93C5FD', '#DBEAFE'],
  debt: ['#6366F1', '#818CF8', '#A5B4FC', '#E0E7FF'],
};

const TABS = [
  { key: 'income', label: 'Income', icon: Wallet },
  { key: 'expense', label: 'Expenses', icon: Receipt },
  { key: 'savings', label: 'Savings', icon: PiggyBank },
  { key: 'debt', label: 'Debt', icon: CreditCard },
];

const formatPlanAmount = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(number);
};

const getCategoryIcon = (category) => {
  return category?.icon || category?.emoji || null;
};

function CategoryIcon({ category, color }) {
  const icon = getCategoryIcon(category);

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {icon ? (
        <span className="text-base leading-none">{icon}</span>
      ) : (
        <CircleDollarSign className="w-4 h-4" />
      )}
    </div>
  );
}

function AllocationTabs({ activeTab, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'h-11 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-card border text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function DonutAllocationCard({
  activeTab,
  rows,
  total,
  currency,
  formatCurrency,
}) {
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label || 'Budget';
  const palette = COLORS[activeTab] || COLORS.expense;

  const chartData =
    rows.length > 0
      ? rows.map((row, index) => ({
          ...row,
          fill: palette[index % palette.length],
        }))
      : [{ name: 'No allocation', value: 1, fill: '#E5E7EB' }];

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold">{activeLabel} Allocation</p>
          <p className="text-xs text-muted-foreground">
            {currency?.code || 'SAR'} {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => [
                `${currency?.code || 'SAR'} ${formatCurrency(value)}`,
                name,
              ]}
            />
            <Pie
              data={chartData}
              innerRadius={62}
              outerRadius={88}
              paddingAngle={rows.length > 1 ? 3 : 0}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted-foreground">{activeLabel}</p>
          <p className="text-xl font-bold">
            {currency?.code || 'SAR'} {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdown({
  activeTab,
  rows,
  total,
  isEditMode,
  editValues,
  onEditChange,
  currency,
  formatCurrency,
}) {
  const palette = COLORS[activeTab] || COLORS.expense;

  return (
    <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Category Breakdown</h2>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm font-medium">No categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add allocations in edit mode.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {rows.map((row, index) => {
            const color = palette[index % palette.length];
            const percent = total > 0 ? Math.round((row.value / total) * 100) : 0;

            return (
              <div key={row.id} className="p-4">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={row.category} color={color} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold truncate">
                        {row.name}
                      </p>

                      {isEditMode ? (
                        <input
                          type="number"
                          value={editValues[row.id] ?? ''}
                          onChange={(e) => onEditChange(row.id, e.target.value)}
                          className="w-24 h-8 rounded-xl border bg-background px-2 text-right text-sm font-semibold"
                        />
                      ) : (
                        <p className="text-sm font-bold whitespace-nowrap">
                          {formatCurrency(row.value)}
                        </p>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {currency?.code || 'SAR'} {formatCurrency(row.spent)} used
                      </p>
                      <p className="text-xs text-muted-foreground">{percent}%</p>
                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {row.children.length > 0 && (
                  <div className="mt-3 ml-12 space-y-2">
                    {row.children.map((child) => {
                      const childValue = child.value;
                      const childPercent =
                        row.value > 0
                          ? Math.round((childValue / row.value) * 100)
                          : 0;

                      return (
                        <div
                          key={child.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-muted-foreground truncate">
                            {child.name}
                          </span>
                          <span className="font-medium whitespace-nowrap">
                            {formatCurrency(childValue)} · {childPercent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Plan() {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('income');

  const queryClient = useQueryClient();
  const currency = useCurrency();

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
      if (!(c.id in initial)) {
        initial[c.id] = 0;
      }
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

        if (subs.length > 0 && !c.parent_id) {
          return sum;
        }

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

  const activeRows = useMemo(() => {
    const parents = categories.filter(
      (c) => c.type === activeTab && !c.parent_id
    );

    return parents
      .map((category) => {
        const children = categories
          .filter((c) => c.parent_id === category.id)
          .map((child) => {
            const planned = isEditMode
              ? Number(editValues[child.id] || 0)
              : Number(budget.getCategoryPlanned(child.id) || 0);

            const spent = Number(budget.getCategorySpent(child.id) || 0);

            return {
              id: child.id,
              name: child.name,
              category: child,
              value: planned,
              spent,
            };
          });

        const childTotal = children.reduce(
          (sum, child) => sum + Number(child.value || 0),
          0
        );

        const ownPlanned = isEditMode
          ? Number(editValues[category.id] || 0)
          : Number(budget.getCategoryPlanned(category.id) || 0);

        const value = children.length > 0 ? childTotal : ownPlanned;

        const spent = Number(budget.getCategorySpent(category.id) || 0);

        return {
          id: category.id,
          name: category.name,
          category,
          value,
          spent,
          children: children.filter((child) => child.value > 0),
        };
      })
      .filter((row) => row.value > 0 || isEditMode);
  }, [activeTab, categories, isEditMode, editValues, budget]);

  const activeTotal = activeRows.reduce(
    (sum, row) => sum + Number(row.value || 0),
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      <div className="sticky top-0 z-30 pt-6 pb-3 bg-background/95 backdrop-blur-sm">
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

              <div className="text-center">
                <h1 className="text-base font-semibold">Edit Plan</h1>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(currentMonth + '-01'), 'MMMM yyyy')} ·{' '}
                  {currency?.code || 'SAR'}
                </p>
              </div>

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
              className="flex items-center justify-between gap-3"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Monthly budget · {currency?.code || 'SAR'}
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
          formatCurrency={formatPlanAmount}
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

        <AllocationTabs activeTab={activeTab} onChange={setActiveTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <DonutAllocationCard
              activeTab={activeTab}
              rows={activeRows}
              total={activeTotal}
              currency={currency}
              formatCurrency={formatPlanAmount}
            />

            <CategoryBreakdown
              activeTab={activeTab}
              rows={activeRows}
              total={activeTotal}
              isEditMode={isEditMode}
              editValues={editValues}
              onEditChange={onEditChange}
              currency={currency}
              formatCurrency={formatPlanAmount}
            />
          </motion.div>
        </AnimatePresence>
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