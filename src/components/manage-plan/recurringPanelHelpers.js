import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { todayIsoDate } from '@/lib/recurringTransactions';

export const COLORS = [
  '#276FE4',
  '#16AAFE',
  '#5FCEF3',
  '#18D1C8',
  '#1B8989',
  '#2898BB',
  '#8CBC95',
  '#9CB3C7',
  '#6F979F',
  '#54887C',
  '#72AA00',
  '#38C17D',
  '#3BA40E',
  '#634E4A',
  '#A85539',
  '#A58F85',
  '#EEB82D',
  '#FFB800',
  '#FF8B00',
  '#FF6D10',
  '#F84C00',
  '#FB2C2C',
  '#E40335',
  '#B1003B',
  '#E98ABE',
  '#F39AB5',
  '#FA5C8C',
  '#E33BA3',
  '#B393EA',
  '#8C7EF0',
  '#6970ED',
  '#8845F5',
];

export const TYPE_ACCENT = {
  income: 'text-green-700 dark:text-green-400',
  expense: 'text-red-700 dark:text-red-400',
  transfer: 'text-sky-700 dark:text-sky-400',
};

export const TYPE_ICONS = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
};

export const TYPE_LABELS = {
  income: 'Income',
  expense: 'Expenses',
  transfer: 'Debt Payments',
};

export const TYPE_TABS = [
  { value: 'income', label: 'Income', icon: ArrowDownLeft, tone: 'emerald' },
  { value: 'expense', label: 'Expenses', icon: ArrowUpRight, tone: 'red' },
  { value: 'transfer', label: 'Debt', icon: ArrowLeftRight, tone: 'purple' },
];

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const emptyForm = (type = 'expense') => ({
  name: '',
  amount: '',
  total_amount: '',
  duration_count: '',
  payment_mode: 'fixed',
  type,
  category_id: 'none',
  account_id: 'none',
  to_account_id: 'none',
  frequency: 'monthly',
  next_due_date: todayIsoDate(),
  is_active: true,
  icon: 'receipt',
  color: randomColor(),
  note: '',
});

export function normalizeCategoryType(type) {
  if (type === 'saving') return 'savings';
  if (type === 'liability') return 'debt';
  return String(type || '').toLowerCase();
}

export function normalizeRuleType(type) {
  if (type === 'debt') return 'transfer';
  return ['income', 'expense', 'transfer'].includes(type) ? type : 'expense';
}

function normalizeAccountType(value) {
  return String(value || '').toLowerCase();
}

function normalizeAccountCategory(value) {
  return String(value || '').toLowerCase();
}

export function isCheckingAccount(account) {
  return (
    normalizeAccountCategory(account?.category) === 'asset' &&
    normalizeAccountType(account?.type) === 'checking'
  );
}

export function isLiabilityAccount(account) {
  return normalizeAccountCategory(account?.category) === 'liability';
}

export function getAccountLabel(account) {
  const type = String(account?.type || 'account').replace(/_/g, ' ');
  return `${account?.name || 'Account'} · ${type}`;
}

function getStatusClass(status) {
  if (status.key === 'overdue') {
    return 'border-destructive/20 bg-destructive/10 text-destructive';
  }

  if (status.key === 'due_today') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }

  if (status.key === 'paused') {
    return 'border-border bg-secondary text-muted-foreground';
  }

  return 'border-primary/20 bg-primary/10 text-primary';
}

