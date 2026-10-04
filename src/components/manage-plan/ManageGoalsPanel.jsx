import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  MoreVertical,
  Pencil,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import CategoryIcon, { iconNames } from '@/components/shared/CategoryIcon';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { savingsGoalsApi } from '@/lib/budgetData';
import {
  formatGoalDate,
  getGoalProgress,
  getGoalRemaining,
  todayIsoDate,
  getGoalStatus,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
} from '@/lib/goals';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { useAccounts, useAllTransactions } from '@/hooks/useBudgetData';
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

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const emptyGoalForm = () => ({
  name: '',
  target_amount: '',
  current_amount: '',
  target_date: '',
  duration_count: '',
  frequency: 'monthly',
  start_date: todayIsoDate(),
  contribution_mode: 'flexible',
  from_account_id: 'none',
  to_account_id: 'none',
  icon_key: 'target',
  color_key: randomColor(),
  note: '',
});

function normalizeAccountType(value) {
  return String(value || '').toLowerCase();
}

function normalizeAccountCategory(value) {
  return String(value || '').toLowerCase();
}

function isCheckingAccount(account) {
  return (
    normalizeAccountCategory(account?.category) === 'asset' &&
    normalizeAccountType(account?.type) === 'checking'
  );
}

function isSavingsAccount(account) {
  return (
    normalizeAccountCategory(account?.category) === 'asset' &&
    normalizeAccountType(account?.type) === 'savings'
  );
}

function getAccountLabel(account) {
  const type = String(account?.type || 'account').replace(/_/g, ' ');
  return `${account?.name || 'Account'} · ${type}`;
}

function addGoalDuration(count, unit) {
  const amount = Math.max(1, Math.floor(Number(count || 0)));
  const date = new Date();
  if (unit === 'weeks') date.setDate(date.getDate() + amount * 7);
  else if (unit === 'years') date.setFullYear(date.getFullYear() + amount);
  else date.setMonth(date.getMonth() + amount);
  return todayIsoDate(date);
}

function getFixedGoalTargetDate(startDate, count, frequency) {
  if (!startDate || Number(count) <= 0) return '';
  const date = new Date(`${startDate}T00:00:00`);
  const steps = Math.max(0, Math.floor(Number(count)) - 1);
  for (let index = 0; index < steps; index += 1) {
    if (frequency === 'weekly') date.setDate(date.getDate() + 7);
    else if (frequency === 'biweekly') date.setDate(date.getDate() + 14);
    else if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
    else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function getGoalTransactionGoalId(transaction) {
  return transaction?.savings_goal_id || transaction?.goal_id || null;
}

function sumPostedGoalTransactionsByGoal(transactions = []) {
  return transactions.reduce((totals, transaction) => {
    const goalId = getGoalTransactionGoalId(transaction);

    if (!goalId || transaction?.type !== 'transfer') return totals;

    totals[goalId] = (totals[goalId] || 0) + Math.max(0, Number(transaction?.amount || 0));
    return totals;
  }, {});
}



function GoalActionSheet({ goal, open, onClose, onEdit, onArchive, onDelete }) {
  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <CategoryIcon icon={goal.icon_key || 'target'} color={goal.color_key || '#276FE4'} size="md" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">{goal.name}</DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {goal.is_archived ? 'Archived savings goal' : 'Savings goal'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1 py-1">
          <button
            type="button"
            onClick={() => {
              onEdit(goal);
              onClose(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Edit Goal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onArchive(goal);
              onClose(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            {goal.is_archived ? (
              <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Archive className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {goal.is_archived ? 'Restore Goal' : 'Archive Goal'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(goal);
              onClose(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Delete Goal</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({ open, onOpenChange, editingGoal, onSave, saving, accounts = [] }) {
  const nameRef = useRef(null);
  const [form, setForm] = useState(emptyGoalForm);

  useEffect(() => {
    if (!open) return;

    if (editingGoal) {
      setForm({
        name: editingGoal.name || '',
        target_amount: String(editingGoal.target_amount ?? ''),
        current_amount: String(editingGoal.starting_amount ?? editingGoal.current_amount ?? ''),
        target_date: editingGoal.target_date || '',
        duration_count: String(editingGoal.duration_count ?? ''),
        frequency: editingGoal.frequency || (editingGoal.duration_unit === 'weeks' ? 'weekly' : editingGoal.duration_unit === 'years' ? 'yearly' : 'monthly'),
        start_date: editingGoal.start_date || editingGoal.next_due_date || new Date().toISOString().slice(0, 10),
        contribution_mode: editingGoal.contribution_mode || 'flexible',
        from_account_id: editingGoal.from_account_id || 'none',
        to_account_id: editingGoal.to_account_id || 'none',
        icon_key: editingGoal.icon_key || 'target',
        color_key: editingGoal.color_key || '#276FE4',
        note: editingGoal.note || '',
      });
    } else {
      setForm(emptyGoalForm());
    }

    setTimeout(() => nameRef.current?.focus(), 80);
  }, [editingGoal, open]);

  const checkingAccounts = useMemo(
    () => accounts.filter((account) => isCheckingAccount(account)),
    [accounts]
  );

  const savingsAccounts = useMemo(
    () => accounts.filter((account) => isSavingsAccount(account)),
    [accounts]
  );

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const targetAmount = Number(form.target_amount || 0);
    const currentAmount = Number(form.current_amount || 0);

    if (!form.name.trim()) {
      toast.error('Enter a goal name');
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      toast.error('Enter a valid target amount');
      return;
    }

    if (currentAmount < 0) {
      toast.error('Starting amount cannot be negative');
      return;
    }

    if (currentAmount > targetAmount) {
      toast.error('Starting amount cannot be higher than the target');
      return;
    }

    if (form.from_account_id === 'none') {
      toast.error('Select a from account');
      return;
    }

    if (form.to_account_id === 'none') {
      toast.error('Select a savings account');
      return;
    }

    if (form.from_account_id === form.to_account_id) {
      toast.error('From and to accounts must be different');
      return;
    }

    onSave({
      name: form.name.trim(),
      target_amount: targetAmount,
      starting_amount: currentAmount,
      current_amount: currentAmount,
      target_date: form.contribution_mode === 'fixed'
        ? getFixedGoalTargetDate(form.start_date, form.duration_count, form.frequency)
        : (form.target_date || null),
      duration_count: Number(form.duration_count) > 0 ? Math.floor(Number(form.duration_count)) : null,
      duration_unit: Number(form.duration_count) > 0 ? (form.frequency === 'weekly' ? 'weeks' : form.frequency === 'yearly' ? 'years' : 'months') : null,
      frequency: form.contribution_mode === 'fixed' ? form.frequency : null,
      start_date: form.contribution_mode === 'fixed' ? form.start_date : null,
      next_due_date: form.contribution_mode === 'fixed' ? form.start_date : null,
      completed_at: editingGoal?.completed_at || null,
      contribution_mode: form.contribution_mode,
      from_account_id: form.from_account_id === 'none' ? null : form.from_account_id,
      to_account_id: form.to_account_id === 'none' ? null : form.to_account_id,
      icon_key: form.icon_key || 'target',
      color_key: form.color_key || '#276FE4',
      note: form.note.trim() || null,
    });
  };

  const isEditing = Boolean(editingGoal?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl app-card-surface-strong p-5 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl app-card-surface-soft p-3">
          <CategoryIcon icon={form.icon_key || 'target'} color={form.color_key || '#276FE4'} size="lg" />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{form.name.trim() || 'Goal Name'}</div>
            <div className="text-xs text-muted-foreground">
              Target {form.target_amount ? Number(form.target_amount).toLocaleString() : '0'}
              {form.target_date ? ` · ${formatGoalDate(form.target_date)}` : ''}
            </div>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</label>
            <Input
              ref={nameRef}
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="e.g. Emergency fund"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSubmit();
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target amount</label>
              <Input
                value={form.target_amount}
                onChange={(event) => updateForm('target_amount', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="10000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starting amount</label>
              <Input
                value={form.current_amount}
                onChange={(event) => updateForm('current_amount', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
              />
            </div>

            {form.contribution_mode !== 'fixed' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target date</label>
                <Input
                  value={form.target_date}
                  onChange={(event) => updateForm('target_date', event.target.value)}
                  type="date"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contribution mode</label>
            <Select value={form.contribution_mode} onValueChange={(value) => updateForm('contribution_mode', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed contributions</SelectItem>
                <SelectItem value="flexible">Flexible contributions</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{form.contribution_mode === 'fixed' ? 'Each planned contribution completes one scheduled occurrence.' : 'Contribute any amount, multiple times whenever you want.'}</p>
          </div>

          {form.contribution_mode === 'fixed' && (
            <div className="rounded-2xl app-card-surface-soft p-3 space-y-3">
              <div>
                <p className="text-sm font-semibold">Contribution schedule</p>
                <p className="text-xs text-muted-foreground">Set the number of contributions, their frequency, and the first contribution due date.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contributions</label>
                  <Input value={form.duration_count} onChange={(event) => updateForm('duration_count', event.target.value)} type="number" min="1" step="1" inputMode="numeric" placeholder="12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contribution frequency</label>
                  <Select value={form.frequency} onValueChange={(value) => updateForm('frequency', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">First contribution due</label>
                  <Input value={form.start_date} onChange={(event) => updateForm('start_date', event.target.value)} type="date" />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From account</label>
              <Select value={form.from_account_id} onValueChange={(value) => updateForm('from_account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select checking account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select checking account</SelectItem>
                  {checkingAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountLabel(account)}
                    </SelectItem>
                  ))}
                  {checkingAccounts.length === 0 && (
                    <SelectItem value="no-checking-accounts" disabled>
                      No checking accounts
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To account</label>
              <Select value={form.to_account_id} onValueChange={(value) => updateForm('to_account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select savings account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select savings account</SelectItem>
                  {savingsAccounts
                    .filter((account) => account.id !== form.from_account_id)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {getAccountLabel(account)}
                      </SelectItem>
                    ))}
                  {savingsAccounts.length === 0 && (
                    <SelectItem value="no-savings-accounts" disabled>
                      No savings accounts
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Color</label>

            <div className="grid grid-cols-8 gap-2 py-1">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('color_key', item)}
                  className={cn(
                    'app-color-swatch',
                    form.color_key === item ? 'is-selected' : ''
                  )}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Icon</label>

            <div className="grid max-h-52 grid-cols-7 gap-2 overflow-y-auto py-1">
              {iconNames.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('icon_key', item)}
                  className={cn(
                    'app-icon-choice', form.icon_key === item && 'is-selected'
                  )}
                  title={item}
                >
                  <CategoryIcon icon={item} color={form.icon_key === item ? form.color_key : '#888'} size="sm" bare />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note</label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Why this goal matters"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="app-dialog-actions">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalRow({ goal, onAction, formatCurrency }) {
  const progress = getGoalProgress(goal);
  const target = Number(goal.target_amount || 0);
  const monthlyRequired = getMonthlyRequiredSaving(goal);
  const remaining = getGoalRemaining(goal);
  const status = getGoalStatus(goal);
  const color = goal.color_key || '#276FE4';
  const isArchived = Boolean(goal.is_archived);
  const isCompleted = remaining <= 0 || progress >= 100;
  const statusLabel = status.key === 'due' ? 'Target passed' : status.label;

  return (
    <div className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40">
      <CategoryIcon icon={goal.icon_key || 'target'} color={color} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className={cn('min-w-0 truncate text-sm font-semibold leading-tight', isArchived && 'text-muted-foreground line-through')}>
            {goal.name}
          </h3>

          <div className={cn(
            'shrink-0 text-right text-sm font-semibold tabular-nums',
            isCompleted ? 'text-green-700 dark:text-green-400' : 'text-foreground'
          )}>
            {isCompleted ? 'Completed' : monthlyRequired === null ? 'Set target' : formatCurrency(monthlyRequired)}
          </div>
        </div>

        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {isArchived
            ? `Archived · ${progress}% complete`
            : isCompleted
              ? `Completed${goal.completed_at ? ` · ${formatGoalDate(goal.completed_at)}` : ''}`
              : `${statusLabel} · ${progress}% complete`}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          Target {formatCurrency(target)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onAction(goal)}
        className="-mr-1 rounded-md p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`Open actions for ${goal.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

function GoalSection({ title, tone, goals, defaultExpanded = false, emptyText, onAddNew, onAction, formatCurrency }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const toneClass =
    tone === 'active'
      ? 'text-blue-700 dark:text-blue-400'
      : tone === 'completed'
        ? 'text-green-700 dark:text-green-400'
        : 'text-muted-foreground';

  return (
    <div className="overflow-hidden rounded-2xl app-card-surface">
      <div className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/30">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              !isOpen && '-rotate-90'
            )}
          />
          <h3 className={cn('truncate text-sm font-semibold', toneClass)}>{title}</h3>
        </button>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {goals.length}
          </span>

          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              title="Add goal"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {goals.length === 0 ? (
              <div className="border-t border-border/50 px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">{emptyText}</p>
                {onAddNew && (
                  <button type="button" onClick={onAddNew} className="mt-1 text-xs font-medium text-primary hover:underline">
                    Add one
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50">
                {goals.map((goal) => (
                  <GoalRow key={goal.id} goal={goal} onAction={onAction} formatCurrency={formatCurrency} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ManageGoalsPanel() {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['manage-savings-goals'],
    queryFn: () => savingsGoalsApi.list(),
    initialData: [],
  });

  const postedGoalTotals = useMemo(
    () => sumPostedGoalTransactionsByGoal(allTransactions),
    [allTransactions]
  );

  const normalizedGoals = useMemo(
    () => savingsGoals.map((goal) => {
      const postedTotal = Number(postedGoalTotals[goal.id] || 0);
      const startingAmount = Math.max(
        0,
        Number(goal.starting_amount ?? (Number(goal.current_amount || 0) - postedTotal))
      );

      return {
        ...goal,
        starting_amount: startingAmount,
      };
    }),
    [postedGoalTotals, savingsGoals]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const groupedGoals = useMemo(() => {
    const sortedGoals = sortGoalsByPriority(normalizedGoals);

    return {
      active: sortedGoals.filter((goal) => !goal.is_archived && getGoalRemaining(goal) > 0),
      completed: sortedGoals.filter((goal) => !goal.is_archived && getGoalRemaining(goal) <= 0),
      archived: sortedGoals.filter((goal) => goal.is_archived),
    };
  }, [normalizedGoals]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['manage-savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['allocations'] });
    queryClient.invalidateQueries({ queryKey: ['all-allocations'] });
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    queryClient.invalidateQueries({ queryKey: ['plan-data'] });
  };

  const openNew = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);

    try {
      let savedGoal;

      if (editingGoal?.id) {
        const postedTotal = Number(postedGoalTotals[editingGoal.id] || 0);
        const goalPayload = {
          ...payload,
          current_amount: Number(payload.starting_amount || 0) + postedTotal,
        };

        savedGoal = await savingsGoalsApi.update(editingGoal.id, goalPayload);
        toast.success('Savings goal updated');
      } else {
        const goalPayload = {
          ...payload,
          current_amount: Number(payload.starting_amount || 0),
        };

        savedGoal = await savingsGoalsApi.create(goalPayload);
        toast.success('Savings goal created');
      }

      refresh();
      setDialogOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Savings goal save failed:', error);
      toast.error(error.message || 'Could not save savings goal');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (goal) => {
    try {
      await savingsGoalsApi.update(goal.id, {
        is_archived: !goal.is_archived,
        archived_at: goal.is_archived ? null : new Date().toISOString(),
      });
      refresh();
      toast.success(goal.is_archived ? 'Savings goal restored' : 'Savings goal archived');
    } catch (error) {
      console.error('Savings goal archive failed:', error);
      toast.error(error.message || 'Could not update savings goal');
    }
  };

  const handleDelete = async (goal) => {
    try {
      await savingsGoalsApi.delete(goal.id);
      refresh();
      setDeleteTarget(null);
      toast.success('Savings goal deleted');
    } catch (error) {
      console.error('Savings goal delete failed:', error);
      toast.error(error.message || 'Could not delete savings goal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl app-card-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Savings goals</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create and manage long-term targets. Contributions are handled in Transactions, not here.
          </p>
        </div>

        <Button type="button" size="sm" onClick={openNew} className="gap-2 rounded-xl text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        <GoalSection
          title="Active Goals"
          tone="active"
          goals={groupedGoals.active}
          defaultExpanded
          emptyText="No active savings goals yet."
          onAddNew={openNew}
          onAction={setActionTarget}
          formatCurrency={formatCurrency}
        />

        <GoalSection
          title="Completed Goals"
          tone="completed"
          goals={groupedGoals.completed}
          defaultExpanded={groupedGoals.active.length === 0}
          emptyText="Completed goals will appear here."
          onAction={setActionTarget}
          formatCurrency={formatCurrency}
        />

        {groupedGoals.archived.length > 0 && (
          <GoalSection
            title="Archived Goals"
            tone="archived"
            goals={groupedGoals.archived}
            emptyText="Archived goals will appear here."
            onAction={setActionTarget}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        onSave={handleSave}
        saving={saving}
        accounts={accounts}
      />

      <GoalActionSheet
        goal={actionTarget}
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onEdit={(goal) => {
          setEditingGoal(goal);
          setDialogOpen(true);
        }}
        onArchive={handleArchive}
        onDelete={setDeleteTarget}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete savings goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the goal definition. Existing linked history may not be recoverable from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleDelete(deleteTarget)}
            >
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
