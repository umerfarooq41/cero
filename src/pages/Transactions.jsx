import { AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { CalendarClock, Clock3, ChevronLeft, ChevronRight, Settings, WifiOff } from 'lucide-react';

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
  const changeMonth = (delta) => setCurrentMonth((month) => format((delta < 0 ? subMonths : addMonths)(new Date(`${month}-01T12:00:00`), 1), "yyyy-MM"));
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
        action={<div className="flex items-center gap-1">
          {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline"/>}
          <button type="button" aria-label="Open settings" className="grid lg:hidden size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate('/settings')}><Settings className="size-[19px]"/></button>
        </div>}
      />

      <main className="cero-page-content mx-auto w-full max-w-7xl px-4 py-3 pb-40 md:pb-8 lg:px-8 lg:py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <nav aria-label="Transaction views" className="cero-workplace-tabs flex flex-1 gap-2 md:gap-5">{tabs.map(tab => <button key={tab.value} type="button" aria-pressed={activeTab === tab.value} onClick={() => handleTabChange(tab.value)} className={'border-b-2 px-2 py-3 text-sm font-medium ' + (activeTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>{tab.label}</button>)}</nav>
          {activeTab === 'history' && <button type="button" onClick={() => navigate('/add-transaction', { state: { backgroundLocation: location } })} className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><span className="md:hidden">+ Add</span><span className="hidden md:inline">+ Add transaction</span></button>}
        </div>

        {activeTab === "history" && <div className="mb-3 flex items-center"><span className="flex items-center cero-month-heading gap-0.5 text-sm font-medium">
          <button type="button" aria-label="Previous month"  className="grid size-8 place-items-center rounded-full bg-transparent disabled:opacity-35 disabled:cursor-default [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => changeMonth(-1)}><ChevronLeft className="size-4"/></button>
          <span className="whitespace-nowrap">{format(activeTab === "scheduled" ? new Date() : new Date(`${currentMonth}-01T12:00:00`), 'MMMM yyyy')}</span>
          <button type="button" aria-label="Next month"  className="grid size-8 place-items-center rounded-full bg-transparent [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => changeMonth(1)}><ChevronRight className="size-4"/></button>
        </span></div>}
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
