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
import { Badge } from '@/components/ui/badge';
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

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];


const GOAL_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];


const emptyGoalForm = () => ({
  name: '',
  target_amount: '',
  current_amount: '',
  target_date: '',
  icon_key: 'target',
  color_key: randomColor(),
  note: '',
});

function ProgressBar({ progress, color }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color || 'hsl(var(--primary))' }}
      />
    </div>
  );
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

function GoalDialog({ open, onOpenChange, editingGoal, onSave, saving }) {
  const nameRef = useRef(null);
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
        color_key: editingGoal.color_key || '#276FE4',
        note: editingGoal.note || '',
      });
    } else {
      setForm(emptyGoalForm());
    }

    setTimeout(() => nameRef.current?.focus(), 80);
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

    if (currentAmount > targetAmount) {
      toast.error('Starting amount cannot be higher than the target');
      return;
    }

    onSave({
      name: form.name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: form.target_date || null,
      icon_key: form.icon_key || 'target',
      color_key: form.color_key || '#276FE4',
      note: form.note.trim() || null,
    });
  };

  const isEditing = Boolean(editingGoal?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border/60 bg-card/95 p-5 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/45 p-3 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target date</label>
              <Input
                value={form.target_date}
                onChange={(event) => updateForm('target_date', event.target.value)}
                type="date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Color</label>

            <div className="grid grid-cols-10 gap-2 rounded-xl border border-white/40 bg-white/35 p-2 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('color_key', item)}
                  className={cn(
                    'h-8 w-8 rounded-xl border border-border transition-all',
                    form.color_key === item ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Icon</label>

            <div className="grid max-h-52 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-white/40 bg-white/35 p-2 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03] sm:grid-cols-7 md:grid-cols-8">
              {iconNames.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('icon_key', item)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl border transition-all',
                    form.icon_key === item
                      ? 'scale-105 border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-transparent hover:border-border hover:bg-accent'
                  )}
                  title={item}
                >
                  <CategoryIcon icon={item} color={form.icon_key === item ? form.color_key : '#888'} size="sm" />
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

        <DialogFooter className="mt-2">
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
  const current = Number(goal.current_amount || 0);
  const target = Number(goal.target_amount || 0);
  const monthlyRequired = getMonthlyRequiredSaving(goal);
  const status = getGoalStatus(goal);
  const color = goal.color_key || '#276FE4';
  const isArchived = Boolean(goal.is_archived);

  return (
    <div className="group px-4 py-3 transition-colors hover:bg-accent/40">
      <div className="flex items-start gap-3">
        <CategoryIcon icon={goal.icon_key || 'target'} color={color} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={cn('min-w-0 flex-1 truncate text-sm font-medium leading-tight', isArchived && 'text-muted-foreground line-through')}>
              {goal.name}
            </h3>
            <Badge variant="outline" className={cn('shrink-0 rounded-full px-2 py-0 text-[10px]', status.className)}>
              {isArchived ? 'Archived' : status.label}
            </Badge>
            <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">{progress}%</span>
          </div>

          <div className="mt-2">
            <ProgressBar progress={progress} color={isArchived ? '#94a3b8' : color} />
          </div>

          <p className="mt-2 text-xs text-muted-foreground tabular-nums">
            {formatCurrency(current)} / {formatCurrency(target)} · Required{' '}
            {monthlyRequired === null ? 'set deadline' : `${formatCurrency(monthlyRequired)}/month`} · Target{' '}
            {formatGoalDate(goal.target_date)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAction(goal)}
          className="rounded-md p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Open actions for ${goal.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
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
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
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

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['manage-savings-goals'],
    queryFn: () => savingsGoalsApi.list(),
    initialData: [],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const groupedGoals = useMemo(() => {
    const sortedGoals = sortGoalsByPriority(savingsGoals);

    return {
      active: sortedGoals.filter((goal) => !goal.is_archived && getGoalRemaining(goal) > 0),
      completed: sortedGoals.filter((goal) => !goal.is_archived && getGoalRemaining(goal) <= 0),
      archived: sortedGoals.filter((goal) => goal.is_archived),
    };
  }, [savingsGoals]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['manage-savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
  };

  const openNew = () => {
    setEditingGoal(null);
    setDialogOpen(true);
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
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
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

      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/60 bg-card/60 p-1 shadow-sm backdrop-blur-xl">
          {GOAL_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  'relative flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {(activeFilter === 'all' || activeFilter === 'active') && (
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
        )}

        {(activeFilter === 'all' || activeFilter === 'completed') && (
          <GoalSection
            title="Completed Goals"
            tone="completed"
            goals={groupedGoals.completed}
            defaultExpanded={activeFilter === 'completed' || groupedGoals.active.length === 0}
            emptyText="Completed goals will appear here."
            onAction={setActionTarget}
            formatCurrency={formatCurrency}
          />
        )}

        {activeFilter === 'archived' && (
          <GoalSection
            title="Archived Goals"
            tone="archived"
            goals={groupedGoals.archived}
            defaultExpanded
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
