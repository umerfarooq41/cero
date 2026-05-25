import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  PiggyBank,
  Target,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import EmptyState from '@/components/shared/EmptyState';
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
import {
  useAccounts,
  useCategories,
  useAllocations,
  useRecurringTransactions,
  useSavingsGoals,
  useTransactions,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import {
  accountsApi,
  recurringTransactionsApi,
  transactionsApi,
} from '@/lib/budgetData';
import {
  calculateNextDueDate,
  formatRecurringDate,
  getRecurringFrequencyLabel,
  getRecurringStatus,
  sortRecurringByDueDate,
  todayIsoDate as recurringTodayIsoDate,
} from '@/lib/recurringTransactions';
import {
  getGoalProgress,
  getGoalRemaining,
  getGoalStatus,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
  todayIsoDate as goalTodayIsoDate,
} from '@/lib/goals';
import {
  invalidateGoalContributionQueries,
  postGoalContribution,
} from '@/lib/goalContributionEffects';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
  formatCurrencyNumberText,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);
const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function formatNumber(value = 0) {
  const number = Number(value || 0);

  return formatCurrencyNumberText(number);
}

function CurrencyAmount({ amount, currency, className = '' }) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums',
        className
      )}
    >
      {code === 'SAR' ? (
        <span
          className="inline-block h-[0.8em] w-[0.8em] shrink-0 bg-current align-middle"
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

function getTransactionDeltas(transaction, accounts) {
  const deltas = {};
  const amount = Number(transaction.amount) || 0;

  const source = accounts.find((account) => account.id === transaction.account_id);
  const destination = accounts.find((account) => account.id === transaction.to_account_id);

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
    const destinationDelta = destination.category === 'liability' ? -amount : amount;
    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
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

const TYPE_ACCENT = {
  income: 'text-green-700 dark:text-green-400',
  expense: 'text-red-700 dark:text-red-400',
  transfer: 'text-purple-700 dark:text-purple-400',
  active: 'text-blue-700 dark:text-blue-400',
};

const TYPE_ICONS = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
  active: Target,
};

const RECURRING_SECTIONS = [
  { type: 'income', label: 'Income' },
  { type: 'expense', label: 'Expenses' },
  { type: 'transfer', label: 'Debt Payments' },
];

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getGoalContributionAmount(row) {
  return Math.max(0, Number(row?.amount || 0));
}

function getGoalSourceId(row) {
  return row?.goal_id || row?.savings_goal_id || null;
}

function sumGoalContributionsByGoal(rows = []) {
  return rows.reduce((totals, row) => {
    const goalId = getGoalSourceId(row);
    if (!goalId) return totals;

    totals[goalId] = (totals[goalId] || 0) + getGoalContributionAmount(row);
    return totals;
  }, {});
}

function sumGoalTransactionsByGoal(rows = []) {
  return rows.reduce((totals, row) => {
    const goalId = row?.savings_goal_id || row?.goal_id || null;
    if (!goalId || row?.type !== 'transfer') return totals;

    totals[goalId] = (totals[goalId] || 0) + Math.max(0, Number(row?.amount || 0));
    return totals;
  }, {});
}

function sumRecurringPostedByRule(rows = []) {
  return rows.reduce((totals, row) => {
    const ruleId = row?.recurring_transaction_id || null;
    if (!ruleId) return totals;

    totals[ruleId] = (totals[ruleId] || 0) + Math.max(0, Number(row?.amount || 0));
    return totals;
  }, {});
}

function getGoalPlanRow(goal, allocations = []) {
  return allocations.find((allocation) => {
    const sourceType = String(allocation?.source_type || '').toLowerCase();
    return (sourceType === 'goal' || sourceType === 'savings_goal') && allocation?.source_id === goal?.id;
  });
}

function getGoalMonthlyPlanAmount(goal, allocations = []) {
  const planRow = getGoalPlanRow(goal, allocations);

  if (planRow) {
    return Math.max(0, Number(planRow.planned_amount || 0));
  }

  const fallback = getMonthlyRequiredSaving(goal);
  return fallback === null ? null : Math.max(0, Number(fallback || 0));
}


function getRecurringPlanRow(rule, allocations = []) {
  return allocations.find((allocation) => {
    const sourceType = String(allocation?.source_type || '').toLowerCase();
    return (
      (sourceType === 'recurring' || sourceType === 'recurring_transaction') &&
      allocation?.source_id === rule?.id
    );
  });
}

function getRecurringMonthlyPlanAmount(rule, allocations = []) {
  const planRow = getRecurringPlanRow(rule, allocations);

  if (planRow) {
    return Math.max(0, Number(planRow.planned_amount || 0));
  }

  return Math.max(0, Number(rule?.amount || 0));
}

function isCreditCardAccount(account) {
  const type = String(account?.type || '').toLowerCase();
  return type === 'credit_card' || type === 'credit-card' || type === 'creditcard';
}

function isFlexibleCreditCardDebt(rule, toAccount) {
  return normalizeRuleType(rule?.type) === 'transfer' && isCreditCardAccount(toAccount);
}

function normalizeRuleType(type) {
  if (type === 'debt') return 'transfer';
  return ['income', 'expense', 'transfer'].includes(type) ? type : 'expense';
}

function formatCurrencyElement(amount, currency, className = '') {
  return <CurrencyAmount amount={amount} currency={currency} className={className} />;
}

function isDueNow(status) {
  return status.key === 'overdue' || status.key === 'due_today';
}

function ScheduledSectionCard({ type = 'active', label, count, defaultExpanded = false, emptyText, children }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const Icon = TYPE_ICONS[type] || Target;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/30"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              !isOpen && '-rotate-90'
            )}
          />
          <Icon className={cn('h-4 w-4 shrink-0', TYPE_ACCENT[type])} />
          <h3 className={cn('truncate text-sm font-semibold', TYPE_ACCENT[type])}>{label}</h3>
        </div>

        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {count === 0 ? (
              <div className="border-t border-border/50 px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">{emptyText}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50">
                {children}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScheduledStatusBadge({ children, className }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 rounded-full px-2 py-0 text-[10px] font-semibold leading-none',
        className
      )}
    >
      {children}
    </Badge>
  );
}

function ScheduledRecurringRow({
  rule,
  account,
  toAccount,
  category,
  currency,
  posting,
  onPost,
  onFlexiblePay,
}) {
  const status = getRecurringStatus(rule);
  const dueNow = isDueNow(status);
  const baseAmount = Math.abs(Number(rule.amount || 0));
  const type = normalizeRuleType(rule.type);
  const flexibleCreditCard = isFlexibleCreditCardDebt(rule, toAccount);
  const plannedThisMonth = Number(rule.month_planned_amount ?? baseAmount);
  const paidThisMonth = Number(rule.month_paid_amount || 0);
  const monthRemaining = Math.max(0, plannedThisMonth - paidThisMonth);
  const isMonthCovered = flexibleCreditCard && plannedThisMonth > 0 && monthRemaining <= 0;
  const displayAmount = flexibleCreditCard
    ? isMonthCovered
      ? plannedThisMonth
      : monthRemaining
    : baseAmount;
  const fallbackIcon = type === 'income' ? 'income' : type === 'transfer' ? 'loan' : 'receipt';
  const buttonLabel = flexibleCreditCard
    ? posting
      ? 'Saving…'
      : isMonthCovered
        ? 'Add extra'
        : 'Pay'
    : posting
      ? 'Posting…'
      : dueNow
        ? 'Post'
        : 'Future';
  const canUseAction = flexibleCreditCard
    ? rule.is_active && !posting && Boolean(rule.account_id && rule.to_account_id)
    : dueNow && !posting && rule.is_active;

  const handleAction = () => {
    if (flexibleCreditCard) {
      onFlexiblePay(rule);
      return;
    }

    onPost(rule);
  };

  return (
    <div className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40">
      <CategoryIcon
        icon={rule.icon || category?.icon || fallbackIcon}
        color={rule.color || category?.color || (type === 'income' ? '#22c55e' : type === 'transfer' ? '#8b5cf6' : '#ef4444')}
        size="sm"
      />

      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="min-w-0 truncate text-sm font-semibold leading-tight">
          {rule.name}
        </h3>

        <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted-foreground">
          <span className="truncate">{getRecurringFrequencyLabel(rule.frequency)} · {status.label}</span>
          {!rule.is_active && (
            <ScheduledStatusBadge className="border-border bg-secondary text-muted-foreground">
              Paused
            </ScheduledStatusBadge>
          )}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          Next {formatRecurringDate(rule.next_due_date)}
          {type === 'transfer'
            ? ` · ${toAccount?.name || 'Debt account'}`
            : account
              ? ` · ${account.name}`
              : ''}
        </p>
      </div>

      <div className="ml-2 flex shrink-0 flex-col items-end gap-2 text-right">
        <div className="text-sm font-semibold tabular-nums text-foreground">
          {formatCurrencyElement(displayAmount, currency)}
        </div>

        <Button
          size="sm"
          variant={dueNow || flexibleCreditCard ? 'default' : 'secondary'}
          onClick={handleAction}
          disabled={!canUseAction}
          className="h-7 rounded-xl px-3 text-xs"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

function ScheduledGoalRow({ goal, fromAccount, toAccount, currency, saving, onContribute }) {
  const progress = getGoalProgress(goal);
  const target = Number(goal.target_amount || 0);
  const remaining = getGoalRemaining(goal);
  const status = getGoalStatus(goal);
  const color = goal.color_key || '#276FE4';
  const isCompleted = remaining <= 0 || progress >= 100;
  const statusLabel = status.key === 'due' ? 'Target passed' : status.label;
  const missingAccounts = !fromAccount || !toAccount;
  const plannedAmountRaw = goal.month_planned_amount;
  const plannedThisMonth = Number(plannedAmountRaw || 0);
  const hasMonthlyPlan = plannedAmountRaw !== null && plannedThisMonth > 0;
  const contributedThisMonth = Number(goal.month_contributed_amount || 0);
  const monthRemaining = hasMonthlyPlan
    ? Math.max(0, plannedThisMonth - contributedThisMonth)
    : null;
  const hasPostedThisMonth = hasMonthlyPlan && contributedThisMonth > 0;
  const isMonthDone = !isCompleted && hasMonthlyPlan && monthRemaining <= 0;
  const displayAmount = isMonthDone ? plannedThisMonth : monthRemaining;

  return (
    <div className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40">
      <CategoryIcon icon={goal.icon_key || 'target'} color={color} size="sm" />

      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="min-w-0 truncate text-sm font-semibold leading-tight">
          {goal.name}
        </h3>

        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {isCompleted ? '100% complete' : `${statusLabel} · ${progress}% complete`}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          Target {formatCurrencyElement(target, currency)}
        </p>
      </div>

      <div className="ml-2 flex shrink-0 flex-col items-end gap-2 text-right">
        <div className="text-sm font-semibold tabular-nums text-foreground">
          {isCompleted
            ? 'Completed'
            : !hasMonthlyPlan
              ? 'Set target'
              : formatCurrencyElement(displayAmount, currency)}
        </div>

        <Button
          size="sm"
          onClick={() => onContribute(goal)}
          disabled={isCompleted || missingAccounts || !hasMonthlyPlan || saving}
          className="h-7 rounded-xl px-3 text-xs"
        >
          {saving
            ? 'Saving…'
            : isCompleted
              ? 'Done'
              : !hasMonthlyPlan
                ? 'Set target'
                : isMonthDone
                  ? 'Add extra'
                  : 'Contribute'}
        </Button>
      </div>
    </div>
  );
}

function RecurringPaymentDialog({ rule, accounts, currency, open, onOpenChange, onSubmit, saving }) {
  const plannedAmount = Number(rule?.month_planned_amount || rule?.amount || 0);
  const paidThisMonth = Number(rule?.month_paid_amount || 0);
  const remainingAmount = Math.max(0, plannedAmount - paidThisMonth);
  const suggestedAmount = remainingAmount > 0 ? remainingAmount : '';

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(recurringTodayIsoDate());
  const [note, setNote] = useState('');

  const fromAccount = accounts.find((account) => account.id === rule?.account_id);
  const toAccount = accounts.find((account) => account.id === rule?.to_account_id);

  useEffect(() => {
    if (!open) return;
    setAmount(suggestedAmount ? String(suggestedAmount) : '');
    setDate(recurringTodayIsoDate());
    setNote(rule ? `${rule.name} · Recurring` : '');
  }, [open, rule, suggestedAmount]);

  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{remainingAmount > 0 ? `Pay ${rule.name}` : `Add extra to ${rule.name}`}</DialogTitle>
          <DialogDescription>
            This posts a credit card payment transfer using the saved recurring accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment path
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {fromAccount?.name || 'Missing from account'} → {toAccount?.name || 'Missing credit card'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Checking decreases and the credit card liability decreases.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-20 resize-none"
              placeholder="Optional note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ amount: Number(amount || 0), date, note })}
            disabled={saving || !fromAccount || !toAccount}
          >
            {saving ? 'Saving...' : remainingAmount > 0 ? 'Pay' : 'Add extra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalContributionDialog({ goal, accounts, currency, open, onOpenChange, onSubmit, saving }) {
  const suggestedAmount = useMemo(() => {
    if (!goal) return '';

    const remainingThisMonth = Number(goal.month_remaining_amount || 0);
    if (remainingThisMonth > 0) return String(remainingThisMonth);

    const plannedThisMonth = Number(goal.month_planned_amount || 0);
    const contributedThisMonth = Number(goal.month_contributed_amount || 0);
    if (plannedThisMonth > 0 && contributedThisMonth <= 0) return String(plannedThisMonth);

    return '';
  }, [goal]);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(goalTodayIsoDate());
  const [note, setNote] = useState('');

  const fromAccount = accounts.find((account) => account.id === goal?.from_account_id);
  const toAccount = accounts.find((account) => account.id === goal?.to_account_id);

  useEffect(() => {
    if (!open) return;
    setAmount(suggestedAmount);
    setDate(goalTodayIsoDate());
    setNote(goal ? `Contribution to ${goal.name}` : '');
  }, [goal, open, suggestedAmount]);

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Contribute to {goal.name}</DialogTitle>
          <DialogDescription>
            This creates a transfer from the saved checking account to the saved savings account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Transfer path
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {fromAccount?.name || 'Missing from account'} → {toAccount?.name || 'Missing savings account'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Goal progress is updated, but net worth stays neutral.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
            {suggestedAmount && (
              <p className="text-xs text-muted-foreground">
                Suggested monthly amount: <CurrencyAmount amount={Number(suggestedAmount)} currency={currency} />
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-20 resize-none"
              placeholder="Optional note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ amount: Number(amount || 0), date, note })}
            disabled={saving || !fromAccount || !toAccount}
          >
            {saving ? 'Contributing...' : 'Contribute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ScheduledTransactions() {
  const currency = useCurrency();
  const queryClient = useQueryClient();
  const currentMonth = getCurrentMonthKey();
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: monthTransactions = [] } = useTransactions(currentMonth);
  const { data: allocations = [] } = useAllocations(currentMonth);

  const [postingId, setPostingId] = useState(null);
  const [savingGoalId, setSavingGoalId] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedRecurringPayment, setSelectedRecurringPayment] = useState(null);

  const recurringPaymentsByRule = useMemo(
    () => sumRecurringPostedByRule(monthTransactions),
    [monthTransactions]
  );

  const activeRecurring = useMemo(
    () =>
      sortRecurringByDueDate(
        recurringTransactions
          .filter((rule) => !rule.is_archived)
          .map((rule) => {
            const toAccount = accounts.find((account) => account.id === rule.to_account_id);
            const plannedThisMonth = getRecurringMonthlyPlanAmount(rule, allocations);
            const paidThisMonth = recurringPaymentsByRule[rule.id] || 0;

            const isFlexiblePayment = isFlexibleCreditCardDebt(rule, toAccount);

            return {
              ...rule,
              month_planned_amount: plannedThisMonth,
              month_paid_amount: paidThisMonth,
              month_remaining_amount: isFlexiblePayment
                ? Math.max(0, Number(plannedThisMonth || 0) - paidThisMonth)
                : null,
              is_flexible_payment: isFlexiblePayment,
              is_month_done: paidThisMonth > 0,
            };
          })
      ),
    [accounts, allocations, recurringPaymentsByRule, recurringTransactions]
  );

  const monthContributionsByGoal = useMemo(
    () => sumGoalTransactionsByGoal(monthTransactions),
    [monthTransactions]
  );

  const activeGoals = useMemo(
    () =>
      sortGoalsByPriority(
        savingsGoals
          .filter((goal) => !goal.is_archived)
          .map((goal) => {
            const goalWithProgress = {
              ...goal,
              current_amount: Math.max(0, Number(goal.current_amount || 0)),
            };
            const plannedThisMonth = getGoalMonthlyPlanAmount(goalWithProgress, allocations);
            const contributedThisMonth = monthContributionsByGoal[goal.id] || 0;
            const hasMonthlyPlan = plannedThisMonth !== null && Number(plannedThisMonth || 0) > 0;
            const monthRemainingAmount = hasMonthlyPlan
              ? Math.max(0, Number(plannedThisMonth || 0) - contributedThisMonth)
              : null;

            return {
              ...goalWithProgress,
              month_planned_amount: plannedThisMonth,
              month_contributed_amount: contributedThisMonth,
              month_remaining_amount: monthRemainingAmount,
            };
          })
      ),
    [allocations, monthContributionsByGoal, savingsGoals]
  );

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['goal-contributions'] });
    queryClient.invalidateQueries({ queryKey: ['allocations'] });
    queryClient.invalidateQueries({ queryKey: ['all-allocations'] });
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
  };

  const updateAccountBalances = async (transactionPayload) => {
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
  };

  const handlePostRecurring = async (rule) => {
    const status = getRecurringStatus(rule);

    if (!rule.is_active) {
      toast.error('This recurring rule is paused');
      return;
    }

    if (!isDueNow(status)) {
      toast.error('This recurring item is not due yet');
      return;
    }

    if (!rule.account_id) {
      toast.error('This recurring rule is missing an account');
      return;
    }

    const transactionType = normalizeRuleType(rule.type);

    if (transactionType === 'transfer' && !rule.to_account_id) {
      toast.error('This recurring transfer is missing a destination account');
      return;
    }

    setPostingId(rule.id);

    try {
      const postedForDate = rule.next_due_date || recurringTodayIsoDate();
      const transactionPayload = {
        amount: Number(rule.amount || 0),
        type: transactionType,
        date: postedForDate,
        note: rule.note || `${rule.name} · Recurring`,
        category_id: rule.category_id || null,
        account_id: rule.account_id || null,
        to_account_id: transactionType === 'transfer' ? rule.to_account_id || null : null,
        recurring_transaction_id: rule.id,
        recurring_posted_for_date: postedForDate,
      };

      const transaction = await transactionsApi.create(transactionPayload);
      await updateAccountBalances(transactionPayload);

      await recurringTransactionsApi.update(rule.id, {
        last_posted_date: recurringTodayIsoDate(),
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

  const handleFlexibleRecurringPayment = async ({ amount, date, note }) => {
    if (!selectedRecurringPayment) return;

    const rule = selectedRecurringPayment;
    const fromAccount = accounts.find((account) => account.id === rule.account_id);
    const toAccount = accounts.find((account) => account.id === rule.to_account_id);
    const alreadyPaidThisMonth = Number(rule.month_paid_amount || 0);
    const plannedThisMonth = Number(rule.month_planned_amount || rule.amount || 0);
    const wasMonthCovered = plannedThisMonth > 0 && alreadyPaidThisMonth >= plannedThisMonth;
    const willMonthBeCovered = plannedThisMonth > 0 && alreadyPaidThisMonth + Number(amount || 0) >= plannedThisMonth;

    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    if (!fromAccount || !toAccount) {
      toast.error('This credit card payment is missing its from/to accounts');
      return;
    }

    if (fromAccount.id === toAccount.id) {
      toast.error('Payment from/to accounts must be different');
      return;
    }

    setPostingId(rule.id);

    try {
      const paymentDate = date || recurringTodayIsoDate();
      const postedForDate = rule.next_due_date || paymentDate;
      const paymentNote = note || `${rule.name} · Recurring`;

      const transactionPayload = {
        amount,
        type: 'transfer',
        date: paymentDate,
        note: paymentNote,
        category_id: rule.category_id || null,
        account_id: fromAccount.id,
        to_account_id: toAccount.id,
        recurring_transaction_id: rule.id,
        recurring_posted_for_date: postedForDate,
      };

      const transaction = await transactionsApi.create(transactionPayload);
      await updateAccountBalances(transactionPayload);

      if (!wasMonthCovered && willMonthBeCovered) {
        await recurringTransactionsApi.update(rule.id, {
          last_posted_date: recurringTodayIsoDate(),
          last_posted_transaction_id: transaction.id,
          next_due_date: calculateNextDueDate(postedForDate, rule.frequency),
        });
      } else {
        await recurringTransactionsApi.update(rule.id, {
          last_posted_date: recurringTodayIsoDate(),
          last_posted_transaction_id: transaction.id,
        });
      }

      invalidateData();
      setSelectedRecurringPayment(null);
      toast.success(willMonthBeCovered ? 'Credit card payment posted' : 'Partial credit card payment posted');
    } catch (error) {
      console.error('Credit card payment failed:', error);
      toast.error(error.message || 'Could not post credit card payment');
    } finally {
      setPostingId(null);
    }
  };

  const handleGoalContribution = async ({ amount, date, note }) => {
    if (!selectedGoal) return;

    setSavingGoalId(selectedGoal.id);

    try {
      await postGoalContribution({
        goal: selectedGoal,
        amount,
        date,
        note,
        accounts,
        categories,
        allocations,
        month: currentMonth,
      });

      invalidateGoalContributionQueries(queryClient);
      setSelectedGoal(null);
      toast.success('Goal contribution posted');
    } catch (error) {
      console.error('Goal contribution failed:', error);
      toast.error(error.message || 'Could not post goal contribution');
    } finally {
      setSavingGoalId(null);
    }
  };

  const recurringByType = useMemo(() => {
    return RECURRING_SECTIONS.reduce((groups, section) => {
      groups[section.type] = activeRecurring.filter((rule) => normalizeRuleType(rule.type) === section.type);
      return groups;
    }, {});
  }, [activeRecurring]);

  return (
    <div className="animate-child space-y-7">
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-semibold">Recurring Bills & Income</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Same layout as Manage Plan, with posting actions only for due items.
          </p>
        </div>

        {activeRecurring.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
            <EmptyState
              icon={Clock3}
              title="No recurring rules"
              description="Create recurring income, bills, and debt rules from Manage Plan first."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {RECURRING_SECTIONS.map((section) => {
              const rules = recurringByType[section.type] || [];

              return (
                <ScheduledSectionCard
                  key={section.type}
                  type={section.type}
                  label={section.label}
                  count={rules.length}
                  defaultExpanded={section.type === 'expense' || rules.length > 0}
                  emptyText={`No scheduled ${section.label.toLowerCase()} right now.`}
                >
                  {rules.map((rule) => {
                    const category = categories.find((item) => item.id === rule.category_id);
                    const account = accounts.find((item) => item.id === rule.account_id);
                    const toAccount = accounts.find((item) => item.id === rule.to_account_id);

                    return (
                      <ScheduledRecurringRow
                        key={rule.id}
                        rule={rule}
                        account={account}
                        toAccount={toAccount}
                        category={category}
                        currency={currency}
                        posting={postingId === rule.id}
                        onPost={handlePostRecurring}
                        onFlexiblePay={setSelectedRecurringPayment}
                      />
                    );
                  })}
                </ScheduledSectionCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-semibold">Savings Goals</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Same goal rows as Manage Plan, with contribution actions for execution.
          </p>
        </div>

        {activeGoals.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
            <EmptyState
              icon={PiggyBank}
              title="No active savings goals"
              description="Create savings goals from Manage Plan before posting contributions."
            />
          </div>
        ) : (
          <ScheduledSectionCard
            type="active"
            label="Active Goals"
            count={activeGoals.length}
            defaultExpanded
            emptyText="No active savings goals right now."
          >
            {activeGoals.map((goal) => {
              const fromAccount = accounts.find((account) => account.id === goal.from_account_id);
              const toAccount = accounts.find((account) => account.id === goal.to_account_id);

              return (
                <ScheduledGoalRow
                  key={goal.id}
                  goal={goal}
                  fromAccount={fromAccount}
                  toAccount={toAccount}
                  currency={currency}
                  saving={savingGoalId === goal.id}
                  onContribute={setSelectedGoal}
                />
              );
            })}
          </ScheduledSectionCard>
        )}
      </section>

      <RecurringPaymentDialog
        rule={selectedRecurringPayment}
        accounts={accounts}
        currency={currency}
        open={Boolean(selectedRecurringPayment)}
        onOpenChange={(open) => !open && setSelectedRecurringPayment(null)}
        onSubmit={handleFlexibleRecurringPayment}
        saving={Boolean(postingId)}
      />

      <GoalContributionDialog
        goal={selectedGoal}
        accounts={accounts}
        currency={currency}
        open={Boolean(selectedGoal)}
        onOpenChange={(open) => !open && setSelectedGoal(null)}
        onSubmit={handleGoalContribution}
        saving={Boolean(savingGoalId)}
      />
    </div>
  );
}
