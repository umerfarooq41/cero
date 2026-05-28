import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardReflect from '@/components/dashboard/DashboardReflect';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { AppTabPanel } from '@/components/shared/AppTabs.jsx';
import PageHeader from '@/components/layout/PageHeader';
import { usePageEntrance } from '@/hooks/usePageTransition';

const validTabs = new Set(['overview', 'reflect']);

export default function Dashboard() {
  const scope = usePageEntrance();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = validTabs.has(requestedTab) ? requestedTab : 'overview';

  const handleTabChange = (nextTab) => {
    setSearchParams(nextTab === 'reflect' ? { tab: 'reflect' } : {}, {
      replace: true,
    });
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Dashboard"
        subtitle="Your financial command center"
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-28 md:px-6 lg:py-8">
        <DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            <AppTabPanel key={activeTab}>
              {activeTab === 'reflect' ? <DashboardReflect /> : <DashboardOverview />}
            </AppTabPanel>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
