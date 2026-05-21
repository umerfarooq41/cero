import { motion } from 'framer-motion';
import { CalendarRange, ListTree, Repeat, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export const managePlanTabs = [
  {
    value: 'monthly-plan',
    label: 'Monthly Plan',
    shortLabel: 'Plan',
    icon: CalendarRange,
  },
  {
    value: 'categories',
    label: 'Categories',
    shortLabel: 'Categories',
    icon: ListTree,
  },
  {
    value: 'recurring',
    label: 'Recurring',
    shortLabel: 'Recurring',
    icon: Repeat,
  },
  {
    value: 'goals',
    label: 'Goals',
    shortLabel: 'Goals',
    icon: Target,
  },
];

export default function ManagePlanTabs({ activeTab, onChange }) {
  return (
    <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-grid min-w-full grid-cols-4 gap-1 rounded-2xl border border-border/60 bg-card/60 p-1 shadow-sm backdrop-blur-xl">
        {managePlanTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="manage-plan-tab-highlight"
                  className="absolute inset-0 rounded-xl bg-primary/10 shadow-sm ring-1 ring-primary/10"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                />
              )}

              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              <span className="relative z-10 hidden truncate sm:inline">
                {tab.label}
              </span>
              <span className="relative z-10 truncate sm:hidden">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
