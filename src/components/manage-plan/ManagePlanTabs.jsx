import { CalendarRange, ListTree, Repeat, Target } from 'lucide-react';
import AppTabs from '@/components/shared/AppTabs.jsx';

export const managePlanTabs = [
  {
    value: 'monthly-plan',
    label: 'Plan',
    desktopLabel: 'Monthly Plan',
    icon: CalendarRange,
    tone: 'blue',
  },
  {
    value: 'categories',
    label: 'Category',
    desktopLabel: 'Categories',
    icon: ListTree,
    tone: 'emerald',
  },
  {
    value: 'recurring',
    label: 'Recurring',
    desktopLabel: 'Recurring',
    icon: Repeat,
    tone: 'amber',
  },
  {
    value: 'goals',
    label: 'Goals',
    desktopLabel: 'Goals',
    icon: Target,
    tone: 'purple',
  },
];

export default function ManagePlanTabs({ activeTab, onChange, className = '' }) {
  return (
    <AppTabs
      tabs={managePlanTabs}
      value={activeTab}
      onChange={onChange}
      size="sm"
      layoutId="manage-plan-tab-highlight"
      className={className}
      gridClassName="gap-0.5 sm:gap-1"
      buttonClassName="gap-1 px-1 py-2 text-[10px] sm:gap-1 sm:px-2 sm:text-xs md:gap-1.5 md:px-2.5 md:text-sm"
    />
  );
}
