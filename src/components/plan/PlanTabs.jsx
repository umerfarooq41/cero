import AppTabs from '@/components/shared/AppTabs.jsx';
import { PLAN_TABS } from './planTabsConfig';

const toneByKey = {
  income: 'emerald',
  expense: 'red',
  savings: 'blue',
  debt: 'purple',
};

export default function PlanTabs({ activeTab, onChange }) {
  const tabs = PLAN_TABS.map((item) => ({
    value: item.key,
    label: item.title,
    icon: item.icon,
    tone: toneByKey[item.key] || 'neutral',
  }));

  return (
    <AppTabs
      tabs={tabs}
      value={activeTab}
      onChange={onChange}
      size="sm"
      buttonClassName="!gap-1 !px-1 !text-[10px] min-[380px]:!text-[11px] sm:!gap-2 sm:!px-3 sm:!text-sm"
      layoutId="plan-tab-highlight"
    />
  );
}
