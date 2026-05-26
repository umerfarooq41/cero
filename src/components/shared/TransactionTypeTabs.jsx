import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import AppTabs from '@/components/shared/AppTabs.jsx';
import { cn } from '@/lib/utils';

const DEFAULT_OPTIONS = [
  { value: 'all', label: 'All', tone: 'blue' },
  { value: 'income', label: 'Income', icon: ArrowDownLeft, tone: 'emerald' },
  { value: 'expense', label: 'Expense', icon: ArrowUpRight, tone: 'red' },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight, tone: 'transfer' },
];

const toneByValue = {
  all: 'blue',
  income: 'emerald',
  expense: 'red',
  transfer: 'transfer',
};

export default function TransactionTypeTabs({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
}) {
  const tabs = options.map((option) => ({
    ...option,
    tone: option.tone || toneByValue[option.value] || 'neutral',
  }));

  return (
    <div className={cn('w-full', className)}>
      <AppTabs
        tabs={tabs}
        value={value}
        onChange={onChange}
        size="sm"
        layoutId="transaction-type-tab-highlight"
      />
    </div>
  );
}
