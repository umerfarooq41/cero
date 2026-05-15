import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, subMonths, addMonths } from 'date-fns';
import {
  Copy,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { budgetPlansApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import AllocationRow from '@/components/editplan/AllocationRow';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { useCategories, useAllocations } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

export default function EditPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(location.search);
  const monthFromUrl = searchParams.get('month');

  const [currentMonth, setCurrentMonth] = useState(
    monthFromUrl || format(new Date(), 'yyyy-MM')
  );

  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);

  const prevMonth = format(
    subMonths(new Date(`${currentMonth}-01`), 1),
    'yyyy-MM'
  );

  const { data: prevAllocations = [] } = useAllocations(prevMonth);

  useEffect(() => {
    const initial = {};

    allocations.forEach((a) => {
      initial[a.category_id] = a.planned_amount || 0;
    });

    categories.forEach((category) => {
      if (!(category.id in initial)) {
        initial[category.id] = 0;
      }
    });

    setValues(initial);
  }, [allocations, categories]);

  const changeMonth = (nextMonth) => {
    setCurrentMonth(nextMonth);
    navigate(`/edit-plan?month=${nextMonth}`, { replace: true });
  };

  const goToPreviousMonth = () => {
    changeMonth(
      format(subMonths(new Date(`${currentMonth}-01`), 1), 'yyyy-MM')
    );
  };

  const goToNextMonth = () => {
    changeMonth(format(addMonths(new Date(`${currentMonth}-01`), 1), 'yyyy-MM'));
  };

  const setValue = (catId, amount) => {
    setValues((prev) => ({
      ...prev,
      [catId]: Number(amount || 0),
    }));
  };

  const getLeafCategories = (type) => {
    const parents = categories.filter((c) => c.type === type && !c.parent_id);
    const result = [];

    parents.forEach((parent) => {
      const subs = categories.filter((c) => c.parent_id === parent.id);

      if (subs.length > 0) {
        result.push({
          ...parent,
          isSectionHeader: true,
          subCount: subs.length,
          sectionTotal: subs.reduce(
            (sum, sub) => sum + Number(values[sub.id] || 0),
            0
          ),
        });

        subs.forEach((sub) =>
          result.push({
            ...sub,
            isSubcategory: true,
          })
        );
      } else {
        result.push(parent);
      }
    });

    return result;
  };

  const sumType = (type) => {
    return categories
      .filter((c) => c.type === type)
      .reduce((sum, category) => {
        const subs = categories.filter((s) => s.parent_id === category.id);

        if (subs.length > 0 && !category.parent_id) return sum;

        return sum + Number(values[category.id] || 0);
      }, 0);
  };

  const totalIncome = sumType('income');
  const totalExpenses = sumType('expense');
  const totalSavings = sumType('savings');
  const totalDebt = sumType('debt');

  const totalPlanned = totalExpenses + totalSavings + totalDebt;
  const leftToAllocate = totalIncome - totalPlanned;


  const copyFromPrev = () => {
    const newValues = { ...values };

    prevAllocations.forEach((allocation) => {
      newValues[allocation.category_id] = allocation.planned_amount || 0;
    });

    setValues(newValues);
    toast.success('Copied from previous month');
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const existing = {};

      allocations.forEach((allocation) => {
        existing[allocation.category_id] = allocation;
      });

      const promises = Object.entries(values).map(([catId, amount]) =>
        budgetPlansApi.upsert({
          id: existing[catId]?.id,
          category_id: catId,
          month: currentMonth,
          planned_amount: Number(amount || 0),
        })
      );

      await Promise.all(promises);

      queryClient.invalidateQueries();
      toast.success('Plan saved');
      navigate(`/?month=${currentMonth}`);
    } catch (error) {
      console.error('Plan save failed:', error);
      toast.error(error.message || 'Could not save plan');
    } finally {
      setSaving(false);
    }
  };

  const getHint = (catId) => {
    const prev = prevAllocations.find((a) => a.category_id === catId);
    return prev?.planned_amount || 0;
  };

  const sectionStyles = {
    income: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    },
    expense: {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 dark:bg-red-400/10',
    },
    savings: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    },
    debt: {
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 dark:bg-purple-400/10',
    },
  };

  const toggleSection = (type) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const renderSection = (title, type) => {
    const items = getLeafCategories(type);
    if (items.length === 0) return null;

    const isCollapsed = collapsedSections[type];
    const style = sectionStyles[type] || sectionStyles.expense;
    const total = sumType(type);

    return (
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(type)}
          className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-white/20 dark:hover:bg-white/[0.03]"
        >
<div className="flex min-w-0 items-center gap-3">
  
  {/* Collapse Icon */}
  <span
    className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
      style.bg,
      style.text
    )}
  >
    {isCollapsed ? (
      <ChevronRight className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )}
  </span>

  {/* Title */}
  <h3
    className={cn(
      'text-base font-bold tracking-tight',
      style.text
    )}
  >
    {title}
  </h3>

  {/* Count Circle */}
  <div
    className={cn(
      'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
      style.bg,
      style.text
    )}
  >
    {items.filter((item) => !item.isSectionHeader).length}
  </div>
</div>

          <div
className={cn(
  'shrink-0 text-right text-base font-bold tracking-tight tabular-nums',
  style.text
)}
          >
            {formatCurrency(total)}
          </div>
        </button>

        {!isCollapsed && (
          <div className="divide-y divide-border/50">
            {items.map((cat) => {
              if (cat.isSectionHeader) {
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 bg-white/20 px-4 py-3 dark:bg-white/[0.02]"
                  >
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {cat.name}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-sm font-bold tracking-tight text-foreground tabular-nums">
                      {formatCurrency(cat.sectionTotal || 0)}
                    </div>
                  </div>
                );
              }

              return (
                <AllocationRow
                  key={cat.id}
                  category={cat}
                  value={values[cat.id]}
                  lastMonthHint={getHint(cat.id)}
                  onChange={(value) => setValue(cat.id, value)}
                  isSubcategory={cat.isSubcategory}
                  formatCurrency={formatCurrency}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Edit Plan"
        subtitle={`Adjust your ${format(
          new Date(`${currentMonth}-01`),
          'MMMM yyyy'
        )} budget plan`}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 lg:py-8">
        <div className="mb-4">
          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-md items-center rounded-2xl border border-white/40 dark:border-white/[0.05] surface-card card-elevated p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                onClick={goToPreviousMonth}
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
                  Editing budget period
                </span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-1 h-9 w-9 shrink-0 rounded-xl text-muted-foreground"
                onClick={() => navigate(`/?month=${currentMonth}`)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <LeftToAllocateBanner
          leftToAllocate={leftToAllocate}
          totalIncome={totalIncome}
          isEditMode = {false}
          formatCurrency={formatCurrency}
        />

        <div className="mt-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={copyFromPrev}
            className="gap-2 rounded-xl text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy from last month
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>

        <div className="space-y-4">
          {renderSection('Income', 'income')}
          {renderSection('Expenses', 'expense')}
          {renderSection('Savings', 'savings')}
          {renderSection('Debt', 'debt')}
        </div>
      </main>
    </div>
  );
}