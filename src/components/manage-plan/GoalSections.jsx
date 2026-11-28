import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArchiveRestore, ChevronDown, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatGoalDate, getGoalProgress, getGoalRemaining, getMonthlyRequiredSaving, getGoalScheduledMonthlySaving } from '@/lib/goals';
import { cn } from '@/lib/utils';
export function GoalActionSheet({ goal, open, onClose, onEdit, onArchive, onDelete }) {
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

function GoalRow({ goal, onAction, formatCurrency, completionDate }) {
  const completedDate = completionDate || goal.target_date || null;
  const progress = getGoalProgress(goal);
  const target = Number(goal.target_amount || 0);
  const remaining = getGoalRemaining(goal);
  const color = goal.color_key || '#276FE4';
  const isArchived = Boolean(goal.is_archived);
  const isCompleted = remaining <= 0 || progress >= 100;
  const isFixed = (goal.contribution_mode || 'flexible') === 'fixed';
  const monthlyRequired = isFixed ? getMonthlyRequiredSaving(goal) : getGoalScheduledMonthlySaving(goal);
  const contributionCount = Number(goal.posted_occurrence_count || 0);
  const plannedCount = Math.max(1, Number(goal.duration_count || 0) || (() => { const start = String(goal.start_date || '').slice(0, 7); const end = String(goal.target_date || '').slice(0, 7); return /^\d{4}-\d{2}$/.test(start) && /^\d{4}-\d{2}$/.test(end) ? Math.max(1, (Number(end.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(end.slice(5, 7)) - Number(start.slice(5, 7)) + 1) : 1; })());
  const displayAmount = monthlyRequired === null
    ? null
    : !isFixed && contributionCount >= plannedCount - 1
      ? remaining
      : Math.min(Math.max(0, Number(monthlyRequired || 0)), remaining);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntil = (value) => value
    ? Math.ceil((new Date(`${value}T00:00:00`).getTime() - todayStart.getTime()) / 86400000)
    : null;
  const monthsFromDays = (days) => Math.max(1, Math.ceil(days / 30.44));
  const countdownDays = daysUntil(isFixed ? goal.next_due_date : goal.target_date);
  const usesMonths = isFixed
    ? ['quarterly', 'yearly'].includes(goal.frequency)
    : countdownDays !== null && countdownDays >= 30;
  const countdown = countdownDays === null
    ? null
    : countdownDays > 0
      ? isFixed
        ? `Due in ${usesMonths ? `${monthsFromDays(countdownDays)}mo` : `${countdownDays}d`}`
        : `${usesMonths ? `${monthsFromDays(countdownDays)}mo` : `${countdownDays}d`} left`
      : countdownDays === 0
        ? 'Due today'
        : isFixed
          ? `Overdue ${Math.abs(countdownDays)}d`
          : `${Math.abs(countdownDays)}d overdue`;

  return (
    <div className="group flex items-stretch gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 lg:items-center lg:py-3">
      <div className="shrink-0 self-start">
        <CategoryIcon icon={goal.icon_key || 'target'} color={color} size="sm" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={cn('min-w-0 truncate text-sm font-semibold lg:text-base leading-tight', isArchived && 'text-muted-foreground line-through')}>
          {goal.name}
        </h3>

        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {isArchived
            ? `Archived · ${progress}%`
            : isCompleted
              ? `Reached${completedDate ? ` · ${formatGoalDate(completedDate)}` : ''}`
              : `${progress}%${countdown ? ` · ${countdown}` : ''}`}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          {isCompleted ? (
            <>
              {formatCurrency(Math.max(0, target - remaining))} saved
            </>
          ) : (
            <>
              {formatCurrency(Math.max(0, target - remaining))} / {formatCurrency(target)}
            </>
          )}
        </p>
      </div>

      <div className={cn(
        'flex shrink-0 items-center justify-end text-right text-sm font-medium lg:min-w-32 tabular-nums',
        isCompleted ? 'text-green-700 dark:text-green-400' : 'text-foreground'
      )}>
        {isCompleted ? 'Completed' : displayAmount === null ? 'Set target' : formatCurrency(displayAmount)}
      </div>

      <div className="-ml-2 flex w-6 shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => onAction(goal)}
          className="-mr-2 rounded-md p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 lg:opacity-100"
          aria-label={`Open actions for ${goal.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function GoalSection({ title, tone, goals, defaultExpanded = false, emptyText, onAddNew, onAction, formatCurrency, completionDates = {} }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const toneClass =
    tone === 'active'
      ? 'text-blue-700 dark:text-blue-400'
      : tone === 'completed'
        ? 'text-green-700 dark:text-green-400'
        : 'text-muted-foreground';

  return (
    <div className="overflow-hidden rounded-2xl app-card-surface lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!shadow-none lg:!backdrop-blur-none">
      <div className="flex min-h-14 w-full items-center justify-between gap-2 px-3 py-2.5">
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
          <h3 className={cn('truncate text-sm font-semibold lg:text-base', toneClass)}>{title}</h3>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {goals.length}
          </span>

          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-primary"
              title="Add goal"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          {!onAddNew && <span aria-hidden="true" className="h-8 w-8" />}
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
              <div className="border-t border-border/50 px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground">{emptyText}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50 lg:border-t-0">
                {goals.map((goal) => (
                  <GoalRow key={goal.id} goal={goal} onAction={onAction} formatCurrency={formatCurrency} completionDate={completionDates[goal.id]} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

