import { useSearchParams } from 'react-router-dom';
import { CalendarClock, Clock3 } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import ScheduledTransactions from '@/components/transactions/ScheduledTransactions';
import TransactionHistory from '@/components/transactions/TransactionHistory';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { cn } from '@/lib/utils';

const tabs = [
  { value: 'history', label: 'History', icon: Clock3 },
  { value: 'scheduled', label: 'Scheduled', icon: CalendarClock },
];

function TransactionsSegmentedControl({ value, onChange }) {
  return (
    <div className="mb-5 animate-child">
      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-white/40 bg-white/35 p-1.5 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
        {tabs.map((tab) => {
          const active = value === tab.value;
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold leading-none transition-all duration-200',
                active
                  ? 'border border-border/60 bg-card/85 text-foreground shadow-sm backdrop-blur-xl'
                  : 'text-muted-foreground hover:bg-background/45 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
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

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-24 lg:py-8">
        <TransactionsSegmentedControl value={activeTab} onChange={handleTabChange} />

        {activeTab === 'history' ? (
          <TransactionHistory />
        ) : (
          <ScheduledTransactions />
        )}
      </main>
    </div>
  );
}
