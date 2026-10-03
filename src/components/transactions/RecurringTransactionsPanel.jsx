import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  PauseCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import TransactionTypeTabs from '@/components/shared/TransactionTypeTabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { accountsApi, recurringTransactionsApi, transactionsApi } from '@/lib/budgetData';
import {
  calculateNextDueDate,
  formatRecurringDate,
  FREQUENCY_OPTIONS,
  getRecurringFrequencyLabel,
  getRecurringStatus,
  sortRecurringByDueDate,
  todayIsoDate,
} from '@/lib/recurringTransactions';
import { cn } from '@/lib/utils';

const typeOptions = [
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

const emptyForm = () => ({
  name: '',
  amount: '',
  type: 'expense',
  account_id: '',
  to_account_id: '',
  category_id: '',
  frequency: 'monthly',
  next_due_date: todayIsoDate(),
  note: '',
  is_active: true,
});

function normalizeCategoryType(value) {
  const normalized = String(value || '').toLowerCase().trim();

  if (normalized === 'saving') return 'savings';
  if (normalized === 'liability') return 'debt';

  return normalized;
}

function getAccountType(account) {
  return account?.type || account?.account_type || '';
}

function isDebtAccount(account) {
  const accountType = getAccountType(account);

  return (
    account?.category === 'liability' ||
    accountType === 'credit_card' ||
    accountType === 'loan' ||
    accountType === 'debt'
  );
}

function isSavingsAccount(account) {
  const accountType = getAccountType(account);

  return accountType === 'savings' || accountType === 'investment';
}

function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

function getTransactionDeltas(transaction, accounts) {
  const deltas = {};
  const amount = Number(transaction.amount) || 0;

  const source = accounts.find((a) => a.id === transaction.account_id);
  const destination = accounts.find((a) => a.id === transaction.to_account_id);

  if (source) {
    const sourceDelta =
      transaction.type === 'income'
        ? source.category === 'liability'
          ? -amount
          : amount
        : source.category === 'liability'
          ? amount
          : -amount;

    addDelta(deltas, source.id, sourceDelta);
  }

  if (transaction.type === 'transfer' && destination) {
    const destinationDelta =
      destination.category === 'liability' ? -amount : amount;

    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
}

function getTypeIcon(type) {
  if (type === 'income') return ArrowDownLeft;
  if (type === 'transfer') return ArrowLeftRight;
  return ArrowUpRight;
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

function RuleAmount({ rule, formatCurrency }) {
  const amount = Math.abs(Number(rule.amount || 0));

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold tabular-nums',
        rule.type === 'income'
          ? 'text-[hsl(var(--success))]'
          : rule.type === 'expense'
            ? 'text-destructive'
            : 'text-sky-600 dark:text-sky-400'
      )}
    >
      {rule.type === 'income' ? '+' : rule.type === 'expense' ? '-' : ''}
      {formatCurrency(amount)}
    </span>
  );
}

function RecurringRuleDialog({
  open,
  onOpenChange,
  editingRule,
  accounts,
  categories,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    if (editingRule) {
      setForm({
        name: editingRule.name || '',
        amount: String(editingRule.amount ?? ''),
        type: editingRule.type || 'expense',
        account_id: editingRule.account_id || '',
        to_account_id: editingRule.to_account_id || '',
        category_id: editingRule.category_id || '',
        frequency: editingRule.frequency || 'monthly',
        next_due_date: editingRule.next_due_date || todayIsoDate(),
        note: editingRule.note || '',
        is_active: editingRule.is_active !== false,
      });
    } else {
      setForm(emptyForm());
    }
  }, [editingRule, open]);

  const selectedFromAccount = accounts.find((a) => a.id === form.account_id);
  const selectedToAccount = accounts.find((a) => a.id === form.to_account_id);

  const transferCategoryType = useMemo(() => {
    if (form.type !== 'transfer') return null;

    const involvesDebt =
      isDebtAccount(selectedFromAccount) || isDebtAccount(selectedToAccount);

    if (involvesDebt) return 'debt';

    const involvesSavings =
      isSavingsAccount(selectedFromAccount) || isSavingsAccount(selectedToAccount);

    if (involvesSavings) return 'savings';

    return null;
  }, [form.type, selectedFromAccount, selectedToAccount]);

  const filteredCategories = categories.filter((category) => {
    const categoryType = normalizeCategoryType(category.type);

    if (form.type === 'expense') return categoryType === 'expense';
    if (form.type === 'income') return categoryType === 'income';

    if (form.type === 'transfer') {
      if (!transferCategoryType) return false;
      return categoryType === transferCategoryType;
    }

    return false;
  });

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const amount = Number(form.amount || 0);

    if (!form.name.trim()) {
      toast.error('Enter a recurring name');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!form.account_id) {
      toast.error(form.type === 'transfer' ? 'Select a source account' : 'Select an account');
      return;
    }

    if (form.type === 'transfer' && !form.to_account_id) {
      toast.error('Select a destination account');
      return;
    }

    if (form.type === 'transfer' && form.account_id === form.to_account_id) {
      toast.error('Choose two different accounts for a transfer');
      return;
    }

    // Category is intentionally optional for recurring rules.
    // The database allows category_id to be null, and users may want to save
    // upcoming bills/income before assigning a budget category.
    if (!form.next_due_date) {
      toast.error('Select the next due date');
      return;
    }

    const payload = {
      name: form.name.trim(),
      amount,
      type: form.type,
      account_id: form.account_id,
      to_account_id: form.type === 'transfer' ? form.to_account_id : null,
      category_id: form.category_id || null,
      frequency: form.frequency,
      start_date: editingRule?.start_date || form.next_due_date,
      next_due_date: form.next_due_date,
      note: form.note.trim() || null,
      is_active: form.is_active,
    };

    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl app-card-surface-strong p-5 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? 'Edit recurring transaction' : 'Add recurring transaction'}
          </DialogTitle>
          <DialogDescription>
            Recurring items stay manual-post only. They become real transactions only when you press Post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="Rent, Salary, Internet bill..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              value={form.amount}
              onChange={(event) => updateForm('amount', event.target.value)}
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>

          <TransactionTypeTabs
            value={form.type}
            options={typeOptions}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                type: value,
                category_id: '',
                to_account_id: value === 'transfer' ? current.to_account_id : '',
              }));
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {form.type === 'transfer' ? 'From account' : 'Account'}
              </label>
              <Select
                value={form.account_id}
                onValueChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    account_id: value,
                    category_id: '',
                    to_account_id: value === current.to_account_id ? '' : current.to_account_id,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.type === 'transfer' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">To account</label>
                <Select
                  value={form.to_account_id}
                  onValueChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      to_account_id: value,
                      category_id: '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
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
          </div>

          {(form.type !== 'transfer' || transferCategoryType) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category optional</label>
              <Select
                value={form.category_id}
                onValueChange={(value) => updateForm('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category optional" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color || '#0078D4' }}
                        />
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredCategories.length === 0 && (
                <p className="text-xs leading-5 text-muted-foreground">
                  No matching categories found. You can still save this recurring rule and categorize it later.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Frequency</label>
              <Select
                value={form.frequency}
                onValueChange={(value) => updateForm('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Frequency" />
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Next due date</label>
              <Input
                type="date"
                value={form.next_due_date}
                onChange={(event) => updateForm('next_due_date', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Optional note shown when posting this transaction..."
              className="h-20 resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl app-card-surface-soft p-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Active recurring rule</p>
              <p className="text-xs text-muted-foreground">Turn off to pause without deleting.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(value) => updateForm('is_active', value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 border-t border-border/50 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editingRule ? 'Save Changes' : 'Add Recurring'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RecurringTransactionsPanel({
  recurringTransactions = [],
  categories = [],
  accounts = [],
  formatCurrency,
  compact = false,
  limit,
  title = 'Recurring transactions',
  subtitle = 'Manual-post upcoming bills and income. Nothing posts automatically.',
  className,
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [postingId, setPostingId] = useState(null);

  const sortedRules = useMemo(() => {
    const sorted = sortRecurringByDueDate(recurringTransactions);
    return limit ? sorted.slice(0, limit) : sorted;
  }, [limit, recurringTransactions]);

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setOpen(true);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);

    try {
      if (editingRule) {
        await recurringTransactionsApi.update(editingRule.id, payload);
        toast.success('Recurring transaction updated');
      } else {
        await recurringTransactionsApi.create(payload);
        toast.success('Recurring transaction added');
      }

      invalidateData();
      setOpen(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Recurring save failed:', error);
      toast.error(error.message || 'Could not save recurring transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    const confirmed = window.confirm(`Delete recurring transaction "${rule.name}"?`);
    if (!confirmed) return;

    try {
      await recurringTransactionsApi.delete(rule.id);
      invalidateData();
      toast.success('Recurring transaction deleted');
    } catch (error) {
      console.error('Recurring delete failed:', error);
      toast.error(error.message || 'Could not delete recurring transaction');
    }
  };

  const handlePost = async (rule) => {
    if (!rule.is_active) {
      toast.error('This recurring transaction is paused');
      return;
    }

    setPostingId(rule.id);

    try {
      const postedForDate = rule.next_due_date || todayIsoDate();
      const transactionPayload = {
        amount: Number(rule.amount || 0),
        type: rule.type,
        date: postedForDate,
        note: rule.note || `${rule.name} · Recurring`,
        category_id: rule.category_id || null,
        account_id: rule.account_id || null,
        to_account_id: rule.type === 'transfer' ? rule.to_account_id || null : null,
        recurring_transaction_id: rule.id,
        recurring_posted_for_date: postedForDate,
      };

      const transaction = await transactionsApi.create(transactionPayload);
      const deltas = getTransactionDeltas(transactionPayload, accounts);

      await Promise.all(
        Object.entries(deltas).map(([accountId, delta]) => {
          const account = accounts.find((item) => item.id === accountId);

          if (!account) return Promise.resolve();

          return accountsApi.update(accountId, {
            balance: (Number(account.balance) || 0) + delta,
          });
        })
      );

      await recurringTransactionsApi.update(rule.id, {
        last_posted_date: todayIsoDate(),
        last_posted_transaction_id: transaction.id,
        next_due_date: calculateNextDueDate(postedForDate, rule.frequency),
      });

      invalidateData();
      toast.success('Recurring transaction posted');
    } catch (error) {
      console.error('Recurring post failed:', error);
      toast.error(error.message || 'Could not post recurring transaction');
    } finally {
      setPostingId(null);
    }
  };

  return (
    <section className={cn('rounded-3xl app-card-surface p-4 md:p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarClock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground md:text-base">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" onClick={openCreateDialog} className="shrink-0 gap-1 rounded-xl">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {sortedRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 app-card-surface-soft px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No recurring transactions yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Add rent, salary, subscriptions, bills, or regular transfers and post them manually when ready.
          </p>
          <Button size="sm" variant="secondary" onClick={openCreateDialog} className="mt-4 rounded-xl">
            Add Recurring
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRules.map((rule) => {
            const status = getRecurringStatus(rule);
            const Icon = rule.is_active ? getTypeIcon(rule.type) : PauseCircle;
            const category = categories.find((item) => item.id === rule.category_id);
            const account = accounts.find((item) => item.id === rule.account_id);
            const toAccount = accounts.find((item) => item.id === rule.to_account_id);

            return (
              <div
                key={rule.id}
                className="rounded-2xl app-card-surface-soft p-3 transition-colors app-surface-hover"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
                      rule.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : rule.type === 'expense'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{rule.name}</p>
                      <Badge variant="outline" className={cn('rounded-full px-2 py-0 text-[10px]', getStatusClass(status))}>
                        {status.label}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                        Recurring
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {getRecurringFrequencyLabel(rule.frequency)} · Due {formatRecurringDate(rule.next_due_date)}
                    </p>

                    <p className="text-xs leading-5 text-muted-foreground/85">
                      {rule.type === 'transfer'
                        ? `${account?.name || 'Account'} → ${toAccount?.name || 'Account'}`
                        : `${category?.name || 'Uncategorized'} · ${account?.name || 'Account'}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <RuleAmount rule={rule} formatCurrency={formatCurrency} />
                  </div>
                </div>

                <div className={cn('mt-3 flex flex-wrap gap-2', compact && 'justify-end')}>
                  <Button
                    size="sm"
                    onClick={() => handlePost(rule)}
                    disabled={postingId === rule.id || !rule.is_active}
                    className="h-9 rounded-xl gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {postingId === rule.id ? 'Posting...' : 'Post Transaction'}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditDialog(rule)}
                    className="h-9 rounded-xl gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>

                  {!compact && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(rule)}
                      className="h-9 rounded-xl gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecurringRuleDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditingRule(null);
        }}
        editingRule={editingRule}
        accounts={accounts}
        categories={categories}
        onSave={handleSave}
        saving={saving}
      />
    </section>
  );
}
