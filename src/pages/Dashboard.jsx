import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardReflect from '@/components/dashboard/DashboardReflect';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

import { Settings, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [online, setOnline] = useState(() => navigator.onLine);
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const sync = () => { setOnline(navigator.onLine); setToday(new Date()); };
    const timer = window.setInterval(sync, 60000);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    document.addEventListener('visibilitychange', sync);
    return () => { window.clearInterval(timer); window.removeEventListener('online', sync); window.removeEventListener('offline', sync); document.removeEventListener('visibilitychange', sync); };
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
        <div className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex min-h-12 max-w-3xl items-center justify-between px-4">
          <span className="text-xs font-medium sm:text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</span>
          <div className="flex items-center gap-1">
            {!online && <WifiOff className="size-4 text-muted-foreground" aria-label="Offline" />}
            <Link to="/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-xl"><Settings className="size-5" /></Link>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-2"><DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} /></div>
      </div>
        <main className="mx-auto w-full max-w-7xl space-y-4 px-4 pt-3 pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-6">
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
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex min-h-12 max-w-3xl items-center justify-between px-4">
          <span className="text-xs font-medium sm:text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</span>
          <div className="flex items-center gap-1">
            {!online && <WifiOff className="size-4 text-muted-foreground" aria-label="Offline" />}
            <Link to="/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-xl"><Settings className="size-5" /></Link>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-2"><DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} /></div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-28 md:px-6 lg:px-8 lg:py-8">
        <div className="hidden animate-child lg:block">
          <DashboardHero
            budget={dashboardBudget}
            transactions={transactions}
            recurringTransactions={recurringTransactions}
            goals={goalsWithFunding}
            formatCurrency={formatCurrency}
          />
        </div>

        

        <div className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            <AppTabPanel key={activeTab}>
              {activeTab === 'reflect' ? (
                <DashboardReflect />
              ) : (
                <DashboardOverview
                  currentMonth={currentMonth}
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
