import { WorkspaceTab } from '@/components/shared/WorkspacePrimitives';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock, Clock3, Plus, Settings, WifiOff } from 'lucide-react';

import MonthSelector from '@/components/shared/MonthSelector';
import PageHeader from '@/components/layout/PageHeader';
import ScheduledTransactions from '@/components/transactions/ScheduledTransactions';
import { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import TransactionHistory from '@/components/transactions/TransactionHistory';
import { usePageEntrance } from '@/hooks/usePageTransition';

const tabs = [
  { value: 'history', label: 'History', icon: Clock3, tone: 'blue' },
  { value: 'scheduled', label: 'Scheduled', icon: CalendarClock, tone: 'amber' },
];

const validTabs = new Set(['history', 'scheduled']);

export default function Transactions() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = validTabs.has(requestedTab) ? requestedTab : 'history';

  const handleTabChange = (nextTab) => {
    setSearchParams(nextTab === 'scheduled' ? { tab: 'scheduled' } : {}, {
      replace: true,
    });
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Transactions"
        mobileAction={activeTab === "history" && <button type="button" aria-label="Add transaction" className="cero-header-icon" onClick={() => navigate("/add-transaction", {state:{backgroundLocation:location}})}><Plus size={22}/></button>}
        action={<div className="flex items-center gap-1">
          {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline"/>}
          <button type="button" aria-label="Open settings" className="grid lg:hidden size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate('/settings')}><Settings className="size-[19px]"/></button>
        </div>}
      />

      <main className="cero-page-content mx-auto w-full max-w-7xl px-4 py-3 pb-40 md:pb-8 lg:px-8 lg:py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <nav aria-label="Transaction views" className="cero-workplace-tabs flex flex-1 gap-2 md:gap-5">{tabs.map(tab => <WorkspaceTab key={tab.value} active={activeTab === tab.value} onClick={() => handleTabChange(tab.value)}>{tab.label}</WorkspaceTab>)}</nav>
          {activeTab === 'history' && <button type="button" onClick={() => navigate('/add-transaction', { state: { backgroundLocation: location } })} className="cero-add-action cero-desktop-only-action"><span aria-hidden="true">+</span><span>Add</span></button>}
        </div>

        {activeTab === "history" && <div className="mb-3"><MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} subtitle={null} bare className="max-w-[240px]"/></div>}
        <AnimatePresence mode="wait" initial={false}>
          <AppTabPanel key={activeTab}>
            {activeTab === 'history' ? (
              <TransactionHistory currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
            ) : (
              <ScheduledTransactions />
            )}
          </AppTabPanel>
        </AnimatePresence>

      </main>
    </div>
  );
}
