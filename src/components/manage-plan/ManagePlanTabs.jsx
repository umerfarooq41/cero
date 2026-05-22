import { motion } from 'framer-motion';
import { CalendarRange, ListTree, Repeat, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export const managePlanTabs = [
  {
    value: 'monthly-plan',
    label: 'Plan',
    desktopLabel: 'Monthly Plan',
    icon: CalendarRange,
    activeClass:
      'bg-blue-500/10 text-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.16)] dark:text-blue-400',
    ringClass: 'ring-blue-500/10',
  },
  {
    value: 'categories',
    label: 'Category',
    desktopLabel: 'Categories',
    icon: ListTree,
    activeClass:
      'bg-emerald-500/10 text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.16)] dark:text-emerald-400',
    ringClass: 'ring-emerald-500/10',
  },
  {
    value: 'recurring',
    label: 'Recurring',
    desktopLabel: 'Recurring',
    icon: Repeat,
    activeClass:
      'bg-amber-500/10 text-amber-700 shadow-[0_8px_24px_rgba(245,158,11,0.16)] dark:text-amber-400',
    ringClass: 'ring-amber-500/10',
  },
  {
    value: 'goals',
    label: 'Goals',
    desktopLabel: 'Goals',
    icon: Target,
    activeClass:
      'bg-purple-500/10 text-purple-700 shadow-[0_8px_24px_rgba(139,92,246,0.16)] dark:text-purple-400',
    ringClass: 'ring-purple-500/10',
  },
];

export default function ManagePlanTabs({ activeTab, onChange, className = '' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card/70 p-0.5 shadow-sm backdrop-blur-xl sm:p-1',
        className
      )}
    >
      <div className="grid grid-cols-4 gap-0">
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
                relative flex min-w-0 items-center justify-center
                gap-0.5 overflow-hidden rounded-xl px-0.5 py-2.5
                text-[10px] font-semibold leading-none
                transition-colors duration-200
                active:scale-[0.99]
                xs:text-[11px]
                sm:gap-1.5 sm:px-3 sm:text-sm
                `,
                isActive
                  ? tab.activeClass
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="manage-plan-tab-highlight"
                  className={cn(
                    'absolute inset-0 rounded-xl shadow-sm ring-1',
                    tab.activeClass,
                    tab.ringClass
                  )}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                  }}
                />
              )}

              <Icon
                className={cn(
                  'relative z-10 h-3.5 w-3.5 shrink-0 transition-all duration-200 xs:h-4 xs:w-4 sm:h-4 sm:w-4',
                  isActive && 'stroke-[2.5]'
                )}
              />

              <span className="relative z-10 min-w-0 whitespace-nowrap">
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