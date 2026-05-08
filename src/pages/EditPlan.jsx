import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { Check, AlertTriangle, Copy } from 'lucide-react';
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
    allocations.forEach(a => {
      initial[a.category_id] = a.planned_amount || 0;
    });
    setValues(initial);
  }, [allocations]);

  const setValue = (catId, amount) => {
    setValues(prev => ({ ...prev, [catId]: amount }));
  };

  const getLeafCategories = (type) => {
    const parents = categories.filter(c => c.type === type && !c.parent_id);
    const result = [];

    parents.forEach(p => {
      const subs = categories.filter(c => c.parent_id === p.id);

      if (subs.length > 0) {
        result.push({ ...p, isSectionHeader: true });
        subs.forEach(s => result.push({ ...s, isSubcategory: true }));
      } else {
        result.push(p);
      }
    });

    return result;
  };

  const sumType = (type) => {
    return categories
      .filter(c => c.type === type)
      .reduce((sum, c) => {
        const subs = categories.filter(s => s.parent_id === c.id);
        if (subs.length > 0 && !c.parent_id) return sum;
        return sum + (values[c.id] || 0);
      }, 0);
  };

  const totalIncome = sumType('income');
  const totalExpenses = sumType('expense');
  const totalSavings = sumType('savings');
  const totalDebt = sumType('debt');
  const leftToAllocate = totalIncome - totalExpenses - totalSavings - totalDebt;

  const copyFromPrev = () => {
    const newValues = {};
    prevAllocations.forEach(a => {
      newValues[a.category_id] = a.planned_amount || 0;
    });
    setValues(newValues);
    toast.success('Copied from previous month');
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const existing = {};
      allocations.forEach(a => {
        existing[a.category_id] = a;
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
    const prev = prevAllocations.find(a => a.category_id === catId);
    return prev?.planned_amount || 0;
  };

  const renderSection = (title, type) => {
    const items = getLeafCategories(type);
    if (items.length === 0) return null;

    return (
      <div className="material-card overflow-hidden rounded-[1.25rem] bg-card">
        <div className="border-b border-border/70 px-4 py-3 sm:px-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </h3>
        </div>

        <div className="divide-y divide-border/50">
          {items.map(cat => {
            if (cat.isSectionHeader) {
              return (
                <div key={cat.id} className="flex items-center gap-3 py-2.5 px-4 bg-accent/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
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
                onChange={(v) => setValue(cat.id, v)}
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
    <div className="mx-auto max-w-3xl px-4 py-6 pb-nav sm:px-6 lg:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.01em]">
            Edit Budget
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Allocate every amount</p>
        </div>

        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
      </div>

      <div className="material-card sticky top-3 z-10 mb-5 rounded-[1.25rem] bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Income</div>
            <div className="text-lg font-semibold">{formatCurrency(totalIncome)}</div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-xs text-muted-foreground">Left to Allocate</div>
            <div
              className={cn(
                'flex items-center justify-end gap-1.5 text-lg font-semibold',
                leftToAllocate === 0
                  ? 'text-[hsl(var(--success))]'
                  : leftToAllocate < 0
                    ? 'text-destructive'
                    : 'text-foreground'
              )}
            >
              {leftToAllocate === 0 && <Check className="w-5 h-5" />}
              {leftToAllocate < 0 && <AlertTriangle className="w-4 h-4" />}
              {formatCurrency(leftToAllocate)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={copyFromPrev} className="gap-2 rounded-full text-xs">
          <Copy className="w-3.5 h-3.5" />
          Copy from last month
        </Button>
      </div>

      <div className="space-y-4 mb-8">
        {renderSection('Income', 'income')}
        {renderSection('Expenses', 'expense')}
        {renderSection('Savings', 'savings')}
        {renderSection('Debt', 'debt')}
      </div>

      <Button onClick={handleSave} disabled={saving} className="h-12 w-full rounded-full text-sm font-semibold">
        {saving ? 'Saving...' : 'Save Plan'}
      </Button>
    </div>
  );
}
