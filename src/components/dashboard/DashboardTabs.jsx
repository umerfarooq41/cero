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
      <nav aria-label="Dashboard views" className="hidden items-center gap-6 border-b border-border lg:flex">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" aria-pressed={activeTab === value} onClick={() => onTabChange(value)} className={`inline-flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${activeTab === value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Icon className="size-4" aria-hidden="true" />{label}</button>
        ))}
      </nav>
      <div className="lg:hidden">
      <AppTabs
        tabs={tabs}
        value={activeTab}
        onChange={onTabChange}
        size="lg"
        layoutId="dashboard-tab-highlight"
      />
      </div>
    </div>
  );
}
