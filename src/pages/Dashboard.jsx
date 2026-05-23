import { useSearchParams } from 'react-router-dom';

import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardReflect from '@/components/dashboard/DashboardReflect';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
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
        subtitle={
          activeTab === 'reflect'
            ? 'Insights, trends, and financial clarity'
            : 'Your money command center for this month'
        }
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 md:px-6 lg:py-8">
        <DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mt-4">
          {activeTab === 'reflect' ? <DashboardReflect /> : <DashboardOverview />}
        </div>
      </main>
    </div>
  );
}
