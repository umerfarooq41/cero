import { motion } from 'framer-motion';
import { CalendarRange, ListTree, Repeat, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export const managePlanTabs = [
  {
    value: 'monthly-plan',
    label: 'Plan',
    desktopLabel: 'Monthly Plan',
    icon: CalendarRange,
  },
  {
    value: 'categories',
    label: 'Categories',
    desktopLabel: 'Categories',
    icon: ListTree,
  },
  {
    value: 'recurring',
    label: 'Recurring',
    desktopLabel: 'Recurring',
    icon: Repeat,
  },
  {
    value: 'goals',
    label: 'Goals',
    desktopLabel: 'Goals',
    icon: Target,
  },
];

export default function ManagePlanTabs({ activeTab, onChange, className = '' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl',
        className
      )}
    >
      <div className="grid grid-cols-4 gap-1">
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
                relative flex min-w-0 items-center justify-center gap-1
                overflow-hidden rounded-xl px-1 py-2.5
                text-[10px] font-semibold leading-none
                transition-colors duration-200
                active:scale-[0.99]
                sm:gap-1.5 sm:px-3 sm:text-sm
                `,
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="manage-plan-tab-highlight"
                  className="absolute inset-0 rounded-xl bg-primary/10 shadow-sm ring-1 ring-primary/10"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                  }}
                />
              )}

              <Icon
                className={cn(
                  'relative z-10 h-3.5 w-3.5 shrink-0 transition-all duration-200 sm:h-4 sm:w-4',
                  isActive && 'stroke-[2.5]'
                )}
              />

              <span className="relative z-10 min-w-0 truncate">
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.desktopLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}