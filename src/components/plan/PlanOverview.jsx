import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';

import { buildPlanViewData } from '@/lib/planData';
import PlanBreakdownCard from './PlanBreakdownCard';
import PlanDonutCard from './PlanDonutCard';
import { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import PlanTabs from './PlanTabs';
import { PLAN_TABS } from './planTabsConfig';

export default function PlanOverview({
  activeTab,
  setActiveTab,
  categories,
  subcategories,
  currency,
  allocations,
  transactions,
  goalContributions,
  savingsGoals,
  recurringTransactions,
  currentMonth,
}) {
  const tab = PLAN_TABS.find((item) => item.key === activeTab) || PLAN_TABS[0];

  const planData = useMemo(
    () =>
      buildPlanViewData({
        activeTab,
        categories,
        subcategories,
        allocations,
        transactions,
        goalContributions,
        savingsGoals,
        recurringTransactions,
        currentMonth,
        tab,
      }),
    [
      activeTab,
      categories,
      subcategories,
      allocations,
      transactions,
      goalContributions,
      savingsGoals,
      recurringTransactions,
      currentMonth,
      tab,
    ]
  );

  return (
    <div className="space-y-4">
      <PlanTabs activeTab={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait" initial={false}>
        <AppTabPanel key={activeTab} className="space-y-4">
          <PlanDonutCard
            tab={tab}
            chartData={planData.chartData}
            donutChartData={planData.donutChartData}
            totalTracked={planData.totalTracked}
            totalPlanned={planData.totalPlanned}
            totalRemaining={planData.totalRemaining}
            progress={planData.progress}
            currency={currency}
          />

          <PlanBreakdownCard
            activeTab={activeTab}
            tab={tab}
            rows={planData.chartData}
            currency={currency}
          />
        </AppTabPanel>
      </AnimatePresence>
    </div>
  );
}
