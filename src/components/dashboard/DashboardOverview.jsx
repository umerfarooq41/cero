import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowRight,
  ChartPie,
  Landmark,
  ListPlus,
  Plus,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  WalletCards,
} from 'lucide-react';

import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import TransactionRow from '@/components/transactions/TransactionRow';
import RecurringTransactionsPanel from '@/components/transactions/RecurringTransactionsPanel';
import GoalRow from '@/components/goals/GoalRow';
import SpendingVelocityWidget from '@/components/dashboard/SpendingVelocityWidget';
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
        'rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl md:p-5',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
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

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children}
    </section>
  );
}

function EmptyDashboardState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-4 py-6 text-center">
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
      className="group rounded-2xl border border-border/60 bg-background/40 p-4 transition-all hover:-translate-y-0.5 hover:bg-background/70 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>

          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
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

      <div className="mt-2 text-lg font-bold tracking-tight text-foreground tabular-nums">
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

function getGoalProgressValue(goal) {
  const current = Number(goal?.current_amount || 0);
  const target = Number(goal?.target_amount || 0);

  if (target <= 0) return 0;

  return Math.min(100, Math.round((current / target) * 100));
}

function getTopGoal(goals = []) {
  const activeGoals = goals.filter((goal) => !goal.is_archived);

  if (activeGoals.length === 0) return null;

  return [...activeGoals].sort((a, b) => {
    const aProgress = getGoalProgressValue(a);
    const bProgress = getGoalProgressValue(b);

    const aComplete = aProgress >= 100;
    const bComplete = bProgress >= 100;

    if (aComplete !== bComplete) return aComplete ? 1 : -1;

    const aDate = a.target_date || '9999-12-31';
    const bDate = b.target_date || '9999-12-31';

    if (aDate !== bDate) return String(aDate).localeCompare(String(bDate));

    return bProgress - aProgress;
  })[0];
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

  const topGoal = getTopGoal(savingsGoals);

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
          <RecurringTransactionsPanel
            recurringTransactions={recurringTransactions}
            categories={categories}
            accounts={accounts}
            formatCurrency={formatCurrency}
            title="Upcoming bills"
            subtitle="Manual-post recurring items with due and overdue status."
            limit={3}
            compact
            className="animate-child"
          />

          <DashboardCard
            title="Top goal progress"
            subtitle="Your highest-priority savings goal."
            icon={Target}
            action={
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
              >
                <Link to="/plan">
                  View plan
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
            className="animate-child"
          >
            {topGoal ? (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/35">
                <GoalRow
                  goal={topGoal}
                  formatCurrency={formatCurrency}
                  onClick={() => navigate('/plan')}
                />
              </div>
            ) : (
              <EmptyDashboardState
                icon={Target}
                title="No savings goal yet"
                description="Create a savings goal from your Plan screen to start tracking progress here."
                action={
                  <Button asChild size="sm" className="rounded-xl">
                    <Link to="/plan">Open Plan</Link>
                  </Button>
                }
              />
            )}
          </DashboardCard>
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
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/35">
                <div className="divide-y divide-border/50">
                  {recentTransactions.map((transaction) => (
                    <TransactionRow
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
                to="/?tab=reflect"
                icon={ChartPie}
                title="Reflect"
                subtitle="Analyze progress"
              />
            </div>
          </DashboardCard>
        </div>
    </>
  );
}
