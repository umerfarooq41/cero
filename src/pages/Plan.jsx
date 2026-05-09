import { useState, useCallback } from 'react';
import { format, subMonths } from 'date-fns';
import { PencilLine, Copy, X, Save } from 'lucide-react';
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

import { useCurrency } from '@/hooks/useCurrency';

const formatPlanAmount = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(number);
};

export default function Plan() {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

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

  const prevValuesMap = {};

  prevAllocations.forEach((a) => {
    prevValuesMap[a.category_id] = a.planned_amount || 0;
  });

  const allSubs = categories.filter((c) => c.parent_id);

  const incomeCategories = categories.filter(
    (c) => c.type === 'income' && !c.parent_id
  );

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' && !c.parent_id
  );

  const savingsCategories = categories.filter(
    (c) => c.type === 'savings' && !c.parent_id
  );

  const debtCategories = categories.filter(
    (c) => c.type === 'debt' && !c.parent_id
  );

  const savingsSpent = budget.transactions
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return cat?.type === 'savings';
    })
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const debtSpent = budget.transactions
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return cat?.type === 'debt';
    })
    .reduce((s, t) => s + Number(t.amount || 0), 0);

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
                  {format(new Date(currentMonth + '-01'), 'MMMM yyyy')} · {currency?.code || 'SAR'}
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

        <SummaryCards
          budget={budget}
          savingsSpent={savingsSpent}
          debtSpent={debtSpent}
          isEditMode={isEditMode}
          currency={currency}
          formatCurrency={formatPlanAmount}
        />

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
            formatCurrency={formatPlanAmount}
          />
        ))}
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