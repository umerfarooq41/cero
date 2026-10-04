import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardReflect from '@/components/dashboard/DashboardReflect';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import DashboardHero from '@/components/dashboard/DashboardHero';
import PageHeader from '@/components/layout/PageHeader';
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

  const currentMonth = format(new Date(), 'yyyy-MM');
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
      totalPlannedExpenses: planTotals.expense,
      totalPlannedSavings: planTotals.savings,
      totalPlannedDebt: planTotals.debt,
      assignablePlannedDebt: planTotals.assignableDebt,
      leftToAllocate: planTotals.leftToAllocate,
    }),
    [budget, planTotals]
  );

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <div className="lg:hidden">
        <PageHeader
          title="Dashboard"
          subtitle="Your financial command center"
        />
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

        <div className="animate-child lg:mt-6">
          <DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />
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
