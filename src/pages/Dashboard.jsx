import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowRight,
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Receipt,
  Target,
  WalletCards,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import SpendingVelocityWidget from '@/components/plan/SpendingVelocityWidget';
import MonthSelector from '@/components/shared/MonthSelector';
import TransactionRow from '@/components/transactions/TransactionRow';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import {
  useAccounts,
  useBudgetSummary,
  useCategories,
  useTransactions,
} from '@/hooks/useBudgetData';

const quickActions = [
  {
    label: 'Add Transaction',
    description: 'Track income or spending',
    icon: Plus,
    to: '/add-transaction',
    tone: 'primary',
  },
  {
    label: 'Edit Plan',
    description: 'Assign this month\'s money',
    icon: CircleDollarSign,
    to: null,
    tone: 'blue',
  },
  {
    label: 'Transactions',
    description: 'Review recent activity',
    icon: Receipt,
    to: '/transactions',
    tone: 'green',
  },
  {
    label: 'Accounts',
    description: 'Check balances',
    icon: WalletCards,
    to: '/accounts',
    tone: 'purple',
  },
];

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

function DashboardCard({ title, subtitle, icon: Icon, action, children, className }) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function EmptyDashboardState({ title, description, icon: Icon, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-4 py-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function UpcomingBillsPreview() {
  return (
    <div className="space-y-3">
      <EmptyDashboardState
        icon={CalendarClock}
        title="Recurring bills will appear here"
        description="After recurring transactions are added, this card will show upcoming, due, and overdue bills with a manual Post Transaction action."
        action={
          <Button asChild variant="secondary" size="sm" className="rounded-xl">
            <Link to="/transactions">Go to Transactions</Link>
          </Button>
        }
      />
    </div>
  );
}

function GoalPreview() {
  const progress = 0;

  return (
    <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center">
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-secondary/60">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}% 100%)`,
          }}
        />
        <div className="absolute inset-2 rounded-full bg-card" />
        <div className="relative text-center">
          <p className="text-2xl font-bold tabular-nums">0%</p>
          <p className="text-[10px] font-medium text-muted-foreground">ready</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Savings goals are next
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Once savings goals are added, Dashboard will show the top goal, progress ring, saved amount, deadline, and monthly required saving.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-4 rounded-xl">
          <Link to="/plan">Review Plan</Link>
        </Button>
      </div>
    </div>
  );
}

function QuickActionGrid({ currentMonth }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {quickActions.map((item) => {
        const Icon = item.icon;
        const to = item.to || `/edit-plan?month=${currentMonth}`;

        return (
          <Link
            key={item.label}
            to={to}
            className="group rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-md"
          >
            <div
              className={cn(
                'mb-3 flex h-9 w-9 items-center justify-center rounded-2xl',
                toneClasses[item.tone]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const formatCurrency = useCurrencyFormatter();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  const budget = useBudgetSummary(currentMonth);
  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
        if (dateCompare !== 0) return dateCompare;
        return String(b.created_at || b.id || '').localeCompare(String(a.created_at || a.id || ''));
      })
      .slice(0, 5);
  }, [transactions]);

  const plannedOutflow =
    Number(budget.totalPlannedExpenses || 0) +
    Number(budget.totalPlannedSavings || 0) +
    Number(budget.totalPlannedDebt || 0);

  const trackedOutflow =
    Number(budget.totalExpenses || 0) +
    Number(budget.totalTrackedSavings || 0) +
    Number(budget.totalTrackedDebt || 0);

  const allocationLabel = Math.abs(Number(budget.leftToAllocate || 0)) < 0.01
    ? 'fully assigned'
    : Number(budget.leftToAllocate || 0) > 0
      ? 'still unassigned'
      : 'over assigned';

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Dashboard"
        subtitle={`Command center for ${format(new Date(`${currentMonth}-01`), 'MMMM yyyy')}`}
        actions={
          <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
            <Link to="/add-transaction">
              <Plus className="h-4 w-4" />
              Add
            </Link>
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 md:px-6 lg:py-8">
        <div className="mb-4 flex justify-center animate-child">
          <MonthSelector
            currentMonth={currentMonth}
            onChange={setCurrentMonth}
            subtitle="Dashboard period"
          />
        </div>

        <div className="animate-child space-y-4">
          <LeftToAllocateBanner
            leftToAllocate={budget.leftToAllocate}
            totalIncome={budget.totalPlannedIncome || budget.totalIncome}
            isEditMode={false}
            formatCurrency={formatCurrency}
          />

          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-4">
              <DashboardCard
                title="Spending pace"
                subtitle="Compares the month progress against expense budget usage."
                icon={Clock3}
              >
                {budget.totalPlannedExpenses > 0 ? (
                  <SpendingVelocityWidget
                    totalExpenses={budget.totalExpenses}
                    plannedExpenses={budget.totalPlannedExpenses}
                    currentMonth={currentMonth}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <EmptyDashboardState
                    icon={ChartPie}
                    title="No expense budget yet"
                    description="Add planned expense amounts in Plan to unlock spending pace analysis."
                    action={
                      <Button asChild variant="secondary" size="sm" className="rounded-xl">
                        <Link to={`/edit-plan?month=${currentMonth}`}>Edit Plan</Link>
                      </Button>
                    }
                  />
                )}
              </DashboardCard>

              <DashboardCard
                title="Recent transactions"
                subtitle={`${recentTransactions.length} latest movement${recentTransactions.length === 1 ? '' : 's'} this month`}
                icon={Receipt}
                action={
                  <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs">
                    <Link to="/transactions">View all</Link>
                  </Button>
                }
              >
                {recentTransactions.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/35">
                    <div className="divide-y divide-border/50">
                      {recentTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          category={categories.find((category) => category.id === transaction.category_id)}
                          account={accounts.find((account) => account.id === transaction.account_id)}
                          toAccount={accounts.find((account) => account.id === transaction.to_account_id)}
                          formatCurrency={formatCurrency}
                          onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyDashboardState
                    icon={Receipt}
                    title="No transactions this month"
                    description="Add income, expenses, transfers, or savings activity to make the dashboard live."
                    action={
                      <Button asChild variant="secondary" size="sm" className="rounded-xl">
                        <Link to="/add-transaction">Add Transaction</Link>
                      </Button>
                    }
                  />
                )}
              </DashboardCard>
            </div>

            <div className="space-y-4">
              <DashboardCard
                title="Upcoming bills"
                subtitle="Manual-post recurring transactions will appear here."
                icon={CalendarClock}
              >
                <UpcomingBillsPreview />
              </DashboardCard>

              <DashboardCard
                title="Top goal progress"
                subtitle="Savings goal snapshot for this month."
                icon={PiggyBank}
              >
                <GoalPreview />
              </DashboardCard>

              <DashboardCard
                title="Budget snapshot"
                subtitle={`${allocationLabel} · planned vs tracked outflow`}
                icon={LayoutDashboard}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-secondary/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Planned outflow
                    </p>
                    <div className="mt-1 text-lg font-bold tracking-tight tabular-nums text-foreground [&_svg]:h-[1em] [&_svg]:w-[1em]">
                      {formatCurrency(plannedOutflow)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-secondary/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tracked outflow
                    </p>
                    <div className="mt-1 text-lg font-bold tracking-tight tabular-nums text-foreground [&_svg]:h-[1em] [&_svg]:w-[1em]">
                      {formatCurrency(trackedOutflow)}
                    </div>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>

          <div className="animate-child">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Quick actions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Common actions without searching through pages.
                </p>
              </div>
            </div>
            <QuickActionGrid currentMonth={currentMonth} />
          </div>
        </div>
      </main>
    </div>
  );
}
