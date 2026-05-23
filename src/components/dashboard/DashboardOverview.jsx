import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  ArrowRight,
  Landmark,
  ListPlus,
  Plus,
  Receipt,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  WalletCards,
} from 'lucide-react';

import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import CategoryIcon from '@/components/shared/CategoryIcon';
import SpendingVelocityWidget from '@/components/dashboard/SpendingVelocityWidget';
import UpcomingBillsPreview from '@/components/dashboard/UpcomingBillsPreview';
import TopGoalPreview from '@/components/dashboard/TopGoalPreview';
import { Button } from '@/components/ui/button';
import {
  useAccounts,
  useBudgetSummary,
  useCategories,
  useTransactions,
  useRecurringTransactions,
  useSavingsGoals,
} from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl sm:p-4 md:p-5',
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}

            <h2 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground md:text-base">
              {title}
            </h2>
          </div>

          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0 self-start">{action}</div>}
      </div>

      {children}
    </section>
  );
}

function EmptyDashboardState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-3 py-6 text-center sm:px-4">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group block min-w-0 rounded-2xl border border-border/60 bg-background/40 p-3 transition-all hover:-translate-y-0.5 hover:bg-background/70 hover:shadow-sm sm:p-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold leading-5 text-foreground">{title}</p>

          <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatPill({ label, value, icon: Icon, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]'
      : tone === 'danger'
        ? 'text-destructive bg-destructive/10'
        : tone === 'warning'
          ? 'text-amber-600 bg-amber-500/10 dark:text-amber-400'
          : 'text-primary bg-primary/10';

  return (
    <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>

        {Icon && (
          <span className={cn('rounded-xl p-1.5', toneClass)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="mt-2 min-w-0 break-words text-base font-bold tracking-tight text-foreground tabular-nums sm:text-lg">
        {value}
      </div>
    </div>
  );
}

function getTransactionCategory(transaction, categories) {
  return categories.find((category) => category.id === transaction.category_id);
}

function getTransactionAccount(transaction, accounts) {
  return accounts.find((account) => account.id === transaction.account_id);
}

function getTransactionToAccount(transaction, accounts) {
  return accounts.find((account) => account.id === transaction.to_account_id);
}


function cleanGeneratedNote(note = '') {
  return String(note)
    .replace(/\s*·\s*Recurring\s*$/i, '')
    .replace(/^Contribution to\s+/i, '')
    .trim();
}

function formatTransactionType(type) {
  if (!type) return 'Transaction';

  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getTransferLabel(account, toAccount) {
  return [account?.name || 'Account', toAccount?.name]
    .filter(Boolean)
    .join(' → ');
}

function getTransactionDisplay(transaction, category, account, toAccount) {
  const isTransfer = transaction.type === 'transfer';
  const isGoalContribution = Boolean(
    transaction.source_type === 'goal' ||
      transaction.source_type === 'savings_goal' ||
      transaction.savings_goal_id ||
      transaction.goal_contribution_id
  );
  const isRecurring = Boolean(
    transaction.source_type === 'recurring' ||
      transaction.recurring_transaction_id ||
      transaction.recurring_posted_for_date
  );

  const goalName =
    transaction.goal_name ||
    transaction.savings_goal_name ||
    transaction.goal?.name ||
    transaction.savings_goal?.name ||
    cleanGeneratedNote(transaction.note) ||
    category?.name ||
    'Goal';

  const title = isTransfer
    ? getTransferLabel(account, toAccount) || 'Transfer'
    : category?.name || cleanGeneratedNote(transaction.note) || 'Uncategorized';

  const subtitle = isTransfer
    ? `Transfer - ${isGoalContribution ? goalName : category?.name || cleanGeneratedNote(transaction.note) || 'Transfer'}`
    : `${formatTransactionType(transaction.type)} - ${account?.name || 'Account'}`;

  return {
    title,
    subtitle,
    isTransfer,
    badge: isGoalContribution ? 'Goal' : isRecurring ? 'Recurring' : null,
  };
}

function SourceBadge({ type }) {
  if (!type) return null;

  const isGoal = type === 'Goal';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none',
        isGoal
          ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-primary/15 bg-primary/10 text-primary'
      )}
    >
      {type}
    </span>
  );
}

function DashboardTransactionPreview({
  transaction,
  category,
  account,
  toAccount,
  formatCurrency,
  onClick,
}) {
  const amount = Math.abs(Number(transaction.amount || 0));
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const display = getTransactionDisplay(transaction, category, account, toAccount);

  const amountClass = isIncome
    ? 'text-[hsl(var(--success))]'
    : isExpense
      ? 'text-destructive'
      : 'text-primary';
  const sign = isIncome ? '+' : isExpense ? '-' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full min-w-0 px-3 py-3 text-left transition-colors hover:bg-accent/50 sm:px-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        {display.isTransfer ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ArrowLeftRight className="h-4 w-4 stroke-[2.2]" />
          </div>
        ) : (
          <CategoryIcon
            icon={category?.icon || 'tag'}
            color={category?.color}
            size="sm"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="min-w-0 max-w-full break-words text-sm font-semibold leading-5 text-foreground">
              {display.title}
            </p>
            <SourceBadge type={display.badge} />
          </div>

          {display.subtitle && (
            <p className="mt-0.5 min-w-0 break-words text-xs leading-5 text-muted-foreground">
              {display.subtitle}
            </p>
          )}

          <p
            className={cn(
              'mt-2 inline-flex max-w-full flex-wrap items-center gap-1 break-words text-sm font-bold leading-5 tabular-nums sm:hidden',
              amountClass
            )}
          >
            {sign && <span>{sign}</span>}
            {formatCurrency(amount)}
          </p>
        </div>

        <div
          className={cn(
            'hidden shrink-0 text-right text-sm font-bold tabular-nums sm:inline-flex sm:items-center sm:gap-1',
            amountClass
          )}
        >
          {sign && <span>{sign}</span>}
          {formatCurrency(amount)}
        </div>
      </div>
    </button>
  );
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const formatCurrency = useCurrencyFormatter();

  const budget = useBudgetSummary(currentMonth);
  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();


  const plannedOutflow =
    Number(budget.totalPlannedExpenses || 0) +
    Number(budget.totalPlannedSavings || 0) +
    Number(budget.totalPlannedDebt || 0);

  const trackedOutflow =
    Number(budget.totalExpenses || 0) +
    Number(budget.totalTrackedSavings || 0) +
    Number(budget.totalTrackedDebt || 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 5);

  return (
    <>
      <div className="animate-child">
          <LeftToAllocateBanner
            leftToAllocate={budget.leftToAllocate}
            totalIncome={budget.totalPlannedIncome || budget.totalIncome}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <DashboardCard
            title="Spending velocity"
            subtitle="Compare time passed with actual expense pace."
            icon={TrendingDown}
            className="animate-child"
          >
            <SpendingVelocityWidget
              totalExpenses={budget.totalExpenses || 0}
              plannedExpenses={budget.totalPlannedExpenses || 0}
              currentMonth={currentMonth}
              formatCurrency={formatCurrency}
            />
          </DashboardCard>

          <DashboardCard
            title="Budget snapshot"
            subtitle="A quick summary of the current budget period."
            icon={Landmark}
            className="animate-child"
          >
            <div className="grid grid-cols-2 gap-3">
              <StatPill
                label="Income"
                value={formatCurrency(budget.totalIncome || 0)}
                icon={Sparkles}
                tone="good"
              />

              <StatPill
                label="Expenses"
                value={formatCurrency(budget.totalExpenses || 0)}
                icon={TrendingDown}
                tone="danger"
              />

              <StatPill
                label="Planned"
                value={formatCurrency(plannedOutflow || 0)}
                icon={Receipt}
              />

              <StatPill
                label="Tracked"
                value={formatCurrency(trackedOutflow || 0)}
                icon={WalletCards}
                tone="warning"
              />
            </div>
          </DashboardCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <UpcomingBillsPreview
            recurringTransactions={recurringTransactions}
            categories={categories}
            accounts={accounts}
            transactions={transactions}
            formatCurrency={formatCurrency}
            limit={3}
            className="animate-child"
          />

          <TopGoalPreview
            goals={savingsGoals}
            formatCurrency={formatCurrency}
            className="animate-child"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <DashboardCard
            title="Recent transactions"
            subtitle="Latest activity from the current budget month."
            icon={Receipt}
            action={
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
              >
                <Link to="/transactions">
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
            className="animate-child"
          >
            {recentTransactions.length === 0 ? (
              <EmptyDashboardState
                icon={Receipt}
                title="No transactions this month"
                description="Add income, expenses, savings, debt payments, or transfers to start tracking."
                action={
                  <Button asChild size="sm" className="rounded-xl">
                    <Link to="/add-transaction">Add Transaction</Link>
                  </Button>
                }
              />
            ) : (
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background/35">
                <div className="min-w-0 divide-y divide-border/50">
                  {recentTransactions.map((transaction) => (
                    <DashboardTransactionPreview
                      key={transaction.id}
                      transaction={transaction}
                      category={getTransactionCategory(transaction, categories)}
                      account={getTransactionAccount(transaction, accounts)}
                      toAccount={getTransactionToAccount(transaction, accounts)}
                      formatCurrency={formatCurrency}
                      onClick={() =>
                        navigate(`/transactions/${transaction.id}/edit`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="Quick actions"
            subtitle="Jump into the most common money tasks."
            icon={ListPlus}
            className="animate-child"
          >
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <QuickAction
                to="/add-transaction"
                icon={Plus}
                title="Add transaction"
                subtitle="Track income or spending"
              />

              <QuickAction
                to="/plan"
                icon={Target}
                title="Review plan"
                subtitle="Assign your money"
              />

              <QuickAction
                to="/accounts"
                icon={WalletCards}
                title="Accounts"
                subtitle="Check balances"
              />

              <QuickAction
                to="/manage-plan"
                icon={SlidersHorizontal}
                title="Manage Plan"
                subtitle="Configure budget setup"
              />
            </div>
          </DashboardCard>
        </div>
    </>
  );
}
