import { WorkspaceTab } from '@/components/shared/WorkspacePrimitives';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import PageHeader from '@/components/layout/PageHeader';
import { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import { managePlanTabs } from '@/components/manage-plan/ManagePlanTabs';
import MonthlyPlanPanel from '@/components/manage-plan/MonthlyPlanPanel';
import ManageCategoriesPanel from '@/components/manage-plan/ManageCategoriesPanel';
import ManageRecurringPanel from '@/components/manage-plan/ManageRecurringPanel';
import ManageGoalsPanel from '@/components/manage-plan/ManageGoalsPanel';
import { usePageEntrance } from '@/hooks/usePageTransition';

const DEFAULT_TAB = 'recurring';
const DEFAULT_MONTH = format(new Date(), 'yyyy-MM');

function getValidTab(value) {
  return ['recurring','goals'].includes(value) ? value : DEFAULT_TAB;
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
        title="Workplace"
      />

      <main className="cero-page-content mx-auto w-full max-w-7xl px-4 py-3 pb-28 md:pb-8 lg:px-8 lg:py-3 lg:pb-8">

        <nav aria-label="Manage plan sections" className="cero-workplace-tabs mb-4 flex gap-6 border-b border-border">{managePlanTabs.filter(tab=>!['monthly-plan','categories'].includes(tab.value)).map(tab => <WorkspaceTab key={tab.value} active={activeTab === tab.value} onClick={() => changeTab(tab.value)}>{tab.desktopLabel || tab.label}</WorkspaceTab>)}</nav>
        <AnimatePresence mode="wait" initial={false}>
          <AppTabPanel key={activeTab} className="animate-child">
            {renderPanel()}
          </AppTabPanel>
        </AnimatePresence>
      </main>
    </div>
  );
}
