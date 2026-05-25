import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Settings2 } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import ManagePlanTabs, { managePlanTabs } from '@/components/manage-plan/ManagePlanTabs';
import MonthlyPlanPanel from '@/components/manage-plan/MonthlyPlanPanel';
import ManageCategoriesPanel from '@/components/manage-plan/ManageCategoriesPanel';
import ManageRecurringPanel from '@/components/manage-plan/ManageRecurringPanel';
import ManageGoalsPanel from '@/components/manage-plan/ManageGoalsPanel';
import { usePageEntrance } from '@/hooks/usePageTransition';

const DEFAULT_TAB = 'monthly-plan';
const DEFAULT_MONTH = format(new Date(), 'yyyy-MM');

function getValidTab(value) {
  return managePlanTabs.some((tab) => tab.value === value) ? value : DEFAULT_TAB;
}

export default function ManagePlan() {
  const scope = usePageEntrance();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tabFromUrl = searchParams.get('tab');
  const monthFromUrl = searchParams.get('month');

  const [activeTab, setActiveTab] = useState(() => getValidTab(tabFromUrl));
  const [currentMonth, setCurrentMonth] = useState(monthFromUrl || DEFAULT_MONTH);

  useEffect(() => {
    setActiveTab(getValidTab(tabFromUrl));
  }, [tabFromUrl]);

  useEffect(() => {
    if (monthFromUrl) setCurrentMonth(monthFromUrl);
  }, [monthFromUrl]);

  const updateUrl = ({ nextTab = activeTab, nextMonth = currentMonth, replace = true } = {}) => {
    const params = new URLSearchParams();
    params.set('tab', nextTab);

    if (nextTab === 'monthly-plan') {
      params.set('month', nextMonth);
    }

    navigate(
      {
        pathname: '/manage-plan',
        search: `?${params.toString()}`,
      },
      { replace }
    );
  };

  const changeTab = (nextTab) => {
    setActiveTab(nextTab);
    updateUrl({ nextTab, replace: true });
  };

  const changeMonth = (nextMonth) => {
    setCurrentMonth(nextMonth);
    updateUrl({ nextTab: 'monthly-plan', nextMonth, replace: true });
  };

  const renderPanel = () => {
    if (activeTab === 'categories') return <ManageCategoriesPanel />;
    if (activeTab === 'recurring') return <ManageRecurringPanel />;
    if (activeTab === 'goals') return <ManageGoalsPanel />;

    return (
      <MonthlyPlanPanel
        currentMonth={currentMonth}
        onMonthChange={changeMonth}
      />
    );
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

        <AnimatePresence mode="wait" initial={false}>
          <AppTabPanel key={activeTab} className="animate-child">
            {renderPanel()}
          </AppTabPanel>
        </AnimatePresence>
      </main>
    </div>
  );
}
