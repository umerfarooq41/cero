
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Gauge, LayoutDashboard, ChevronRight, Receipt, PiggyBank, CreditCard, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { calculateDiscretionaryPace } from '@/lib/dashboardPace';
import UpcomingBillsPreview from '@/components/dashboard/UpcomingBillsPreview';
import TransactionRow from '@/components/transactions/TransactionRow';
import { getGoalProgress, getGoalRemaining, getGoalOccurrenceStatus, formatGoalDate, todayIsoDate } from '@/lib/goals';
import useGoalItems from '@/components/transactions/useGoalItems';
import { buildAuthoritativeScheduledAllocations, getAllocationSourceType, normalizeSourceType, getPlanCategoryType } from '@/lib/planData';

const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const cardStyle = 'cero-overview-section !rounded-none !border-0 !bg-transparent !shadow-none !backdrop-blur-none';
function getDateLabel(value) {
  const raw = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
  const date = parseISO(raw);
  if (Number.isNaN(date.getTime())) return '';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, date.getFullYear() === new Date().getFullYear() ? 'MMM d' : 'MMM d, yyyy');
}
function Money({ value, formatCurrency, className = '' }) {
  // Cero's formatter returns a React element (SAR uses an SVG mask), not a string.
  // Rendering that element directly preserves the selected currency and prevents .match crashes.
  return <span className={className + ' inline-flex items-center tabular-nums [&>span]:gap-[0.18em] [&>span>span]:font-inherit [&>span>span]:leading-none [&>span>span:first-child]:!h-[0.86em] [&>span>span:first-child]:!w-[0.86em]'}>{formatCurrency(num(value))}</span>;
}
function Entrance({ children, index }) {
  const reduced = useReducedMotion();
  return <motion.div data-dashboard-entry initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 190, damping: 24, delay: index * 0.06 }}>{children}</motion.div>;
}
function Section({ title, icon: Icon, action, children }) {
  return <Card className={cardStyle}><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-0 pb-2 pt-3"><div className="flex min-w-0 items-center gap-2">{Icon && <Icon className="size-4 shrink-0 text-muted-foreground"/>}<CardTitle className="truncate cero-section-title">{title}</CardTitle></div>{action}</CardHeader><CardContent className="px-0 pb-3 pt-1">{children}</CardContent></Card>;
}
function Action({ to, children, boxed = false }) {
  return <Button asChild variant="ghost" size="sm" className={boxed ? "h-9 min-h-9 gap-1 rounded-md border border-border bg-transparent px-2.5 text-xs font-medium" : "min-h-9 gap-1 pl-2 pr-0 text-xs"}><Link to={to}>{children}</Link></Button>;
}
function getDiscretionaryAllocations(allocations, categories) {
  const categoriesById = new Map(categories.map(c => [c.id, c]));
  return allocations.filter(a =>
    normalizeSourceType(getAllocationSourceType(a)) === 'category' &&
    getPlanCategoryType(categoriesById.get(a.category_id), categories) === 'expense' &&
    Number(a.planned_amount) > 0
  );
}
function BreakdownSheet({ open, onOpenChange, pace, categoriesById, formatCurrency }) {
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="!max-h-[90dvh] !overflow-hidden" onOpenAutoFocus={(event) => event.preventDefault()}>
      <SheetHeader className="pr-8 text-left">
        <SheetTitle className="text-base">Discretionary spending</SheetTitle>
        <SheetDescription className="text-xs">Spending from your flexible expense categories.</SheetDescription>
      </SheetHeader>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Spent', pace.spent],
          ['Budget', pace.budget],
          [pace.overBudget ? 'Over by' : 'Remaining', pace.overBudget ? pace.spent - pace.budget : pace.remaining],
        ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-secondary/50 px-1.5 py-2">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <Money value={value} formatCurrency={formatCurrency} className="text-sm font-semibold"/>
        </div>)}
      </div>
      <div className="app-dialog-scroll mt-3 divide-y divide-border/40">
        {pace.categories.filter(item => Number(item.spent) > 0).map(item => {
          const category = categoriesById.get(item.categoryId);
          const over = item.remaining < 0;
          return <div key={item.categoryId} className="py-2.5">
            <div className="flex items-center gap-3">
              <CategoryIcon icon={category?.icon || 'tag'} color={category?.color} size="sm"/>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category?.name || 'Uncategorized'}</p>
                <p className="text-xs text-muted-foreground"><Money value={item.spent} formatCurrency={formatCurrency}/> of <Money value={item.planned} formatCurrency={formatCurrency}/> · {Math.round(item.percentUsed)}%</p>
              </div>
              <div className={`shrink-0 text-right text-xs font-medium ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
                {over ? <>Over by <Money value={Math.abs(item.remaining)} formatCurrency={formatCurrency}/></> : <><Money value={item.remaining} formatCurrency={formatCurrency}/> left</>}
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-primary/10">
              <div className={`h-full rounded-full ${over ? 'bg-destructive' : item.percentUsed >= 85 ? 'bg-amber-500' : 'bg-primary'}`} style={{width: `${Math.min(100, item.percentUsed)}%`}}/>
            </div>
          </div>;
        })}
        {pace.categories.some(item => Number(item.spent) <= 0) && (
          <details className="group border-t border-border/40 py-3">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              Not started ({pace.categories.filter(item => Number(item.spent) <= 0).length})
              <span className="text-muted-foreground group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-2 space-y-2">
              {pace.categories.filter(item => Number(item.spent) <= 0).map(item => {
                const category = categoriesById.get(item.categoryId);
                return <div key={item.categoryId} className="flex items-center gap-2 py-1 text-sm">
                  <CategoryIcon icon={category?.icon || 'tag'} color={category?.color} size="sm"/>
                  <span className="min-w-0 flex-1 truncate">{category?.name || 'Uncategorized'}</span>
                  <span className="text-xs text-muted-foreground"><Money value={item.planned} formatCurrency={formatCurrency}/> budget</span>
                </div>;
              })}
            </div>
          </details>
        )}
      </div>
    </SheetContent>
  </Sheet>;
}
function SafeCard({ allocations, categories, transactions, recurringTransactions, savingsGoals, allTransactions, currentMonth, formatCurrency }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const authoritativeAllocations = buildAuthoritativeScheduledAllocations({ allocations, recurringTransactions, savingsGoals, currentMonth, allTransactions });
  const pace = calculateDiscretionaryPace({
    allocations: getDiscretionaryAllocations(authoritativeAllocations, categories),
    transactions, currentMonth, now: new Date(),
  });
  if (!pace) return <Card className={cardStyle + ' border-primary/20'}><CardContent className="cero-hero space-y-2 px-0 py-3">
    <div className="cero-hero-label flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-semibold"><Gauge size={16} className="text-muted-foreground"/>Discretionary allowance today</p><Badge variant="secondary" className="text-[10px]">Plan needed</Badge></div>
    <p className="text-sm text-muted-foreground">Add a monthly expense-category allocation to calculate discretionary pace.</p>
  </CardContent></Card>;
  const fillClass = pace.status === 'overBudget' ? 'bg-destructive' : pace.status === 'over' ? 'bg-amber-500' : 'bg-primary';
  const driverName = pace.topDriver ? categoriesById.get(pace.topDriver.categoryId)?.name : null;
  const insight = pace.overBudget ? 'Monthly budget exceeded' : pace.spent === 0 ? 'No spending recorded this month' : driverName && pace.topDriver.share >= 40 ? `${driverName} is ${Math.round(pace.topDriver.share)}% of discretionary spending` : pace.status === 'over' ? 'Spending is ahead of your monthly pace' : pace.status === 'under' ? 'Spending is below your monthly pace' : 'Spending is on track this month';
  const chip = pace.status === 'overBudget' ? 'Over budget' : pace.status === 'track' ? 'On track' : pace.status === 'over' ? 'over pace' : 'under pace';
  return <Card className={cardStyle + ' border-border/50'}><CardContent className="cero-hero space-y-2 px-0 py-3">
    <div className="cero-hero-label flex items-center justify-between gap-2">
      <p className="flex items-center gap-2 cero-section-title"><Gauge size={16} className="shrink-0 text-muted-foreground"/>Discretionary allowance today</p>
      <Badge variant="secondary" className={`shrink-0 rounded-md border-0 px-2 py-1 text-xs font-medium ${pace.status === 'overBudget' ? 'bg-destructive/15 text-destructive' : pace.status === 'over' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}>
        {chip === 'over pace' ? 'Over pace' : chip === 'under pace' ? 'Under pace' : chip}
      </Badge>
    </div>
    <div className="space-y-1">
      <div className="cero-hero-value flex items-baseline gap-1.5">
        <Money value={pace.allowance} formatCurrency={formatCurrency} className="cero-primary-amount leading-none"/>
        <span className="text-sm text-muted-foreground">/ day</span>
      </div>
      {pace.spentToday > 0 && <p className="text-xs text-muted-foreground">Spent today <Money value={pace.spentToday} formatCurrency={formatCurrency}/> · <Money value={pace.leftToday} formatCurrency={formatCurrency}/> left</p>}
    </div>
    <div className="space-y-1.5">
      <div className="relative h-1.5 rounded-full bg-primary/5" role="progressbar" aria-label="Discretionary budget spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pace.spentPct)}>
        <motion.div className={`h-full rounded-full ${fillClass}`} initial={{width: 0}} animate={{width: `${pace.spentPct}%`}} transition={{duration: 0.5}}/>
        <span className="absolute -top-1 h-3.5 w-[2px] rounded-full bg-foreground/90" style={{left: `calc(${pace.timePct}% - 1px)`}} aria-hidden="true"/>
      </div>
      <p className="text-xs text-muted-foreground">Spent <Money value={pace.spent} formatCurrency={formatCurrency}/> of <Money value={pace.budget} formatCurrency={formatCurrency}/></p>

    </div>
    <div className="flex min-h-9 items-center justify-between gap-2">
      <p className="min-w-0 flex-1 text-xs leading-4 text-muted-foreground">{insight}</p>
      <Button variant="ghost" size="sm" className="-mr-2 min-h-8 shrink-0 gap-1 px-2 text-xs font-medium text-primary" onClick={() => setSheetOpen(true)}>Breakdown <ChevronRight size={15}/></Button>
    </div>
    <BreakdownSheet open={sheetOpen} onOpenChange={setSheetOpen} pace={pace} categoriesById={categoriesById} formatCurrency={formatCurrency}/>
  </CardContent></Card>;
}
function Snapshot({ budget, transactions = [], formatCurrency }) {
  const expenses = num(budget.totalExpenses);
  const recurringPaid = transactions
    .filter(t => t.type === 'expense' && (t.recurring_transaction_id || t.source_type === 'recurring'))
    .reduce((sum, t) => sum + num(t.amount), 0);
  const variablePaid = Math.max(0, expenses - recurringPaid);
  const savings = num(budget.totalTrackedSavings);
  const debt = num(budget.totalTrackedDebt);
  const planned = num(budget.totalPlannedExpenses) + num(budget.totalPlannedSavings) + num(budget.assignablePlannedDebt ?? budget.totalPlannedDebt);
  const tracked = expenses + savings + debt;
  return <details className="cero-budget-details group border-b border-border"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm text-primary">Budget details<ChevronRight size={16} className="group-open:rotate-90"/></summary>
    <dl className="divide-y divide-border">{[['Variable expenses',variablePaid],['Recurring expenses',recurringPaid],['Debt paid',debt],['Savings funded',savings],['Total planned allocation',planned],['Total tracked allocation',tracked]].map(([label,value]) => <div key={label} className="flex items-center justify-between gap-3 py-2 lg:py-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd><Money value={value} formatCurrency={formatCurrency} className="text-sm lg:text-base font-medium"/></dd></div>)}</dl>
  </details>;
}
function Recent({ transactions, categories, accounts, recurringTransactions, goals, formatCurrency }) {
  const navigate = useNavigate();
  const categoriesById = new Map(categories.map(item => [item.id, item]));
  const accountsById = new Map(accounts.map(item => [item.id, item]));
  const recurringById = new Map(recurringTransactions.map(item => [item.id, item]));
  const goalsById = new Map(goals.map(item => [item.id, item]));
  const rows = [...transactions]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 5);
  return <Section title="Recent transactions" icon={Receipt} action={<div className="min-w-0"><Action to="/transactions">View all <ChevronRight size={14}/></Action></div>}>
    {rows.length ? <div className="divide-y divide-border/40">{rows.map(transaction =>
      <TransactionRow
        key={transaction.id}
        transaction={transaction}
        category={categoriesById.get(transaction.category_id)}
        account={accountsById.get(transaction.account_id)}
        toAccount={accountsById.get(transaction.to_account_id)}
        recurringRule={recurringById.get(transaction.recurring_transaction_id)}
        goal={goalsById.get(transaction.savings_goal_id || transaction.goal_id)}
        formatCurrency={formatCurrency}
        dateLabel={getDateLabel(transaction.date)}
        compactSourceBadges
        flush
        onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
      />
    )}</div> : <p className="py-5 text-center text-sm text-muted-foreground">No transactions this month.</p>}
  </Section>;
}
function ScheduledGoalsPreview({ goals, accounts, formatCurrency }) {
  return <Section title="Savings goals" icon={Target} action={<div className="min-w-0"><Action to="/transactions?tab=scheduled">View all <ChevronRight size={14}/></Action></div>}>
    <div className="divide-y divide-border/50">{goals.slice(0, 3).map(goal => {
      const fixed = goal.contribution_mode === 'fixed';
      const remaining = getGoalRemaining(goal);
      const progress = getGoalProgress(goal);
      const monthlyTarget = Math.max(0, Number(goal.month_planned_amount || 0));
      const savedThisMonth = Math.max(0, Number(goal.month_contributed_amount || 0));
      const hasMonthlyTarget = !fixed && monthlyTarget > 0;
      const monthlyLeft = Math.max(0, Math.round((monthlyTarget - savedThisMonth) * 100) / 100);
      const monthlyReached = hasMonthlyTarget && monthlyLeft <= 0;
      const monthlyAhead = monthlyReached && savedThisMonth > monthlyTarget + 0.005;
      const amount = Math.min(remaining, Math.max(0, Number(fixed ? goal.fixed_contribution_amount : hasMonthlyTarget ? monthlyLeft : goal.next_suggested_contribution) || 0));
      const from = accounts.find(a => a.id === goal.from_account_id);
      const to = accounts.find(a => a.id === goal.to_account_id);
      const date = fixed ? goal.next_due_date : goal.target_date;
      const status = fixed ? (goal.occurrence_status || getGoalOccurrenceStatus(goal)) : null;
      const count = Math.max(0, Number(goal.duration_count || 0));
      const posted = Math.max(0, Number(goal.posted_occurrence_count || 0));
      const schedule = fixed ? (count ? `Fixed · ${Math.min(posted + 1, count)} of ${count}` : 'Fixed') : 'Flexible';
      return <Link key={goal.id} to="/transactions?tab=scheduled" className="flex min-w-0 items-center gap-2 py-2.5 first:pt-0 last:pb-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><Target className="h-3.5 w-3.5"/></span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5"><p className="truncate text-xs font-semibold text-foreground sm:text-sm">{goal.name}</p>{status?.label && <Badge variant="outline" className="shrink-0 rounded-full border-primary/20 bg-primary/10 px-1.5 py-0 text-[9px] font-bold leading-4 text-primary">{status.label}</Badge>}</div>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground">{schedule}{date ? ` · ${fixed ? 'Due' : 'Target'} ${formatGoalDate(date)}` : ''}</p>
          <p className="truncate text-[11px] leading-4 text-muted-foreground/85">{from?.name || 'Account'} → {to?.name || 'Savings'} · {progress}% funded</p>
          {!fixed && (monthlyReached ? <p className="flex items-center gap-1 text-[11px] leading-4 text-emerald-600 dark:text-emerald-400"><span aria-hidden="true">✓</span>{monthlyAhead ? 'Ahead of monthly target' : 'Monthly target reached'}</p> : savedThisMonth > 0 ? <p className="truncate text-[11px] leading-4 text-muted-foreground">Saved this month <Money value={savedThisMonth} formatCurrency={formatCurrency}/></p> : null)}
        </div>
        <div className="shrink-0 text-right text-[11px] font-semibold tabular-nums text-primary sm:text-sm">{monthlyReached ? <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Done for month</span> : <div><Money value={amount} formatCurrency={formatCurrency}/>{!fixed && hasMonthlyTarget && <p className="text-[10px] font-normal text-muted-foreground">Suggested left</p>}</div>}</div>
      </Link>;
    })}</div>
  </Section>;
}
export default function DashboardOverview({ currentMonth, allocations = [], budget = {}, transactions = [], allTransactions = [], categories = [], accounts = [], recurringTransactions = [], goals = [], savingsGoals = [], formatCurrency }) {
  const { activeGoals } = useGoalItems({ savingsGoals, allocations, currentMonth, monthTransactions: transactions, allTransactions, accounts, categories });
  const today = todayIsoDate();
  const upcomingGoals = activeGoals
    .filter(goal => {
      if (goal.contribution_mode !== 'fixed') return true;
      const date = String(goal.next_due_date || '').slice(0, 10);
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return false;
      const [year, month, day] = date.split('-').map(Number);
      const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
      const days = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86400000);
      return days <= 10;
    })
    .sort((a, b) => String((a.contribution_mode === 'fixed' ? a.next_due_date : a.target_date) || '').localeCompare(String((b.contribution_mode === 'fixed' ? b.next_due_date : b.target_date) || '')));
  return <div className="cero-dashboard-overview mx-auto max-w-3xl md:max-w-none">
    <div className="cero-monthly-overview border-b border-border py-3 lg:py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="cero-section-title">{format(parseISO(currentMonth + '-01'), 'MMMM yyyy')} overview</h2>
        
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 xl:grid-cols-4 cero-overview-metrics">
        {[
          ['Received income', budget.realizedIncome ?? budget.totalIncome],
          ['Total expenses', budget.totalExpenses],
          ['Tracked savings', budget.totalTrackedSavings],
          ['Left to allocate', budget.leftToAllocate],
        ].map(([label, value], index) => <div key={label} className="min-w-0 lg:px-4 lg:first:pl-0">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1"><Money value={value} formatCurrency={formatCurrency} className={'cero-secondary-amount ' + (index === 3 ? (num(value) < 0 ? 'text-destructive' : 'text-primary') : '')}/></dd>
        </div>)}
      </dl>
    </div>
    <div className="contents md:grid md:grid-cols-2 md:gap-4 md:pt-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
      <div className="contents md:order-2 md:flex md:min-w-0 md:flex-col md:gap-4">
        <div className="cero-safe-hero contents md:order-1"><Entrance index={0}><SafeCard allocations={allocations} categories={categories} transactions={transactions} recurringTransactions={recurringTransactions} savingsGoals={savingsGoals} allTransactions={allTransactions} currentMonth={currentMonth} formatCurrency={formatCurrency}/></Entrance></div>
        <div className="contents md:order-2"><Entrance index={1}><Snapshot budget={budget} transactions={transactions} formatCurrency={formatCurrency}/></Entrance></div>
        <div className="hidden md:contents lg:hidden">{num(budget.leftToAllocate) > 0.005 && <Entrance index={2}><div className="flex min-h-14 min-w-0 items-center justify-between gap-2 rounded-md bg-primary/[0.07] px-3"><span className="min-w-0 flex-1 text-[clamp(0.72rem,3.2vw,0.875rem)] font-medium leading-snug tracking-tight"><Money value={budget.leftToAllocate} formatCurrency={formatCurrency}/>{" left to allocate"}</span><span className="shrink-0"><Action to="/plan">Assign <ChevronRight size={14}/></Action></span></div></Entrance>}</div>
      </div>
      <div className="contents md:flex md:min-w-0 md:flex-col md:gap-4">
        <div className="contents md:order-2"><Entrance index={3}><UpcomingBillsPreview recurringTransactions={recurringTransactions} accounts={accounts} categories={categories} transactions={transactions} formatCurrency={formatCurrency} limit={3} className="cero-overview-section cero-upcoming-section !rounded-none !border-0 !bg-transparent !shadow-none !backdrop-blur-none !px-0"/></Entrance></div>
        <div className="contents md:order-1"><Entrance index={4}><Recent transactions={transactions} categories={categories} accounts={accounts} recurringTransactions={recurringTransactions} goals={goals} formatCurrency={formatCurrency}/></Entrance></div>
        <div className="contents md:order-3">{upcomingGoals.length > 0 && <Entrance index={5}><ScheduledGoalsPreview goals={upcomingGoals} accounts={accounts} formatCurrency={formatCurrency}/></Entrance>}</div>
      </div>
    </div>
  </div>;
}
