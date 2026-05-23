import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
} from 'lucide-react';

export const PLAN_TABS = [
  {
    key: 'income',
    title: 'Income',
    label: 'received',
    color: '#16A34A',
    activeClass:
      'bg-emerald-500/10 text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.18)] dark:text-emerald-400 dark:shadow-[0_8px_24px_rgba(16,185,129,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-400',
    icon: ArrowUpRight,
    shades: ['#14532D', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC'],
  },
  {
    key: 'expense',
    title: 'Expenses',
    label: 'spent',
    color: '#DC2626',
    activeClass:
      'bg-red-500/10 text-red-700 shadow-[0_8px_24px_rgba(239,68,68,0.18)] dark:text-red-400 dark:shadow-[0_8px_24px_rgba(239,68,68,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-red-500/5 hover:text-red-700 dark:hover:text-red-400',
    icon: ArrowDownRight,
    shades: ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171'],
  },
  {
    key: 'savings',
    title: 'Savings',
    label: 'saved',
    color: '#2563EB',
    activeClass:
      'bg-blue-500/10 text-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.18)] dark:text-blue-400 dark:shadow-[0_8px_24px_rgba(59,130,246,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-blue-500/5 hover:text-blue-700 dark:hover:text-blue-400',
    icon: PiggyBank,
    shades: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
  },
  {
    key: 'debt',
    title: 'Debt',
    label: 'paid',
    color: '#7C3AED',
    activeClass:
      'bg-purple-500/10 text-purple-700 shadow-[0_8px_24px_rgba(124,58,237,0.18)] dark:text-purple-400 dark:shadow-[0_8px_24px_rgba(124,58,237,0.10)]',
    inactiveClass:
      'text-muted-foreground hover:bg-purple-500/5 hover:text-purple-700 dark:hover:text-purple-400',
    icon: CreditCard,
    shades: ['#581C87', '#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'],
  },
];