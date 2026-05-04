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
import { useCategories, useAllocations, formatCurrency } from '@/hooks/useBudgetData';
import { cn } from '@/lib/utils';

export default function EditPlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { data: categories } = useCategories();
  const { data: allocations } = useAllocations(currentMonth);
  const prevMonth = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM');
  const { data: prevAllocations } = useAllocations(prevMonth);
  
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

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
      allocations.forEach(a => { existing[a.category_id] = a; });

      const promises = Object.entries(values).map(([catId, amount]) => budgetPlansApi.upsert({
        id: existing[catId]?.id,
        category_id: catId,
        month: currentMonth,
        planned_amount: amount,
      }));

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        <div className="divide-y divide-border/50">
          {items.map(cat => {
            if (cat.isSectionHeader) {
              return (
                <div key={cat.id} className="flex items-center gap-3 py-2.5 px-4 bg-accent/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">{cat.name}</span>
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
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-32 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Plan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Allocate every dollar</p>
        </div>
        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
      </div>

      {/* Sticky Math Banner */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Income</div>
            <div className="text-lg font-bold">{formatCurrency(totalIncome)}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-muted-foreground">Left to Allocate</div>
            <div className={cn(
              "text-lg font-bold flex items-center gap-1.5 justify-end",
              leftToAllocate === 0 ? "text-[hsl(var(--success))]" : 
              leftToAllocate < 0 ? "text-destructive" : "text-foreground"
            )}>
              {leftToAllocate === 0 && <Check className="w-5 h-5" />}
              {leftToAllocate < 0 && <AlertTriangle className="w-4 h-4" />}
              {formatCurrency(leftToAllocate)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={copyFromPrev} className="gap-2 text-xs">
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

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full h-12 text-sm font-semibold"
      >
        {saving ? 'Saving...' : 'Save Plan'}
      </Button>
    </div>
  );
}
