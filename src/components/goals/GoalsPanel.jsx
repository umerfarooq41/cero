import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  WalletCards,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  goalContributionsApi,
  savingsGoalsApi,
  transactionsApi,
} from '@/lib/budgetData';
import {
  formatGoalDate,
  getDefaultSavingsCategory,
  getGoalProgress,
  getGoalRemaining,
  getGoalStatus,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
  todayIsoDate,
} from '@/lib/goals';
import { cn } from '@/lib/utils';

const emptyGoalForm = () => ({
  name: '',
  target_amount: '',
  target_date: '',
  note: '',
});

const emptyContributionForm = () => ({
  amount: '',
  account_id: '',
  contribution_date: todayIsoDate(),
  note: '',
});

function ProgressRing({ progress, size = 68 }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums text-foreground">
        {progress}%
      </div>
    </div>
  );
}

function GoalMoney({ value, formatCurrency }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap tabular-nums">
      {formatCurrency(Math.abs(Number(value || 0)))}
    </span>
  );
}

function GoalDialog({ open, onOpenChange, editingGoal, onSave, saving }) {
  const [form, setForm] = useState(emptyGoalForm);

  useEffect(() => {
    if (!open) return;

    if (editingGoal) {
      setForm({
        name: editingGoal.name || '',
        target_amount: String(editingGoal.target_amount ?? ''),
        target_date: editingGoal.target_date || '',
        note: editingGoal.note || '',
      });
    } else {
      setForm(emptyGoalForm());
    }
  }, [editingGoal, open]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const amount = Number(form.target_amount || 0);

    if (!form.name.trim()) {
      toast.error('Enter a goal name');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Enter a valid target amount');
      return;
    }

    onSave({
      name: form.name.trim(),
      target_amount: amount,
      target_date: form.target_date || null,
      note: form.note || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit savings goal' : 'Add savings goal'}</DialogTitle>
          <DialogDescription>
            Set a target amount and optional deadline. Contributions stay manual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Goal name</label>
            <Input
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="Emergency fund"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target amount</label>
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
              <label className="text-xs font-medium text-muted-foreground">Target date</label>
              <Input
                value={form.target_date}
                onChange={(event) => updateForm('target_date', event.target.value)}
                type="date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Why this goal matters"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : editingGoal ? 'Save Goal' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContributionDialog({
  open,
  onOpenChange,
  goal,
  accounts,
  onSave,
  saving,
  formatCurrency,
}) {
  const [form, setForm] = useState(emptyContributionForm);

  useEffect(() => {
    if (!open) return;
    setForm(emptyContributionForm());
  }, [open, goal?.id]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const amount = Number(form.amount || 0);

    if (!goal?.id) {
      toast.error('Select a goal');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Enter a valid contribution amount');
      return;
    }

    if (!form.account_id) {
      toast.error('Select the account funding this goal');
      return;
    }

    onSave({
      amount,
      account_id: form.account_id,
      contribution_date: form.contribution_date || todayIsoDate(),
      note: form.note || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add goal contribution</DialogTitle>
          <DialogDescription>
            {goal?.name
              ? `Assign money toward ${goal.name}. This records a neutral savings transfer.`
              : 'Assign money toward a savings goal.'}
          </DialogDescription>
        </DialogHeader>

        {goal && (
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Remaining</span>
              <span className="font-bold tabular-nums">
                <GoalMoney value={getGoalRemaining(goal)} formatCurrency={formatCurrency} />
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <Input
              value={form.amount}
              onChange={(event) => updateForm('amount', event.target.value)}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From account</label>
              <Select value={form.account_id} onValueChange={(value) => updateForm('account_id', value)}>
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input
                value={form.contribution_date}
                onChange={(event) => updateForm('contribution_date', event.target.value)}
                type="date"
              />
            </div>
          </div>

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
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Posting…' : 'Add Contribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({ goal, formatCurrency, compact, onContribute, onEdit, onArchive }) {
  const progress = getGoalProgress(goal);
  const remaining = getGoalRemaining(goal);
  const monthlyRequired = getMonthlyRequiredSaving(goal);
  const status = getGoalStatus(goal);
  const current = Number(goal.current_amount || 0);
  const target = Number(goal.target_amount || 0);

  return (
    <article className="rounded-2xl border border-border/60 bg-background/40 p-4 transition-all hover:bg-background/60">
      <div className="flex gap-4">
        <ProgressRing progress={progress} size={compact ? 60 : 72} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold text-foreground md:text-base">
                  {goal.name}
                </h3>
                <Badge variant="outline" className={cn('rounded-full text-[10px]', status.className)}>
                  {status.label}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                <GoalMoney value={current} formatCurrency={formatCurrency} />
                {' / '}
                <GoalMoney value={target} formatCurrency={formatCurrency} />
              </p>
            </div>

            {!compact && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground"
                onClick={() => onEdit(goal)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-secondary/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Deadline
              </div>
              <p className="mt-1 font-semibold text-foreground">{formatGoalDate(goal.target_date)}</p>
            </div>

            <div className="rounded-xl bg-secondary/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <WalletCards className="h-3.5 w-3.5" />
                Monthly needed
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {monthlyRequired === null ? (
                  'Set deadline'
                ) : remaining <= 0 ? (
                  'Completed'
                ) : (
                  <GoalMoney value={monthlyRequired} formatCurrency={formatCurrency} />
                )}
              </p>
            </div>
          </div>

          {goal.note && !compact && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{goal.note}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              onClick={() => onContribute(goal)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Contribute
            </Button>

            {!compact && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl text-muted-foreground"
                onClick={() => onArchive(goal)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GoalsPanel({
  goals = [],
  contributions = [],
  accounts = [],
  categories = [],
  formatCurrency,
  title = 'Savings goals',
  subtitle = 'Track goal progress, monthly required saving, and manual contributions.',
  limit,
  compact = false,
  className,
}) {
  const queryClient = useQueryClient();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  const visibleGoals = useMemo(() => {
    const sorted = sortGoalsByPriority(goals);
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }, [goals, limit]);

  const totalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.current_amount || 0),
    0
  );
  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.target_amount || 0),
    0
  );
  const completedGoals = goals.filter((goal) => getGoalRemaining(goal) <= 0).length;

  const refreshGoals = () => {
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['goal-contributions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setGoalDialogOpen(true);
  };

  const handleOpenEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = async (values) => {
    setSaving(true);

    try {
      const payload = {
        name: String(values.name || '').trim(),
        target_amount: Number(values.target_amount || 0),
        target_date: values.target_date || null,
        note: values.note ? String(values.note).trim() : null,
      };

      if (!payload.name) {
        toast.error('Enter a goal name');
        return;
      }

      if (!payload.target_amount || payload.target_amount <= 0) {
        toast.error('Enter a valid target amount');
        return;
      }

      if (editingGoal) {
        await savingsGoalsApi.update(editingGoal.id, payload);
        toast.success('Goal updated');
      } else {
        await savingsGoalsApi.create({
          ...payload,
          current_amount: 0,
          is_archived: false,
        });
        toast.success('Goal created');
      }

      refreshGoals();
      setGoalDialogOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Goal save failed:', error);
      toast.error(error?.message || error?.details || 'Could not save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveGoal = async (goal) => {
    setSaving(true);

    try {
      await savingsGoalsApi.update(goal.id, { is_archived: true });
      refreshGoals();
      toast.success('Goal archived');
    } catch (error) {
      console.error('Goal archive failed:', error);
      toast.error(error.message || 'Could not archive goal');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenContribution = (goal) => {
    setSelectedGoal(goal);
    setContributionDialogOpen(true);
  };

  const handleSaveContribution = async (values) => {
    if (!selectedGoal) return;

    setSaving(true);

    try {
      const amount = Number(values.amount || 0);
      const contributionDate = values.contribution_date || todayIsoDate();
      const savingsCategory = getDefaultSavingsCategory(categories);
      const note = values.note || `Contribution to ${selectedGoal.name}`;

      if (!amount || amount <= 0) {
        toast.error('Enter a valid contribution amount');
        return;
      }

      if (!values.account_id) {
        toast.error('Select the account funding this goal');
        return;
      }

      // Save the contribution first so goal progress updates even if the
      // optional linked transaction fails because of an older schema cache.
      const contribution = await goalContributionsApi.create({
        goal_id: selectedGoal.id,
        account_id: values.account_id,
        amount,
        contribution_date: contributionDate,
        note,
      });

      try {
        const transaction = await transactionsApi.create({
          amount,
          type: 'transfer',
          date: contributionDate,
          note,
          account_id: values.account_id,
          to_account_id: values.account_id,
          category_id: savingsCategory?.id || null,
          savings_goal_id: selectedGoal.id,
          goal_contribution_id: contribution.id,
        });

        await goalContributionsApi.update(contribution.id, {
          transaction_id: transaction.id,
        });
      } catch (transactionError) {
        console.warn('Goal contribution saved, but transaction link failed:', transactionError);
      }

      refreshGoals();
      setContributionDialogOpen(false);
      setSelectedGoal(null);
      toast.success('Contribution added');
    } catch (error) {
      console.error('Goal contribution failed:', error);
      toast.error(error?.message || error?.details || 'Could not add contribution');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={cn(
        'rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl md:p-5',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold tracking-tight text-foreground md:text-base">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-xl"
          onClick={handleOpenCreateGoal}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Goal
        </Button>
      </div>

      {goals.length > 0 && !compact && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Saved
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              <GoalMoney value={totalSaved} formatCurrency={formatCurrency} />
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Target
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              <GoalMoney value={totalTarget} formatCurrency={formatCurrency} />
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Completed
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {completedGoals}/{goals.length}
            </p>
          </div>
        </div>
      )}

      {visibleGoals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-4 py-7 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <PiggyBank className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No savings goals yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Create goals for emergency funds, travel, equipment, or any future purchase.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-4 rounded-xl"
            onClick={handleOpenCreateGoal}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              formatCurrency={formatCurrency}
              compact={compact}
              onContribute={handleOpenContribution}
              onEdit={handleOpenEditGoal}
              onArchive={handleArchiveGoal}
            />
          ))}
        </div>
      )}

      {compact && goals.length > visibleGoals.length && (
        <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
          +{goals.length - visibleGoals.length} more goals in Plan
        </p>
      )}

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={(open) => {
          setGoalDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        onSave={handleSaveGoal}
        saving={saving}
      />

      <ContributionDialog
        open={contributionDialogOpen}
        onOpenChange={(open) => {
          setContributionDialogOpen(open);
          if (!open) setSelectedGoal(null);
        }}
        goal={selectedGoal}
        accounts={accounts}
        onSave={handleSaveContribution}
        saving={saving}
        formatCurrency={formatCurrency}
      />
    </section>
  );
}
