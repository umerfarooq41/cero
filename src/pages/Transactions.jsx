import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, Clock3 } from 'lucide-react';

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
    <div className="mb-5 animate-child">
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
        subtitle={
          activeTab === 'history'
            ? 'Posted money movement history'
            : 'Post recurring items and goal contributions'
        }
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-24 lg:py-8">
        <TransactionsSegmentedControl value={activeTab} onChange={handleTabChange} />

        <AnimatePresence mode="wait" initial={false}>
          <AppTabPanel key={activeTab}>
            {activeTab === 'history' ? (
              <TransactionHistory />
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
