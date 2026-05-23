import { useMemo } from 'react';

import { buildPlanViewData } from '@/lib/planData';
import PlanBreakdownCard from './PlanBreakdownCard';
import PlanDonutCard from './PlanDonutCard';
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
        tab,
      }),
    [activeTab, categories, subcategories, allocations, transactions, tab]
  );

  return (
    <div className="space-y-4">
      <PlanTabs activeTab={activeTab} onChange={setActiveTab} />

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
    </div>
  );
}
