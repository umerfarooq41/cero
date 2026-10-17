import { AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { CalendarClock, Clock3, ChevronLeft, ChevronRight, Settings, WifiOff } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import ScheduledTransactions from '@/components/transactions/ScheduledTransactions';
import AppTabs, { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import FloatingActionButton from '@/components/shared/FloatingActionButton';
import TransactionHistory from '@/components/transactions/TransactionHistory';
import { usePageEntrance } from '@/hooks/usePageTransition';

const tabs = [
  { value: 'history', label: 'History', icon: Clock3, tone: 'blue' },
  { value: 'scheduled', label: 'Scheduled', icon: CalendarClock, tone: 'amber' },
];

function TransactionsSegmentedControl({ value, onChange }) {
  return (
    <div className="mb-3 animate-child">
      <AppTabs
        tabs={tabs}
        value={value}
        onChange={onChange}
        size="md"
        layoutId="transactions-tab-highlight"
      />
    </div>
  );
}

const validTabs = new Set(['history', 'scheduled']);

export default function Transactions() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
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
        title={activeTab === 'history' ? <span className="flex items-center gap-0.5 text-base font-semibold sm:text-lg">
          <button type="button" aria-label="Previous month" className="grid size-8 place-items-center rounded-full hover:bg-muted/60 [-webkit-tap-highlight-color:transparent]" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => changeMonth(-1)}><ChevronLeft className="size-4"/></button>
          <span className="whitespace-nowrap">{format(new Date(`${currentMonth}-01T12:00:00`), 'MMMM yyyy')}</span>
          <button type="button" aria-label="Next month" className="grid size-8 place-items-center rounded-full hover:bg-muted/60 [-webkit-tap-highlight-color:transparent]" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }} onClick={() => changeMonth(1)}><ChevronRight className="size-4"/></button>
        </span> : <span className="text-base font-semibold">Scheduled</span>}
        action={<div className="flex items-center gap-1">
          {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline"/>}
          <button type="button" aria-label="Open settings" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60" onClick={() => navigate('/settings')}><Settings className="size-[19px]"/></button>
        </div>}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-3 pb-40 lg:py-6">
        <TransactionsSegmentedControl value={activeTab} onChange={handleTabChange} />

        <AnimatePresence mode="wait" initial={false}>
          <AppTabPanel key={activeTab}>
            {activeTab === 'history' ? (
              <TransactionHistory currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
            ) : (
              <ScheduledTransactions />
            )}
          </AppTabPanel>
        </AnimatePresence>

        {activeTab === 'history' && (
          <FloatingActionButton to="/add-transaction" ariaLabel="Add transaction" />
        )}
      </main>
    </div>
  );
}
