import { useEffect, useMemo, useState } from 'react';
import { Archive, Edit3, Plus, Target, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import CategoryIcon from '@/components/shared/CategoryIcon';
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
import { savingsGoalsApi } from '@/lib/budgetData';
import {
  formatGoalDate,
  getGoalProgress,
  getGoalRemaining,
  getGoalStatus,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
} from '@/lib/goals';
import { useSavingsGoals } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

const emptyGoalForm = () => ({
  name: '',
  target_amount: '',
  current_amount: '',
  target_date: '',
  icon_key: 'target',
  color_key: '#2563EB',
  note: '',
});

function GoalDialog({ open, onOpenChange, editingGoal, onSave, saving }) {
  const [form, setForm] = useState(emptyGoalForm);

  useEffect(() => {
    if (!open) return;

    if (editingGoal) {
      setForm({
        name: editingGoal.name || '',
        target_amount: String(editingGoal.target_amount ?? ''),
        current_amount: String(editingGoal.current_amount ?? ''),
        target_date: editingGoal.target_date || '',
        icon_key: editingGoal.icon_key || 'target',
        color_key: editingGoal.color_key || '#2563EB',
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

    onSave({
      name: form.name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: form.target_date || null,
      icon_key: form.icon_key || 'target',
      color_key: form.color_key || '#2563EB',
      note: form.note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border/60 bg-card/95 p-5 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit savings goal' : 'Add savings goal'}</DialogTitle>
          <DialogDescription>
            Manage goal definitions here. Contributions happen later from Transactions → Scheduled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              <label className="text-xs font-medium text-muted-foreground">Starting amount</label>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target date</label>
              <Input
                value={form.target_date}
                onChange={(event) => updateForm('target_date', event.target.value)}
                type="date"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Icon</label>
              <Input
                value={form.icon_key}
                onChange={(event) => updateForm('icon_key', event.target.value)}
                placeholder="target"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex gap-2">
                <Input
                  value={form.color_key}
                  onChange={(event) => updateForm('color_key', event.target.value)}
                  placeholder="#2563EB"
                />
                <input
                  type="color"
                  value={form.color_key || '#2563EB'}
                  onChange={(event) => updateForm('color_key', event.target.value)}
                  className="h-10 w-12 rounded-md border border-input bg-background p-1"
                />
              </div>
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
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Goal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color || 'hsl(var(--primary))' }}
      />
    </div>
  );
}

function GoalManageRow({ goal, onEdit, onArchive, onDelete, formatCurrency }) {
  const progress = getGoalProgress(goal);
  const current = Number(goal.current_amount || 0);
  const target = Number(goal.target_amount || 0);
  const monthlyRequired = getMonthlyRequiredSaving(goal);
  const status = getGoalStatus(goal);
  const color = goal.color_key || '#2563EB';

  return (
    <div className="group px-4 py-4 transition-colors hover:bg-muted/40">
      <div className="flex items-start gap-3">
        <CategoryIcon icon={goal.icon_key || 'target'} color={color} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{goal.name}</h3>
            <Badge variant="outline" className={cn('rounded-full px-2 py-0 text-[10px]', status.className)}>
              {status.label}
            </Badge>
            <span className="shrink-0 text-sm font-bold tabular-nums">{progress}%</span>
          </div>

          <div className="mt-2">
            <ProgressBar progress={progress} color={color} />
          </div>

          <p className="mt-2 text-xs text-muted-foreground tabular-nums">
            {formatCurrency(current)} / {formatCurrency(target)} · Required{' '}
            {monthlyRequired === null ? 'set deadline' : `${formatCurrency(monthlyRequired)}/month`} · Target {formatGoalDate(goal.target_date)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onEdit(goal)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onArchive(goal)}>
            <Archive className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => onDelete(goal)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ManageGoalsPanel() {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  const sortedGoals = useMemo(() => sortGoalsByPriority(savingsGoals), [savingsGoals]);
  const activeGoals = sortedGoals.filter((goal) => getGoalRemaining(goal) > 0);
  const completedGoals = sortedGoals.filter((goal) => getGoalRemaining(goal) <= 0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
  };

  const handleSave = async (payload) => {
    setSaving(true);

    try {
      if (editingGoal?.id) {
        await savingsGoalsApi.update(editingGoal.id, payload);
        toast.success('Savings goal updated');
      } else {
        await savingsGoalsApi.create(payload);
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
      await savingsGoalsApi.update(goal.id, { is_archived: true });
      refresh();
      toast.success('Savings goal archived');
    } catch (error) {
      console.error('Savings goal archive failed:', error);
      toast.error(error.message || 'Could not archive savings goal');
    }
  };

  const handleDelete = async (goal) => {
    try {
      await savingsGoalsApi.delete(goal.id);
      refresh();
      toast.success('Savings goal deleted');
    } catch (error) {
      console.error('Savings goal delete failed:', error);
      toast.error(error.message || 'Could not delete savings goal');
    }
  };

  const renderGroup = (title, goals, emptyText) => (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {goals.length}
        </span>
      </div>

      {goals.length ? (
        <div className="divide-y divide-border/50">
          {goals.map((goal) => (
            <GoalManageRow
              key={goal.id}
              goal={goal}
              onEdit={(nextGoal) => {
                setEditingGoal(nextGoal);
                setDialogOpen(true);
              }}
              onArchive={handleArchive}
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Savings goals</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create and manage long-term targets. Contributions are handled in Transactions, not here.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {renderGroup('Active Goals', activeGoals, 'No active savings goals yet.')}
        {renderGroup('Completed', completedGoals, 'Completed goals will appear here.')}
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
      />
    </div>
  );
}
