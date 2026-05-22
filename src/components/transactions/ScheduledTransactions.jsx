import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
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
  useRecurringTransactions,
  useSavingsGoals,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import {
  accountsApi,
  goalContributionsApi,
  recurringTransactionsApi,
  savingsGoalsApi,
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
  formatGoalDate,
  getDefaultSavingsCategory,
  getGoalProgress,
  getGoalRemaining,
  getGoalStatus,
  getMonthlyRequiredSaving,
  sortGoalsByPriority,
  todayIsoDate as goalTodayIsoDate,
} from '@/lib/goals';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);
const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function formatNumber(value = 0) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
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

function isDueNow(status) {
  return status.key === 'overdue' || status.key === 'due_today';
}

function ScheduledSection({ icon: Icon, title, subtitle, count, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-bold tracking-tight text-foreground md:text-base">
                {title}
              </h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-bold text-muted-foreground">
                {count}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function ScheduledList({ children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/75 shadow-sm backdrop-blur-xl divide-y divide-border/50">
      {children}
    </div>
  );
}

function RecurringAmount({ rule, currency }) {
  const amount = Math.abs(Number(rule.amount || 0));

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold tabular-nums',
        rule.type === 'income'
          ? 'text-[hsl(var(--success))]'
          : rule.type === 'expense'
            ? 'text-destructive'
            : 'text-primary'
      )}
    >
      {rule.type === 'income' ? '+' : rule.type === 'expense' ? '-' : ''}
      <CurrencyAmount amount={amount} currency={currency} />
    </span>
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

function GoalContributionDialog({ goal, accounts, currency, open, onOpenChange, onSubmit, saving }) {
  const suggestedAmount = useMemo(() => {
    if (!goal) return '';
    const monthly = getMonthlyRequiredSaving(goal);
    const remaining = getGoalRemaining(goal);
    return String(monthly || remaining || '');
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
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const [postingId, setPostingId] = useState(null);
  const [savingGoalId, setSavingGoalId] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const activeRecurring = useMemo(
    () => sortRecurringByDueDate(recurringTransactions.filter((rule) => !rule.is_archived)),
    [recurringTransactions]
  );

  const activeGoals = useMemo(
    () => sortGoalsByPriority(savingsGoals.filter((goal) => !goal.is_archived)),
    [savingsGoals]
  );

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['goal-contributions'] });
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

    if (rule.type === 'transfer' && !rule.to_account_id) {
      toast.error('This recurring transfer is missing a destination account');
      return;
    }

    setPostingId(rule.id);

    try {
      const postedForDate = rule.next_due_date || recurringTodayIsoDate();
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

  const handleGoalContribution = async ({ amount, date, note }) => {
    if (!selectedGoal) return;

    const fromAccount = accounts.find((account) => account.id === selectedGoal.from_account_id);
    const toAccount = accounts.find((account) => account.id === selectedGoal.to_account_id);
    const savingsCategory = getDefaultSavingsCategory(categories);

    if (!amount || amount <= 0) {
      toast.error('Enter a valid contribution amount');
      return;
    }

    if (!fromAccount || !toAccount) {
      toast.error('This goal is missing its from/to accounts');
      return;
    }

    if (fromAccount.id === toAccount.id) {
      toast.error('Goal from/to accounts must be different');
      return;
    }

    setSavingGoalId(selectedGoal.id);

    try {
      const contributionDate = date || goalTodayIsoDate();
      const contributionNote = note || `Contribution to ${selectedGoal.name}`;

      const contribution = await goalContributionsApi.create({
        goal_id: selectedGoal.id,
        account_id: fromAccount.id,
        amount,
        contribution_date: contributionDate,
        note: contributionNote,
      });

      const transactionPayload = {
        amount,
        type: 'transfer',
        date: contributionDate,
        note: contributionNote,
        category_id: savingsCategory?.id || null,
        account_id: fromAccount.id,
        to_account_id: toAccount.id,
        savings_goal_id: selectedGoal.id,
        goal_contribution_id: contribution.id,
      };

      const transaction = await transactionsApi.create(transactionPayload);
      await updateAccountBalances(transactionPayload);

      await Promise.all([
        savingsGoalsApi.update(selectedGoal.id, {
          current_amount: Number(selectedGoal.current_amount || 0) + amount,
        }),
        goalContributionsApi.update(contribution.id, {
          transaction_id: transaction.id,
        }),
      ]);

      invalidateData();
      setSelectedGoal(null);
      toast.success('Goal contribution posted');
    } catch (error) {
      console.error('Goal contribution failed:', error);
      toast.error(error.message || 'Could not post goal contribution');
    } finally {
      setSavingGoalId(null);
    }
  };

  return (
    <div className="animate-child space-y-7">
      <ScheduledSection
        icon={CalendarClock}
        title="Recurring Bills & Income"
        subtitle="Post only items that are due or overdue."
        count={activeRecurring.length}
      >
        {activeRecurring.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur-xl">
            <EmptyState
              icon={Clock3}
              title="No recurring rules"
              description="Create recurring income, bills, and debt rules from Manage Plan first."
            />
          </div>
        ) : (
          <ScheduledList>
            {activeRecurring.map((rule) => {
              const status = getRecurringStatus(rule);
              const category = categories.find((item) => item.id === rule.category_id);
              const account = accounts.find((item) => item.id === rule.account_id);
              const toAccount = accounts.find((item) => item.id === rule.to_account_id);
              const dueNow = isDueNow(status);

              return (
                <div key={rule.id} className="flex min-h-[72px] items-center gap-3 px-3 py-3 transition-colors hover:bg-accent/40 md:px-4">
                  <CategoryIcon
                    icon={rule.icon || category?.icon || (rule.type === 'income' ? 'income' : rule.type === 'transfer' ? 'loan' : 'receipt')}
                    color={rule.color || category?.color || (rule.type === 'income' ? '#22c55e' : rule.type === 'expense' ? '#ef4444' : '#276FE4')}
                    size="md"
                    className="h-9 w-9 rounded-xl"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{rule.name}</p>
                      <ScheduledStatusBadge className={getStatusClass(status)}>
                        {status.label}
                      </ScheduledStatusBadge>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {getRecurringFrequencyLabel(rule.frequency)} · Next {formatRecurringDate(rule.next_due_date)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground/80">
                      {rule.type === 'transfer'
                        ? `${account?.name || 'From account'} → ${toAccount?.name || 'To account'}`
                        : `${category?.name || 'Uncategorized'} · ${account?.name || 'Account'}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                    <RecurringAmount rule={rule} currency={currency} />
                    {dueNow ? (
                      <Button
                        size="sm"
                        onClick={() => handlePostRecurring(rule)}
                        disabled={postingId === rule.id || !rule.is_active}
                        className="h-8 rounded-xl px-2.5 text-xs"
                      >
                        {postingId === rule.id ? 'Posting...' : 'Post'}
                      </Button>
                    ) : (
                      <span className="inline-flex h-7 items-center rounded-xl bg-secondary px-2.5 text-[11px] font-semibold text-muted-foreground">
                        Future
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </ScheduledList>
        )}
      </ScheduledSection>

      <ScheduledSection
        icon={Target}
        title="Savings Goals"
        subtitle="Contributions post as checking-to-savings transfers."
        count={activeGoals.length}
      >
        {activeGoals.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur-xl">
            <EmptyState
              icon={PiggyBank}
              title="No active savings goals"
              description="Create savings goals from Manage Plan before posting contributions."
            />
          </div>
        ) : (
          <ScheduledList>
            {activeGoals.map((goal) => {
              const progress = getGoalProgress(goal);
              const remaining = getGoalRemaining(goal);
              const status = getGoalStatus(goal);
              const monthlyRequired = getMonthlyRequiredSaving(goal);
              const fromAccount = accounts.find((account) => account.id === goal.from_account_id);
              const toAccount = accounts.find((account) => account.id === goal.to_account_id);
              const complete = remaining <= 0 || progress >= 100;
              const missingAccounts = !fromAccount || !toAccount;

              return (
                <div key={goal.id} className="flex min-h-[76px] items-center gap-3 px-3 py-3 transition-colors hover:bg-accent/40 md:px-4">
                  <CategoryIcon
                    icon={goal.icon_key || 'target'}
                    color={goal.color_key || '#276FE4'}
                    size="md"
                    className="h-9 w-9 rounded-xl"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
                      <ScheduledStatusBadge className={status.className}>
                        {status.label}
                      </ScheduledStatusBadge>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {progress}% complete · Target {formatGoalDate(goal.target_date)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground/80">
                      {fromAccount?.name || 'Missing from account'} → {toAccount?.name || 'Missing savings account'}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground/80 md:hidden">
                      {monthlyRequired
                        ? <>Required: <CurrencyAmount amount={monthlyRequired} currency={currency} /></>
                        : 'No monthly required amount'}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                    <div>
                      <div className="text-sm font-semibold text-foreground tabular-nums">
                        <CurrencyAmount amount={remaining} currency={currency} />
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Remaining
                      </p>
                    </div>

                    <div className="hidden text-[11px] text-muted-foreground/80 md:block">
                      {monthlyRequired
                        ? <>Required: <CurrencyAmount amount={monthlyRequired} currency={currency} /></>
                        : 'No monthly required'}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setSelectedGoal(goal)}
                      disabled={complete || missingAccounts || savingGoalId === goal.id}
                      className="h-8 rounded-xl px-2.5 text-xs"
                    >
                      {savingGoalId === goal.id ? 'Saving...' : complete ? 'Done' : 'Contribute'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </ScheduledList>
        )}
      </ScheduledSection>

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
