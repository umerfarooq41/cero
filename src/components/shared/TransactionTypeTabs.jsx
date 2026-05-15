import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

const toneClass = {
  all: 'text-foreground',
  income: 'text-emerald-600 dark:text-emerald-400',
  expense: 'text-destructive',
  transfer: 'text-primary',
};

export default function TransactionTypeTabs({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="surface-card card-elevated inline-flex w-full rounded-2xl border border-white/40 p-1 dark:border-white/[0.05]">
        {options.map((option) => {
          const active = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                active
                  ? cn(
                      'bg-white/70 shadow-sm dark:bg-white/[0.06]',
                      toneClass[option.value] || 'text-foreground'
                    )
                  : 'text-muted-foreground hover:bg-white/35 hover:text-foreground dark:hover:bg-white/[0.04]'
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
