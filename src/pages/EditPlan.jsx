import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { Check, AlertTriangle, Copy, Save } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { budgetPlansApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import MonthSelector from '@/components/shared/MonthSelector';
import AllocationRow from '@/components/editplan/AllocationRow';
import { useCategories, useAllocations } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

export default function EditPlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);

  const prevMonth = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM');
  const { data: prevAllocations = [] } = useAllocations(prevMonth);

  useEffect(() => {
    const initial = {};

    allocations.forEach((a) => {
      initial[a.category_id] = a.planned_amount || 0;
    });

    setValues(initial);
  }, [allocations]);

  const setValue = (catId, amount) => {
    setValues((prev) => ({
      ...prev,
      [catId]: amount,
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

        return sum + (values[category.id] || 0);
      }, 0);
  };

  const totalIncome = sumType('income');
  const totalExpenses = sumType('expense');
  const totalSavings = sumType('savings');
  const totalDebt = sumType('debt');
  const leftToAllocate = totalIncome - totalExpenses - totalSavings - totalDebt;

  const copyFromPrev = () => {
    const newValues = {};

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
          planned_amount: amount,
        })
      );

      await Promise.all(promises);

      queryClient.invalidateQueries();
      toast.success('Plan saved');
      navigate('/');
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

  const renderSection = (title, type) => {
    const items = getLeafCategories(type);
    if (items.length === 0) return null;

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>

        <div className="divide-y divide-border/50">
          {items.map((cat) => {
            if (cat.isSectionHeader) {
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 bg-accent/30 px-4 py-2.5"
                >
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {cat.name}
                  </span>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Edit Plan"
        subtitle={`Adjust your ${format(new Date(currentMonth + '-01'), 'MMMM yyyy')} budget plan`}
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-28 lg:py-8">
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Planning Month
              </p>

              <h2 className="truncate text-lg font-bold tracking-tight">
                {format(new Date(currentMonth + '-01'), 'MMMM yyyy')}
              </h2>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-10 shrink-0 gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <div className="p-3">
            <MonthSelector
              currentMonth={currentMonth}
              onChange={setCurrentMonth}
            />
          </div>
        </div>

        <div className="sticky top-[88px] z-10 mb-6 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Total Income
              </div>

              <div className="text-lg font-bold">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="text-xs text-muted-foreground">
                Left to Allocate
              </div>

              <div
                className={cn(
                  'flex items-center justify-end gap-1.5 text-lg font-bold',
                  leftToAllocate === 0
                    ? 'text-[hsl(var(--success))]'
                    : leftToAllocate < 0
                      ? 'text-destructive'
                      : 'text-foreground'
                )}
              >
                {leftToAllocate === 0 && <Check className="h-5 w-5" />}
                {leftToAllocate < 0 && <AlertTriangle className="h-4 w-4" />}
                {formatCurrency(leftToAllocate)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={copyFromPrev}
            className="gap-2 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy from last month
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