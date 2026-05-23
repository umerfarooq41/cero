import { cn } from '@/lib/utils';
import { PLAN_TABS } from './planTabsConfig';

export default function PlanTabs({ activeTab, onChange }) {
  return (
    <div className="grid w-full grid-cols-4 gap-1 rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl">
      {PLAN_TABS.map((item) => {
        const TabIcon = item.icon;
        const active = item.key === activeTab;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'flex min-w-0 items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold leading-none transition-all duration-200 sm:gap-1.5 sm:px-3 sm:text-sm',
              active ? item.activeClass : item.inactiveClass
            )}
          >
            <TabIcon className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
            <span className="min-w-0 truncate">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}
