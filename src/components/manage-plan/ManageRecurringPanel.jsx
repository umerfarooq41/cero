import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  ArchiveRestore,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import CategoryIcon, { iconNames } from '@/components/shared/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { recurringTransactionsApi } from '@/lib/budgetData';
import {
  formatRecurringDate,
  FREQUENCY_OPTIONS,
  getRecurringFrequencyLabel,
  getRecurringStatus,
  todayIsoDate,
} from '@/lib/recurringTransactions';
import {
  useAccounts,
  useCategories,
  useRecurringTransactions,
} from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

const COLORS = [
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

const TYPE_ACCENT = {
  income: 'text-green-700 dark:text-green-400',
  expense: 'text-red-700 dark:text-red-400',
  transfer: 'text-purple-700 dark:text-purple-400',
};

const TYPE_ICONS = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
};

const TYPE_LABELS = {
  income: 'Income',
  expense: 'Expenses',
  transfer: 'Debt Payments',
};

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const emptyForm = (type = 'expense') => ({
  name: '',
  amount: '',
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

function normalizeCategoryType(type) {
  if (type === 'saving') return 'savings';
  if (type === 'liability') return 'debt';
  return String(type || '').toLowerCase();
}

function normalizeRuleType(type) {
  if (type === 'debt') return 'transfer';
  return ['income', 'expense', 'transfer'].includes(type) ? type : 'expense';
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

function RecurringRuleModal({
  open,
  onClose,
  onSave,
  editingRule = null,
  initialType = 'expense',
  accounts = [],
  categories = [],
  saving = false,
}) {
  const nameRef = useRef(null);
  const [form, setForm] = useState(() => emptyForm(initialType));
  const isEditing = !!editingRule;

  useEffect(() => {
    if (!open) return;

    if (editingRule) {
      setForm({
        name: editingRule.name || '',
        amount: String(editingRule.amount ?? ''),
        type: normalizeRuleType(editingRule.type),
        category_id: editingRule.category_id || 'none',
        account_id: editingRule.account_id || 'none',
        to_account_id: editingRule.to_account_id || 'none',
        frequency: editingRule.frequency || 'monthly',
        next_due_date: editingRule.next_due_date || todayIsoDate(),
        is_active: editingRule.is_active !== false,
        icon: editingRule.icon || 'receipt',
        color: editingRule.color || COLORS[0],
        note: editingRule.note || '',
      });
    } else {
      setForm(emptyForm(initialType));
    }

    setTimeout(() => nameRef.current?.focus(), 80);
  }, [editingRule, initialType, open]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const type = normalizeCategoryType(category.type);

      if (form.type === 'income') return type === 'income';
      if (form.type === 'expense') return type === 'expense';

      return type === 'debt' || type === 'savings';
    });
  }, [categories, form.type]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const amount = Number(form.amount || 0);

    if (!form.name.trim()) {
      toast.error('Enter a recurring rule name');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (form.account_id === 'none') {
      toast.error('Select an account');
      return;
    }

    if (!form.next_due_date) {
      toast.error('Select the next due date');
      return;
    }

    await onSave({
      name: form.name.trim(),
      amount,
      type: form.type,
      category_id: form.category_id === 'none' ? null : form.category_id,
      account_id: form.account_id === 'none' ? null : form.account_id,
      to_account_id:
        form.type === 'transfer' && form.to_account_id !== 'none'
          ? form.to_account_id
          : null,
      frequency: form.frequency,
      start_date: editingRule?.start_date || form.next_due_date,
      next_due_date: form.next_due_date,
      is_active: form.is_active,
      icon: form.icon,
      color: form.color,
      note: form.note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Recurring Rule' : 'New Recurring Rule'}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/45 p-3 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
          <CategoryIcon icon={form.icon} color={form.color} size="lg" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {form.name.trim() || 'Recurring Rule'}
            </div>
            <div className="text-xs capitalize text-muted-foreground">
              {TYPE_LABELS[form.type] || 'Expense'} · Manual post only
            </div>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <Input
              ref={nameRef}
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="e.g. Rent, Salary, Car Loan"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSave();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(TYPE_LABELS).map(([value, label]) => {
                const Icon = TYPE_ICONS[value];

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      updateForm('type', value);
                      updateForm('category_id', 'none');
                      updateForm('to_account_id', 'none');
                    }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all',
                      form.type === value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label.replace(' Payments', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount
              </label>
              <Input
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Frequency
              </label>
              <Select value={form.frequency} onValueChange={(value) => updateForm('frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Category
              </label>
              <Select value={form.category_id} onValueChange={(value) => updateForm('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account
              </label>
              <Select value={form.account_id} onValueChange={(value) => updateForm('account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select account</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Destination Account Optional
              </label>
              <Select value={form.to_account_id} onValueChange={(value) => updateForm('to_account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Optional destination</SelectItem>
                  {accounts
                    .filter((account) => account.id !== form.account_id)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next Due Date
            </label>
            <Input
              value={form.next_due_date}
              onChange={(event) => updateForm('next_due_date', event.target.value)}
              type="date"
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/35 px-4 py-3 text-sm backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
            <span>
              <span className="font-medium">Active rule</span>
              <span className="block text-xs text-muted-foreground">
                Paused rules stay saved but are not treated as active scheduled items.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => updateForm('is_active', event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2 rounded-xl border border-white/40 bg-white/35 p-2 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('color', item)}
                  className={cn(
                    'h-8 w-8 rounded-xl border border-border transition-all',
                    form.color === item
                      ? 'scale-110 ring-2 ring-primary ring-offset-2'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: item }}
                  aria-label={`Use color ${item}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Icon
            </label>
            <div className="grid max-h-52 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-white/40 bg-white/35 p-2 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03] sm:grid-cols-7 md:grid-cols-8">
              {iconNames.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('icon', item)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl border transition-all',
                    form.icon === item
                      ? 'scale-105 border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-transparent hover:border-border hover:bg-accent'
                  )}
                  title={item}
                >
                  <CategoryIcon
                    icon={item}
                    color={form.icon === item ? form.color : '#888'}
                    size="sm"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Note
            </label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Optional note"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecurringActionSheet({ rule, open, onClose, onEdit, onArchive, onDelete }) {
  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <CategoryIcon icon={rule.icon || 'receipt'} color={rule.color || COLORS[0]} size="md" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">{rule.name}</DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {TYPE_LABELS[normalizeRuleType(rule.type)] || 'Expense'} rule
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1 py-1">
          <button
            type="button"
            onClick={() => {
              onEdit(rule);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Edit Rule</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onArchive(rule);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            {rule.is_archived ? (
              <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Archive className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {rule.is_archived ? 'Unarchive' : 'Archive Rule'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(rule);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Delete Rule</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecurringRow({ rule, account, category, onAction, formatCurrency }) {
  const status = getRecurringStatus(rule);
  const fallbackIcon = normalizeRuleType(rule.type) === 'income' ? 'income' : normalizeRuleType(rule.type) === 'transfer' ? 'loan' : 'receipt';

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
      <CategoryIcon
        icon={rule.icon || category?.icon || fallbackIcon}
        color={rule.color || category?.color || COLORS[0]}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-sm font-medium leading-tight">{rule.name}</div>
          <Badge
            variant="outline"
            className={cn('shrink-0 rounded-full px-2 py-0 text-[10px]', getStatusClass(status))}
          >
            {status.label}
          </Badge>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {getRecurringFrequencyLabel(rule.frequency)} · Next {formatRecurringDate(rule.next_due_date)}
          {category ? ` · ${category.name}` : ''}
          {account ? ` · ${account.name}` : ''}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums">
          {formatCurrency(Math.abs(Number(rule.amount || 0)))}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Manual post
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAction(rule)}
        className="rounded-md p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`Open actions for ${rule.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

function RecurringSection({ type, label, rules, accounts, categories, defaultExpanded = false, onAddNew, onAction, formatCurrency }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const Icon = TYPE_ICONS[type] || ArrowUpRight;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/30"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              !isOpen && '-rotate-90'
            )}
          />
          <Icon className={cn('h-4 w-4', TYPE_ACCENT[type])} />
          <h3 className={cn('text-sm font-semibold', TYPE_ACCENT[type])}>{label}</h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {rules.length}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddNew(type);
            }}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="Add recurring rule"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {rules.length === 0 ? (
              <div className="border-t border-border/50 px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No {label.toLowerCase()} recurring rules yet.
                </p>
                <button
                  type="button"
                  onClick={() => onAddNew(type)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  Add one
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50">
                {rules.map((rule) => (
                  <RecurringRow
                    key={rule.id}
                    rule={rule}
                    account={accounts.find((account) => account.id === rule.account_id)}
                    category={categories.find((category) => category.id === rule.category_id)}
                    onAction={onAction}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ManageRecurringPanel() {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { data: recurringRules = [] } = useRecurringTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [initialType, setInitialType] = useState('expense');
  const [saving, setSaving] = useState(false);

  const visibleRules = useMemo(() => {
    return recurringRules
      .filter((rule) => !rule.is_archived)
      .sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active === false ? 1 : -1;
        return String(a.next_due_date || '').localeCompare(String(b.next_due_date || ''));
      });
  }, [recurringRules]);

  const groupedRules = useMemo(() => {
    return {
      income: visibleRules.filter((rule) => normalizeRuleType(rule.type) === 'income'),
      expense: visibleRules.filter((rule) => normalizeRuleType(rule.type) === 'expense'),
      transfer: visibleRules.filter((rule) => normalizeRuleType(rule.type) === 'transfer'),
    };
  }, [visibleRules]);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => query.queryKey?.[0] === 'recurring-transactions',
    });
  };

  const openNew = (type = 'expense') => {
    setInitialType(type);
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setInitialType(normalizeRuleType(rule.type));
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);

    try {
      if (editingRule?.id) {
        await recurringTransactionsApi.update(editingRule.id, payload);
        toast.success('Recurring rule updated');
      } else {
        await recurringTransactionsApi.create(payload);
        toast.success('Recurring rule created');
      }

      await refresh();
      setModalOpen(false);
      setEditingRule(null);
      setSelectedRule(null);
    } catch (error) {
      console.error('Recurring rule save failed:', error);
      toast.error(error.message || 'Could not save recurring rule');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (rule) => {
    try {
      await recurringTransactionsApi.update(rule.id, {
        is_archived: !rule.is_archived,
      });
      await refresh();
      toast.success(rule.is_archived ? 'Recurring rule restored' : 'Recurring rule archived');
    } catch (error) {
      console.error('Recurring rule archive failed:', error);
      toast.error(error.message || 'Could not archive recurring rule');
    }
  };

  const handleDelete = async (rule) => {
    try {
      await recurringTransactionsApi.delete(rule.id);
      await refresh();
      toast.success('Recurring rule deleted');
    } catch (error) {
      console.error('Recurring rule delete failed:', error);
      toast.error(error.message || 'Could not delete recurring rule');
    }
  };

  const handleAction = (rule) => {
    setSelectedRule(rule);
    setActionSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Recurring</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage predictable income, bills, subscriptions, and debt payments. Posting happens from Transactions → Scheduled.
          </p>
        </div>
        <Button onClick={() => openNew('expense')} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-3">
        <RecurringSection
          type="income"
          label="Income"
          rules={groupedRules.income}
          accounts={accounts}
          categories={categories}
          defaultExpanded
          onAddNew={openNew}
          onAction={handleAction}
          formatCurrency={formatCurrency}
        />

        <RecurringSection
          type="expense"
          label="Expenses"
          rules={groupedRules.expense}
          accounts={accounts}
          categories={categories}
          defaultExpanded
          onAddNew={openNew}
          onAction={handleAction}
          formatCurrency={formatCurrency}
        />

        <RecurringSection
          type="transfer"
          label="Debt Payments"
          rules={groupedRules.transfer}
          accounts={accounts}
          categories={categories}
          defaultExpanded
          onAddNew={openNew}
          onAction={handleAction}
          formatCurrency={formatCurrency}
        />
      </div>

      <RecurringRuleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSave}
        editingRule={editingRule}
        initialType={initialType}
        accounts={accounts}
        categories={categories}
        saving={saving}
      />

      <RecurringActionSheet
        rule={selectedRule}
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onEdit={openEdit}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </div>
  );
}
