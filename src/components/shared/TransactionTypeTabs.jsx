import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

const activeClass = {
  all: 'border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-xl',
  income:
    'bg-emerald-500/10 text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.18)] dark:text-emerald-400 dark:shadow-[0_8px_24px_rgba(16,185,129,0.10)]',
  expense:
    'bg-red-500/10 text-red-700 shadow-[0_8px_24px_rgba(239,68,68,0.18)] dark:text-red-400 dark:shadow-[0_8px_24px_rgba(239,68,68,0.10)]',
  transfer:
    'bg-blue-500/10 text-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.18)] dark:text-blue-400 dark:shadow-[0_8px_24px_rgba(59,130,246,0.10)]',
};

const inactiveClass = {
  all: 'text-muted-foreground hover:bg-background/45 hover:text-foreground',
  income:
    'text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-400',
  expense:
    'text-muted-foreground hover:bg-red-500/5 hover:text-red-700 dark:hover:text-red-400',
  transfer:
    'text-muted-foreground hover:bg-blue-500/5 hover:text-blue-700 dark:hover:text-blue-400',
};

export default function TransactionTypeTabs({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
}) {
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'grid w-full gap-1 rounded-2xl border border-white/40 bg-white/35 p-1.5 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]',
          options.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
        )}
      >
        {options.map((option) => {
          const active = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-2.5 text-[11px] font-semibold leading-none transition-all duration-200 sm:px-3 sm:text-sm',
                active
                  ? activeClass[option.value] || activeClass.all
                  : inactiveClass[option.value] || inactiveClass.all
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />}
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
