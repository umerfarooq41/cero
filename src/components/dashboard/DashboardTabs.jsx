import { BarChart3, LayoutDashboard } from 'lucide-react';
import AppTabs from '@/components/shared/AppTabs.jsx';

const tabs = [
  {
    value: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    tone: 'blue',
  },
  {
    value: 'reflect',
    label: 'Reflect',
    icon: BarChart3,
    tone: 'purple',
  },
];

export default function DashboardTabs({ activeTab, onTabChange }) {
  return (
    <div className="animate-child">
      <AppTabs
        tabs={tabs}
        value={activeTab}
        onChange={onTabChange}
        size="lg"
        layoutId="dashboard-tab-highlight"
      />
    </div>
  );
}
