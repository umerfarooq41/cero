import { useState, useCallback } from 'react';
import { format, subMonths } from 'date-fns';
import { Copy, PencilLine, Save, Target, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { budgetPlansApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import MonthSelector from '@/components/shared/MonthSelector';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import SummaryCards from '@/components/plan/SummaryCards';
import UnifiedCategorySection from '@/components/plan/UnifiedCategorySection';
import {
  useBudgetSummary,
  useAllocations,
  useCategories,
} from '@/hooks/useBudgetData';
import { useCurrency, useCurrencyFormatter } from '@/hooks/useCurrency';
import { GlassCard, MoneyAmount, PageHeader, TonePill } from '@/components/shared/Premium';

export default function Plan() {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const currency = useCurrency();
  const formatCurrency = useCurrencyFormatter();

  const budget = useBudgetSummary(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);

  const prevMonth = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM');
  const { data: prevAllocations = [] } = useAllocations(prevMonth);

  const enterEditMode = useCallback(() => {
    const initial = {};
    allocations.forEach((allocation) => {
      initial[allocation.category_id] = allocation.planned_amount || 0;
    });

    categories.forEach((category) => {
      if (!(category.id in initial)) initial[category.id] = 0;
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
      allocations.forEach((allocation) => {
        existing[allocation.category_id] = allocation;
      });

      const promises = Object.entries(editValues)
        .filter(([, amount]) => amount > 0)
        .map(([catId, amount]) =>
          budgetPlansApi.upsert({
            id: existing[catId]?.id,
            category_id: catId,
            month: currentMonth,
            planned_amount: amount,
          })
        );

      await Promise.all(promises);

      queryClient.invalidateQueries();
      setIsEditMode(false);
      setEditValues({});
      toast.success('Budget saved');
    } catch (error) {
      console.error('Budget save failed:', error);
      toast.error(error.message || 'Could not save budget');
    } finally {
      setSaving(false);
    }
  };

  const copyFromPrev = () => {
    const newValues = { ...editValues };
    prevAllocations.forEach((allocation) => {
      newValues[allocation.category_id] = allocation.planned_amount || 0;
    });
    setEditValues(newValues);
    toast.success('Copied from last month');
  };

  const onEditChange = useCallback((catId, value) => {
    setEditValues((prev) => ({ ...prev, [catId]: value }));
  }, []);

  const sumEditType = (type) => {
    return categories
      .filter((category) => category.type === type)
      .reduce((sum, category) => {
        const subs = categories.filter((sub) => sub.parent_id === category.id);
        if (subs.length > 0 && !category.parent_id) return sum;
        return sum + (editValues[category.id] || 0);
      }, 0);
  };

  const editTotalIncome = isEditMode ? sumEditType('income') : budget.totalPlannedIncome;
  const editTotalExpenses = isEditMode ? sumEditType('expense') : 0;
  const editTotalSavings = isEditMode ? sumEditType('savings') : 0;
  const editTotalDebt = isEditMode ? sumEditType('debt') : 0;

  const leftToAllocate = isEditMode
    ? editTotalIncome - editTotalExpenses - editTotalSavings - editTotalDebt
    : budget.leftToAllocate;

  const totalIncomeDisplay = isEditMode ? editTotalIncome : budget.totalIncome;

  const prevValuesMap = {};
  prevAllocations.forEach((allocation) => {
    prevValuesMap[allocation.category_id] = allocation.planned_amount || 0;
  });

  const allSubs = categories.filter((category) => category.parent_id);
  const incomeCategories = categories.filter((category) => category.type === 'income' && !category.parent_id);
  const expenseCategories = categories.filter((category) => category.type === 'expense' && !category.parent_id);
  const savingsCategories = categories.filter((category) => category.type === 'savings' && !category.parent_id);
  const debtCategories = categories.filter((category) => category.type === 'debt' && !category.parent_id);

  const savingsSpent = budget.transactions
    .filter((transaction) => {
      const category = categories.find((item) => item.id === transaction.category_id);
      return category?.type === 'savings';
    })
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  const debtSpent = budget.transactions
    .filter((transaction) => {
      const category = categories.find((item) => item.id === transaction.category_id);
      return category?.type === 'debt';
    })
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  const totalPlanned =
    Number(budget.totalPlannedExpenses || 0) +
    Number(budget.totalPlannedSavings || 0) +
    Number(budget.totalPlannedDebt || 0);
  const totalSpent =
    Number(budget.totalExpenses || 0) + Number(savingsSpent || 0) + Number(debtSpent || 0);
  const healthScore = totalPlanned > 0 ? Math.max(0, Math.round((1 - Math.max(0, totalSpent - totalPlanned) / totalPlanned) * 100)) : 0;
  const isBalanced = Math.abs(leftToAllocate) < 0.01;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-4 pb-nav sm:px-6 sm:pt-5 lg:pt-6">
      <div className="sticky top-0 z-30 -mx-4 border-b border-border/60 bg-background px-4 py-2.5 sm:-mx-6 sm:px-6 lg:rounded-b-[1.5rem]">
        <AnimatePresence mode="wait">
          {isEditMode ? (
            <motion.div
              key="edit-header"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between gap-3"
            >
              <Button variant="ghost" size="sm" onClick={cancelEdit} className="rounded-2xl text-muted-foreground">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <div className="text-center">
                <h1 className="text-base font-bold">Edit Budget</h1>
                <p className="text-xs text-muted-foreground">{format(new Date(currentMonth + '-01'), 'MMMM yyyy')}</p>
              </div>
              <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-2xl">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
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
              <PageHeader
                title="Budget"
                description="Assign the month before the month assigns itself."
                icon={Target}
                actions={
                  <div className="flex items-center gap-2">
                    <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={enterEditMode}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LeftToAllocateBanner
        leftToAllocate={leftToAllocate}
        totalIncome={totalIncomeDisplay}
        isEditMode={isEditMode}
        currency={currency}
        formatCurrency={formatCurrency}
      />

      <GlassCard tone={isBalanced ? 'income' : leftToAllocate < 0 ? 'debt' : 'warning'} className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80">
              {isBalanced ? (
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isBalanced ? 'Budget is balanced' : leftToAllocate < 0 ? 'Budget is over-allocated' : 'Money still needs a job'}
              </p>
              <p className="text-xs text-muted-foreground">
                Health score {healthScore}% based on planned vs actual spending.
              </p>
            </div>
          </div>

          <TonePill tone={isBalanced ? 'income' : leftToAllocate < 0 ? 'debt' : 'warning'}>
            <MoneyAmount>
              {formatCurrency(Math.abs(leftToAllocate))}
            </MoneyAmount>
            {isBalanced ? 'balanced' : leftToAllocate < 0 ? 'over' : 'left'}
          </TonePill>
        </div>
      </GlassCard>

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex justify-end overflow-hidden"
          >
            <Button variant="outline" size="sm" onClick={copyFromPrev} className="rounded-2xl text-xs">
              <Copy className="h-3.5 w-3.5" />
              Copy last month
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <SummaryCards
        budget={budget}
        savingsSpent={savingsSpent}
        debtSpent={debtSpent}
        isEditMode={isEditMode}
        currency={currency}
        formatCurrency={formatCurrency}
      />

      <div className="space-y-4">
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
      </div>

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-0 right-0 z-40 mx-auto max-w-3xl px-4 sm:bottom-28"
          >
            <Button onClick={handleSave} disabled={saving} className="h-12 w-full rounded-full text-sm font-semibold shadow-md">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Budget'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
