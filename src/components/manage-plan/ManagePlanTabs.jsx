import { motion } from 'framer-motion';
import { CalendarRange, ListTree, Repeat, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export const managePlanTabs = [
  {
    value: 'monthly-plan',
    label: 'Monthly Plan',
    mobileLabel: 'Plan',
    icon: CalendarRange,
  },
  {
    value: 'categories',
    label: 'Categories',
    mobileLabel: 'Categories',
    icon: ListTree,
  },
  {
    value: 'recurring',
    label: 'Recurring',
    mobileLabel: 'Recurring',
    icon: Repeat,
  },
  {
    value: 'goals',
    label: 'Goals',
    mobileLabel: 'Goals',
    icon: Target,
  },
];

export default function ManagePlanTabs({ activeTab, onChange }) {
  return (
    <div className="rounded-[1.65rem] border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {managePlanTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              aria-pressed={isActive}
              className={cn(
                `
                relative flex min-h-[3.25rem] min-w-0 items-center justify-center
                gap-2 overflow-hidden rounded-[1.25rem] px-3 py-2.5
                text-sm font-semibold transition-colors duration-200
                active:scale-[0.99]
                `,
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="manage-plan-tab-highlight"
                  className="absolute inset-0 rounded-[1.25rem] bg-primary/10 shadow-sm ring-1 ring-primary/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}

              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                  isActive ? 'bg-primary/10' : 'bg-muted/45'
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>

              <span className="relative z-10 whitespace-nowrap leading-none">
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
