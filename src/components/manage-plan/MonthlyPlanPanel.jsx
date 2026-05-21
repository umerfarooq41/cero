import { useEffect, useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ChevronDown, Copy, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import AllocationRow from '@/components/editplan/AllocationRow';
import CategoryIcon from '@/components/shared/CategoryIcon';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import { Button } from '@/components/ui/button';
import { budgetPlansApi } from '@/lib/budgetData';
import { useAllocations, useCategories } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

const sectionConfig = {
  income: {
    title: 'Income',
    text: 'text-green-700 dark:text-green-400',
  },
  expense: {
    title: 'Expenses',
    text: 'text-red-700 dark:text-red-400',
  },
  savings: {
    title: 'Savings',
    text: 'text-blue-700 dark:text-blue-400',
  },
  debt: {
    title: 'Debt',
    text: 'text-purple-700 dark:text-purple-400',
  },
};

export default function MonthlyPlanPanel({ currentMonth }) {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);

  const prevMonth = format(
    subMonths(new Date(`${currentMonth}-01T00:00:00`), 1),
    'yyyy-MM'
  );
  const { data: prevAllocations = [] } = useAllocations(prevMonth);

  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const initial = {};

    allocations.forEach((allocation) => {
      initial[allocation.category_id] = allocation.planned_amount || 0;
    });

    categories.forEach((category) => {
      if (!(category.id in initial)) {
        initial[category.id] = 0;
      }
    });

    setValues(initial);
  }, [allocations, categories]);

  const getLeafCategories = (type) => {
    const parents = categories.filter((c) => c.type === type && !c.parent_id);
    const result = [];

    parents.forEach((parent) => {
      const subs = categories.filter((c) => c.parent_id === parent.id);

      if (subs.length > 0) {
        result.push({
          ...parent,
          isSectionHeader: true,
          sectionTotal: subs.reduce(
            (sum, sub) => sum + Number(values[sub.id] || 0),
            0
          ),
        });

        subs.forEach((sub) => {
          result.push({
            ...sub,
            isSubcategory: true,
            parentColor: parent.color,
          });
        });
      } else {
        result.push(parent);
      }
    });

    return result;
  };

  const sumType = (type) => {
    return categories
      .filter((category) => category.type === type)
      .reduce((sum, category) => {
        const subs = categories.filter((sub) => sub.parent_id === category.id);

        if (subs.length > 0 && !category.parent_id) return sum;

        return sum + Number(values[category.id] || 0);
      }, 0);
  };

  const totals = useMemo(() => {
    const totalIncome = sumType('income');
    const totalExpenses = sumType('expense');
    const totalSavings = sumType('savings');
    const totalDebt = sumType('debt');

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalDebt,
      leftToAllocate: totalIncome - totalExpenses - totalSavings - totalDebt,
    };
  }, [categories, values]);

  const getHint = (categoryId) => {
    return prevAllocations.find((a) => a.category_id === categoryId)?.planned_amount || 0;
  };

  const setValue = (categoryId, amount) => {
    setValues((current) => ({
      ...current,
      [categoryId]: Number(amount || 0),
    }));
  };

  const copyFromPreviousMonth = () => {
    const nextValues = { ...values };

    prevAllocations.forEach((allocation) => {
      nextValues[allocation.category_id] = allocation.planned_amount || 0;
    });

    setValues(nextValues);
    toast.success('Copied from previous month');
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const existingByCategory = {};
      allocations.forEach((allocation) => {
        existingByCategory[allocation.category_id] = allocation;
      });

      await Promise.all(
        Object.entries(values).map(([categoryId, plannedAmount]) =>
          budgetPlansApi.upsert({
            id: existingByCategory[categoryId]?.id,
            category_id: categoryId,
            month: currentMonth,
            planned_amount: Number(plannedAmount || 0),
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['all-allocations'] });
      toast.success('Monthly plan saved');
    } catch (error) {
      console.error('Monthly plan save failed:', error);
      toast.error(error.message || 'Could not save monthly plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (type) => {
    setCollapsedSections((current) => ({
      ...current,
      [type]: !current[type],
    }));
  };

  const renderSection = (type) => {
    const config = sectionConfig[type];
    const items = getLeafCategories(type);
    if (!items.length) return null;

    const isCollapsed = collapsedSections[type];
    const total = sumType(type);
    const count = items.filter((item) => !item.isSectionHeader).length;

    return (
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
        <button
          type="button"
          onClick={() => toggleSection(type)}
          className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-5 py-3.5 text-left transition-colors hover:bg-accent/30"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isCollapsed && '-rotate-90'
              )}
            />
            <h3 className={cn('text-sm font-semibold', config.text)}>
              {config.title}
            </h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          </div>

          <div className={cn('shrink-0 text-right text-sm font-semibold tabular-nums', config.text)}>
            {formatCurrency(total)}
          </div>
        </button>

        {!isCollapsed && (
          <div className="divide-y divide-border/50">
            {items.map((category) => {
              if (category.isSectionHeader) {
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 bg-white/20 px-4 py-3 dark:bg-white/[0.02]"
                  >
                    <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {category.name}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-bold tabular-nums">
                      {formatCurrency(category.sectionTotal || 0)}
                    </div>
                  </div>
                );
              }

              return (
                <AllocationRow
                  key={category.id}
                  category={category}
                  value={values[category.id]}
                  lastMonthHint={getHint(category.id)}
                  onChange={(value) => setValue(category.id, value)}
                  isSubcategory={category.isSubcategory}
                  parentColor={category.parentColor}
                  formatCurrency={formatCurrency}
                />
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-4">
      <LeftToAllocateBanner
        leftToAllocate={totals.leftToAllocate}
        totalIncome={totals.totalIncome}
        isEditMode={true}
        formatCurrency={formatCurrency}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Monthly planned amounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Category structure stays separate. This tab only saves the selected month’s planned values.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyFromPreviousMonth}
            className="gap-2 rounded-xl text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy from previous month
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {renderSection('income')}
        {renderSection('expense')}
        {renderSection('savings')}
        {renderSection('debt')}
      </div>
    </div>
  );
}
