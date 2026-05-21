import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Settings2 } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import ManagePlanTabs, { managePlanTabs } from '@/components/manage-plan/ManagePlanTabs';
import MonthlyPlanPanel from '@/components/manage-plan/MonthlyPlanPanel';
import ManageCategoriesPanel from '@/components/manage-plan/ManageCategoriesPanel';
import ManageRecurringPanel from '@/components/manage-plan/ManageRecurringPanel';
import ManageGoalsPanel from '@/components/manage-plan/ManageGoalsPanel';
import { usePageEntrance } from '@/hooks/usePageTransition';

const DEFAULT_TAB = 'monthly-plan';

function getValidTab(value) {
  return managePlanTabs.some((tab) => tab.value === value) ? value : DEFAULT_TAB;
}

export default function ManagePlan() {
  const scope = usePageEntrance();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const monthFromUrl = searchParams.get('month');
  const tabFromUrl = searchParams.get('tab');

  const [currentMonth, setCurrentMonth] = useState(monthFromUrl || format(new Date(), 'yyyy-MM'));
  const activeTab = getValidTab(tabFromUrl);

  const updateUrl = (nextMonth = currentMonth, nextTab = activeTab, replace = false) => {
    const params = new URLSearchParams();
    params.set('tab', nextTab);

    if (nextTab === 'monthly-plan') {
      params.set('month', nextMonth);
    }

    navigate(`/manage-plan?${params.toString()}`, { replace });
  };

  const changeMonth = (nextMonth) => {
    setCurrentMonth(nextMonth);
    updateUrl(nextMonth, 'monthly-plan', true);
  };

  const changeTab = (nextTab) => {
    updateUrl(currentMonth, nextTab, false);
  };

  const renderPanel = () => {
    if (activeTab === 'categories') return <ManageCategoriesPanel />;
    if (activeTab === 'recurring') return <ManageRecurringPanel />;
    if (activeTab === 'goals') return <ManageGoalsPanel />;
    return <MonthlyPlanPanel currentMonth={currentMonth} onMonthChange={changeMonth} />;
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Manage Plan"
        subtitle="Configure categories, monthly amounts, recurring rules, and savings goals"
        icon={Settings2}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 lg:py-8">
        <div className="animate-child mb-4">
          <ManagePlanTabs activeTab={activeTab} onChange={changeTab} />
        </div>

        <div className="animate-child">{renderPanel()}</div>
      </main>
    </div>
  );
}
