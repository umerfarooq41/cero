import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Landmark,
  ListPlus,
  Plus,
  Receipt,
  SlidersHorizontal,
  TrendingUp,
  Target,
  TrendingDown,
  WalletCards,
} from 'lucide-react';

import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import TransactionRow from '@/components/transactions/TransactionRow';
import SpendingVelocityWidget from '@/components/dashboard/SpendingVelocityWidget';
import UpcomingBillsPreview from '@/components/dashboard/UpcomingBillsPreview';
import TopGoalPreview from '@/components/dashboard/TopGoalPreview';
import { Button } from '@/components/ui/button';
import DashboardSectionCard from '@/components/dashboard/DashboardSectionCard';
import { cn } from '@/lib/utils';

function DashboardCard(props) {
  return <DashboardSectionCard {...props} />;
}

function EmptyDashboardState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 app-card-surface-soft px-4 py-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
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
      className="group rounded-2xl app-card-surface-soft p-3 transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-sm sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-10 sm:w-10 sm:rounded-2xl">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground sm:text-sm">{title}</p>

          <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
            {subtitle}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatPill({ label, value, icon: Icon, tone = 'default' }) {
  const iconClass =
  tone === 'good'
    ? 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]'
    : tone === 'danger'
      ? 'text-destructive bg-destructive/10'
      : tone === 'warning'
        ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10'
        : tone === 'info'
          ? 'text-blue-600 bg-blue-500/10 dark:text-blue-400'
          : 'text-foreground bg-secondary';

const valueClass =
  tone === 'good'
    ? 'text-[hsl(var(--success))]'
    : tone === 'danger'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-amber-500 dark:text-amber-400'
        : tone === 'info'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-foreground';

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <span className={cn('rounded-lg p-1.5', iconClass)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}

        <span className="truncate text-sm font-bold tracking-tight text-muted-foreground sm:text-base">
          {label}
        </span>
      </div>

      <span
        className={cn(
          'shrink-0 text-sm font-bold tabular-nums tracking-tight sm:text-base',
          valueClass
        )}
      >
        {value}
      </span>
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

export default function DashboardOverview({
  currentMonth,
  budget = {},
  transactions = [],
  categories = [],
  accounts = [],
  recurringTransactions = [],
  goals = [],
  formatCurrency,
}) {
  const navigate = useNavigate();

  const goalsWithFunding = goals;
  const recurringById = useMemo(
    () => new Map(recurringTransactions.map((rule) => [rule.id, rule])),
    [recurringTransactions]
  );
  const goalsById = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal])),
    [goals]
  );

  const plannedOutflow =
    Number(budget.totalPlannedExpenses || 0) +
    Number(budget.totalPlannedSavings || 0) +
    Number(budget.assignablePlannedDebt ?? budget.totalPlannedDebt ?? 0);

  const trackedOutflow =
    Number(budget.totalExpenses || 0) +
    Number(budget.totalTrackedSavings || 0) +
    Number(budget.totalTrackedDebt || 0);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, 5),
    [transactions]
  );

  const handleTransactionClick = useCallback(
    (transactionId) => {
      navigate(`/transactions/${transactionId}/edit`);
    },
    [navigate]
  );

  return (
    <>
      <div className="animate-child lg:hidden">
          <LeftToAllocateBanner
            leftToAllocate={budget.leftToAllocate}
            totalIncome={budget.totalPlannedIncome || budget.totalIncome}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
            <div className="divide-y divide-border/40">
              <StatPill
                label="Income"
                value={formatCurrency(budget.totalIncome || 0)}
                icon={TrendingUp}
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
                tone="info"
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
            goals={goalsWithFunding}
            formatCurrency={formatCurrency}
            className="animate-child"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
              <div className="min-w-0 divide-y divide-border/50">
                  {recentTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      category={getTransactionCategory(transaction, categories)}
                      account={getTransactionAccount(transaction, accounts)}
                      toAccount={getTransactionToAccount(transaction, accounts)}
                      recurringRule={recurringById.get(transaction.recurring_transaction_id)}
                      goal={goalsById.get(transaction.savings_goal_id || transaction.goal_id)}
                      formatCurrency={formatCurrency}
                      compactSourceBadges
                      flush
                      onClick={() => handleTransactionClick(transaction.id)}
                    />
                  ))}
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="Quick actions"
            subtitle="Jump into the most common money tasks."
            icon={ListPlus}
            className="animate-child"
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
