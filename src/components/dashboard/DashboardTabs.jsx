import { BarChart3, LayoutDashboard } from 'lucide-react';

import { cn } from '@/lib/utils';

const tabs = [
  {
    value: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    value: 'reflect',
    label: 'Reflect',
    icon: BarChart3,
  },
];

export default function DashboardTabs({ activeTab, onTabChange }) {
  return (
    <div className="animate-child rounded-3xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                active
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
