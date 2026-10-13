import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardReflect from '@/components/dashboard/DashboardReflect';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

import PageHeader from '@/components/layout/PageHeader';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import {
  useBudgetSummary,
  useAllocations,
  useAllTransactions,
  useRecurringTransactions,
  useSavingsGoals,
} from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { attachGoalFundingProgress } from '@/lib/goals';
import { buildPlanTotals } from '@/lib/planData';

const validTabs = new Set(['overview', 'reflect']);

export default function Dashboard() {
  const scope = usePageEntrance();
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const sync = () => setToday(new Date());
    const timer = window.setInterval(sync, 60000);
    document.addEventListener('visibilitychange', sync);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = validTabs.has(requestedTab) ? requestedTab : 'overview';

  const handleTabChange = useCallback(
    (nextTab) => {
      setSearchParams(nextTab === 'reflect' ? { tab: 'reflect' } : {}, {
        replace: true,
      });
    },
    [setSearchParams]
  );

  const currentMonth = format(today, 'yyyy-MM');
  const budget = useBudgetSummary(currentMonth);
  const transactions = budget.transactions || [];
  const categories = budget.categories || [];
  const accounts = budget.accounts || [];
  const { data: allocations = [] } = useAllocations(currentMonth);
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: allTransactions = [] } = useAllTransactions();
  const goalsWithFunding = useMemo(
    () => attachGoalFundingProgress(savingsGoals, allTransactions),
    [allTransactions, savingsGoals]
  );
  const formatCurrency = useCurrencyFormatter();

  const isBudgetLoading = budget.isLoading;

  const planTotals = useMemo(
    () =>
      buildPlanTotals({
        allocations,
        categories,
        savingsGoals,
        recurringTransactions,
        allTransactions,
        transactions,
        currentMonth,
      }),
    [
      allocations,
      allTransactions,
      categories,
      currentMonth,
      recurringTransactions,
      savingsGoals,
      transactions,
    ]
  );

  const dashboardBudget = useMemo(
    () => ({
      ...budget,
      totalPlannedIncome: planTotals.income,
      realizedIncome: planTotals.realizedIncome,
      budgetFunding: planTotals.budgetFunding,
      totalPlannedExpenses: planTotals.expense,
      totalPlannedSavings: planTotals.savings,
      totalPlannedDebt: planTotals.debt,
      assignablePlannedDebt: planTotals.assignableDebt,
      leftToAllocate: planTotals.leftToAllocate,
    }),
    [budget, planTotals]
  );

  if (isBudgetLoading) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        <PageHeader title={format(today, 'EEEE, MMMM d, yyyy')} className="[&_h1]:text-sm [&_h1]:font-semibold [&_h1]:tracking-normal sm:[&_h1]:text-base [&_.app-page-header]:bg-transparent" />
        <main className="mx-auto w-full max-w-7xl space-y-3 px-4 pt-2 pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-6">
          <div className="mx-auto max-w-3xl"><DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} /></div>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader title={format(today, 'EEEE, MMMM d, yyyy')} className="[&_h1]:text-sm [&_h1]:font-semibold [&_h1]:tracking-normal sm:[&_h1]:text-base" />

      <main className="mx-auto w-full max-w-7xl px-4 pt-2 pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto max-w-3xl"><DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} /></div>
        

        

        <div className="mt-1">
          <AnimatePresence mode="wait" initial={false}>
            <AppTabPanel key={activeTab}>
              {activeTab === 'reflect' ? (
                <DashboardReflect />
              ) : (
                <DashboardOverview
                  currentMonth={currentMonth}
                  allocations={allocations}
                  budget={dashboardBudget}
                  transactions={transactions}
                  categories={categories}
                  accounts={accounts}
                  recurringTransactions={recurringTransactions}
                  goals={goalsWithFunding}
                  formatCurrency={formatCurrency}
                />
              )}
            </AppTabPanel>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
