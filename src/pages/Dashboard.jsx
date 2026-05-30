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
import { useMemo } from 'react';
import {
  useBudgetSummary,
  useAllTransactions,
  useRecurringTransactions,
  useSavingsGoals,
  useTransactions,
} from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { attachGoalFundingProgress } from '@/lib/goals';

const validTabs = new Set(['overview', 'reflect']);

export default function Dashboard() {
  const scope = usePageEntrance();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = validTabs.has(requestedTab) ? requestedTab : 'overview';

  const handleTabChange = (nextTab) => {
    setSearchParams(nextTab === 'reflect' ? { tab: 'reflect' } : {}, {
      replace: true,
    });
  };

  const currentMonth = format(new Date(), 'yyyy-MM');
  const budget = useBudgetSummary(currentMonth);
  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: allTransactions = [] } = useAllTransactions();
  const goalsWithFunding = useMemo(
    () => attachGoalFundingProgress(savingsGoals, allTransactions),
    [allTransactions, savingsGoals]
  );
  const formatCurrency = useCurrencyFormatter();

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
            budget={budget}
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
              {activeTab === 'reflect' ? <DashboardReflect /> : <DashboardOverview />}
            </AppTabPanel>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
