import { WorkspaceTab } from '@/components/shared/WorkspacePrimitives';
import { BarChart3, LayoutDashboard } from 'lucide-react';

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
      <nav aria-label="Dashboard views" className="cero-workplace-tabs flex items-center gap-6 border-b border-border">
        {tabs.map(({ value, label, icon: Icon }) => (
          <WorkspaceTab key={value} active={activeTab === value} onClick={() => onTabChange(value)} className="inline-flex items-center gap-2"><Icon className="size-4" aria-hidden="true" />{label}</WorkspaceTab>
        ))}
      </nav>
    </div>
  );
}
