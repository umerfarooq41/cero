import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, addMonths, subMonths } from 'date-fns';
import { PencilLine, ChevronLeft, ChevronRight, Settings, WifiOff } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import PlanOverview from '@/components/plan/PlanOverview';
import {
  useAllocations,
  useAllTransactions,
  useBudgetSummary,
  useCategories,
  useGoalContributions,
  useRecurringTransactions,
  useSavingsGoals,
  useTransactions,
} from '@/hooks/useBudgetData';
import { useCurrency, useCurrencyFormatter } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { buildPlanTotals } from '@/lib/planData';
import { getTransactionBudgetMonth } from '@/lib/budgetLogic';

export default function Plan() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const monthFromUrl = searchParams.get('month');

  const [currentMonth, setCurrentMonth] = useState(
    monthFromUrl || format(new Date(), 'yyyy-MM')
  );
  const [activeTab, setActiveTab] = useState('expense');

  const currency = useCurrency();
  const formatCurrency = useCurrencyFormatter();

  const budgetSummary = useBudgetSummary(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);
  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: goalContributions = [] } = useGoalContributions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: recurringTransactions = [] } = useRecurringTransactions();

  const subcategories = useMemo(
    () => categories.filter((category) => category.parent_id),
    [categories]
  );

  // Plan accounting follows the scheduled occurrence month for recurring
  // postings. Transaction History still follows the actual posting date.
  // This lets a late/early payment verify the month it was actually due for.
  const planTransactions = useMemo(() => {
    const byId = new Map();

    allTransactions.forEach((transaction) => {
      const occurrenceMonth = transaction?.recurring_posted_for_date
        ? String(transaction.recurring_posted_for_date).slice(0, 7)
        : null;
      const transactionMonth = String(
        transaction?.date ||
          transaction?.transaction_date ||
          transaction?.created_at ||
          ''
      ).slice(0, 7);
      const incomeBudgetMonth = transaction?.type === 'income'
        ? getTransactionBudgetMonth(transaction)
        : null;
      const effectiveMonth = incomeBudgetMonth || occurrenceMonth || transactionMonth;

      if (effectiveMonth === currentMonth) {
        byId.set(
          transaction.id ||
            `${effectiveMonth}:${transaction.type}:${transaction.amount}:${transaction.account_id || ''}`,
          transaction
        );
      }
    });

    // Keep the month-scoped query as a fallback while avoiding recurring rows
    // whose immutable occurrence belongs to a different Plan month.
    transactions.forEach((transaction) => {
      const occurrenceMonth = transaction?.recurring_posted_for_date
        ? String(transaction.recurring_posted_for_date).slice(0, 7)
        : null;
      const incomeBudgetMonth = transaction?.type === 'income'
        ? getTransactionBudgetMonth(transaction)
        : null;
      if (incomeBudgetMonth && incomeBudgetMonth !== currentMonth) return;
      if (!incomeBudgetMonth && occurrenceMonth && occurrenceMonth !== currentMonth) return;

      byId.set(
        transaction.id ||
          `${currentMonth}:${transaction.type}:${transaction.amount}:${transaction.account_id || ''}`,
        transaction
      );
    });

    return [...byId.values()];
  }, [allTransactions, currentMonth, transactions]);

  const plannedTotals = useMemo(
    () =>
      buildPlanTotals({
        allocations,
        categories,
        savingsGoals,
        recurringTransactions,
        allTransactions,
        transactions: planTransactions,
        currentMonth,
      }),
    [allocations, allTransactions, categories, currentMonth, planTransactions, recurringTransactions, savingsGoals]
  );

  const leftToAllocate = plannedTotals.leftToAllocate;

  const handleMonthChange = (month) => {
    setCurrentMonth(month);

    const params = new URLSearchParams(location.search);
    params.set('month', month);

    navigate(`/plan?${params.toString()}`, { replace: true });
  };

  if (budgetSummary.isLoading) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-0.5 text-base font-semibold sm:text-lg">
            <button type="button" aria-label="Previous month" className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-muted/60 [-webkit-tap-highlight-color:transparent]" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => handleMonthChange(format(subMonths(new Date(`${currentMonth}-01T12:00:00`), 1), 'yyyy-MM'))}><ChevronLeft className="size-4" /></button>
            <span className="min-w-0 truncate whitespace-nowrap">{format(new Date(`${currentMonth}-01T12:00:00`), 'MMMM yyyy')}</span>
            <button type="button" aria-label="Next month" className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-muted/60 [-webkit-tap-highlight-color:transparent]" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => handleMonthChange(format(addMonths(new Date(`${currentMonth}-01T12:00:00`), 1), 'yyyy-MM'))}><ChevronRight className="size-4" /></button>
          </span>
        }
        action={
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Edit monthly plan" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate(`/manage-plan?tab=monthly-plan&month=${currentMonth}`)}><PencilLine className="size-[18px]" /></button>
            {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline" />}
            <button type="button" aria-label="Open settings" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate('/settings')}><Settings className="size-[19px]" /></button>
          </div>
        }
      />
        <main className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 pb-28 md:px-6 lg:py-8">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-0.5 text-base font-semibold sm:text-lg">
            <button type="button" aria-label="Previous month" className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-muted/60 [-webkit-tap-highlight-color:transparent]" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => handleMonthChange(format(subMonths(new Date(`${currentMonth}-01T12:00:00`), 1), 'yyyy-MM'))}><ChevronLeft className="size-4" /></button>
            <span className="min-w-0 truncate whitespace-nowrap">{format(new Date(`${currentMonth}-01T12:00:00`), 'MMMM yyyy')}</span>
            <button type="button" aria-label="Next month" className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-muted/60 [-webkit-tap-highlight-color:transparent]" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => handleMonthChange(format(addMonths(new Date(`${currentMonth}-01T12:00:00`), 1), 'yyyy-MM'))}><ChevronRight className="size-4" /></button>
          </span>
        }
        action={
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Edit monthly plan" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate(`/manage-plan?tab=monthly-plan&month=${currentMonth}`)}><PencilLine className="size-[18px]" /></button>
            {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline" />}
            <button type="button" aria-label="Open settings" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate('/settings')}><Settings className="size-[19px]" /></button>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-3 pb-28 md:px-6 lg:py-6">
        <div className="animate-child space-y-3">
          <LeftToAllocateBanner
            leftToAllocate={leftToAllocate}
            totalIncome={plannedTotals.budgetFunding}
            isEditMode={false}
            formatCurrency={formatCurrency}
            sticky={false}
          />

          <PlanOverview
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categories={categories}
            subcategories={subcategories}
            currency={currency}
            allocations={allocations}
            transactions={planTransactions}
            goalContributions={goalContributions}
            savingsGoals={savingsGoals}
            recurringTransactions={recurringTransactions}
            allTransactions={allTransactions}
            currentMonth={currentMonth}
          />
        </div>
      </main>
    </div>
  );
}
