import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Edit3,
  PauseCircle,
  PlayCircle,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

const emptyForm = () => ({
  name: '',
  amount: '',
  type: 'expense',
  category_id: 'none',
  account_id: 'none',
  to_account_id: 'none',
  frequency: 'monthly',
  next_due_date: todayIsoDate(),
  is_active: true,
  note: '',
});

const typeOptions = [
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'transfer', label: 'Debt Payment / Transfer', icon: ArrowLeftRight },
];

function NativeSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
}

function normalizeType(type) {
  if (type === 'saving') return 'savings';
  if (type === 'liability') return 'debt';
  return String(type || '').toLowerCase();
}

function getTypeIcon(type) {
  if (type === 'income') return ArrowDownLeft;
  if (type === 'transfer') return ArrowLeftRight;
  return ArrowUpRight;
}

function getTypeLabel(type) {
  if (type === 'income') return 'Income';
  if (type === 'transfer') return 'Debt / Transfer';
  return 'Expense';
}

function getStatusClass(status) {
  if (status.key === 'overdue') return 'border-destructive/20 bg-destructive/10 text-destructive';
  if (status.key === 'due_today') return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  if (status.key === 'paused') return 'border-border bg-secondary text-muted-foreground';
  return 'border-primary/20 bg-primary/10 text-primary';
}

function RecurringDialog({ open, onOpenChange, editingRule, accounts, categories, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    if (editingRule) {
      setForm({
        name: editingRule.name || '',
        amount: String(editingRule.amount ?? ''),
        type: editingRule.type || 'expense',
        category_id: editingRule.category_id || 'none',
        account_id: editingRule.account_id || 'none',
        to_account_id: editingRule.to_account_id || 'none',
        frequency: editingRule.frequency || 'monthly',
        next_due_date: editingRule.next_due_date || todayIsoDate(),
        is_active: editingRule.is_active !== false,
        note: editingRule.note || '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [editingRule, open]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const type = normalizeType(category.type);
      if (form.type === 'income') return type === 'income';
      if (form.type === 'expense') return type === 'expense';
      return type === 'debt' || type === 'savings';
    });
  }, [categories, form.type]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
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

    onSave({
      name: form.name.trim(),
      amount,
      type: form.type,
      category_id: form.category_id === 'none' ? null : form.category_id,
      account_id: form.account_id === 'none' ? null : form.account_id,
      to_account_id: form.type === 'transfer' && form.to_account_id !== 'none' ? form.to_account_id : null,
      frequency: form.frequency,
      start_date: editingRule?.start_date || form.next_due_date,
      next_due_date: form.next_due_date,
      is_active: form.is_active,
      note: form.note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border/60 bg-card/95 p-5 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingRule ? 'Edit recurring rule' : 'Add recurring rule'}</DialogTitle>
          <DialogDescription>
            Manage Plan only creates and edits rules. Posting happens later from Transactions → Scheduled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="Rent, salary, car loan..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <NativeSelect value={form.type} onChange={(value) => updateForm('type', value)}>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <NativeSelect value={form.category_id} onChange={(value) => updateForm('category_id', value)}>
                <option value="none">No category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Account</label>
              <NativeSelect value={form.account_id} onChange={(value) => updateForm('account_id', value)}>
                <option value="none">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {form.type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Destination account</label>
              <NativeSelect value={form.to_account_id} onChange={(value) => updateForm('to_account_id', value)}>
                <option value="none">Optional destination</option>
                {accounts
                  .filter((account) => account.id !== form.account_id)
                  .map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
              </NativeSelect>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Frequency</label>
              <NativeSelect value={form.frequency} onChange={(value) => updateForm('frequency', value)}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Next due date</label>
              <Input
                value={form.next_due_date}
                onChange={(event) => updateForm('next_due_date', event.target.value)}
                type="date"
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <span>
              <span className="font-medium">Rule status</span>
              <span className="block text-xs text-muted-foreground">Paused rules stay saved but will not appear as active scheduled items.</span>
            </span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => updateForm('is_active', event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Optional note"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Rule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecurringRow({ rule, account, category, onEdit, onToggle, onDelete, formatCurrency }) {
  const status = getRecurringStatus(rule);
  const Icon = getTypeIcon(rule.type);

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{rule.name}</p>
          <Badge variant="outline" className={cn('shrink-0 rounded-full px-2 py-0 text-[10px]', getStatusClass(status))}>
            {status.label}
          </Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {getTypeLabel(rule.type)} · {getRecurringFrequencyLabel(rule.frequency)} · Next {formatRecurringDate(rule.next_due_date)}
          {category ? ` · ${category.name}` : ''}
          {account ? ` · ${account.name}` : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums">{formatCurrency(Math.abs(Number(rule.amount || 0)))}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Manual post
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onToggle(rule)}>
          {rule.is_active === false ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onEdit(rule)}>
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => onDelete(rule)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ManageRecurringPanel() {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { data: recurringRules = [] } = useRecurringTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const sortedRules = [...recurringRules].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active === false ? 1 : -1;
    return String(a.next_due_date || '').localeCompare(String(b.next_due_date || ''));
  });

  const groupedRules = {
    income: sortedRules.filter((rule) => rule.type === 'income'),
    expense: sortedRules.filter((rule) => rule.type === 'expense'),
    transfer: sortedRules.filter((rule) => rule.type === 'transfer'),
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
  };

  const openNew = () => {
    setEditingRule(null);
    setDialogOpen(true);
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

      refresh();
      setDialogOpen(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Recurring rule save failed:', error);
      toast.error(error.message || 'Could not save recurring rule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      await recurringTransactionsApi.update(rule.id, { is_active: rule.is_active === false });
      refresh();
      toast.success(rule.is_active === false ? 'Recurring rule resumed' : 'Recurring rule paused');
    } catch (error) {
      console.error('Recurring rule toggle failed:', error);
      toast.error(error.message || 'Could not update recurring rule');
    }
  };

  const handleDelete = async (rule) => {
    try {
      await recurringTransactionsApi.delete(rule.id);
      refresh();
      toast.success('Recurring rule deleted');
    } catch (error) {
      console.error('Recurring rule delete failed:', error);
      toast.error(error.message || 'Could not delete recurring rule');
    }
  };

  const renderGroup = (title, rules, emptyText) => (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {rules.length}
        </span>
      </div>

      {rules.length ? (
        <div className="divide-y divide-border/50">
          {rules.map((rule) => (
            <RecurringRow
              key={rule.id}
              rule={rule}
              account={accounts.find((account) => account.id === rule.account_id)}
              category={categories.find((category) => category.id === rule.category_id)}
              onEdit={(nextRule) => {
                setEditingRule(nextRule);
                setDialogOpen(true);
              }}
              onToggle={handleToggle}
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Recurring rules</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create predictable income, bills, subscriptions, and debt payments. Nothing is posted from this page.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNew} className="gap-2 rounded-xl text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-4">
        {renderGroup('Income', groupedRules.income, 'No recurring income rules yet.')}
        {renderGroup('Expenses', groupedRules.expense, 'No recurring expense rules yet.')}
        {renderGroup('Debt Payments / Transfers', groupedRules.transfer, 'No recurring debt payment or transfer rules yet.')}
      </div>

      <RecurringDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        editingRule={editingRule}
        accounts={accounts}
        categories={categories}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
