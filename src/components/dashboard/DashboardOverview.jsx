
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Gauge, LayoutDashboard, ChevronRight, Receipt, Target, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
import { SectionHeading } from '@/components/shared/WorkspacePrimitives';

function Section({ title, icon: Icon, action, children }) {
  return <Card className={cardStyle}><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-0 pb-2 pt-3"><SectionHeading title={title} icon={Icon} as="h3"/>{action}</CardHeader><CardContent className="px-0 pb-3 pt-1">{children}</CardContent></Card>;
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
function SafeCard({ allocations, categories, transactions, recurringTransactions, savingsGoals, allTransactions, currentMonth, formatCurrency }) {
  const reduced = useReducedMotion();
  const authoritativeAllocations = buildAuthoritativeScheduledAllocations({ allocations, recurringTransactions, savingsGoals, currentMonth, allTransactions });
  const pace = calculateDiscretionaryPace({
    allocations: getDiscretionaryAllocations(authoritativeAllocations, categories),
    transactions, currentMonth, now: new Date(),
  });
  if (!pace) return <Card className={cardStyle + ' border-primary/20'}><CardContent className="cero-hero space-y-2 px-0 py-3">
    <div className="flex w-full flex-row items-center justify-between gap-2 text-left"><SectionHeading title="Spending allowance" icon={Gauge}/><Badge variant="secondary" className="text-[10px]">Plan needed</Badge></div>
    <p className="text-sm text-muted-foreground">Add a monthly expense-category allocation to calculate discretionary pace.</p>
  </CardContent></Card>;
  const remainingPct = pace.allowance > 0 ? Math.max(0, Math.min(1, pace.leftToday / pace.allowance)) : 0;
  const statusColor = pace.status === 'overBudget' ? 'text-destructive' : pace.status === 'over' ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400';
  const chip = pace.status === 'overBudget' ? 'Over budget' : pace.status === 'track' ? 'On track' : pace.status === 'over' ? 'Over pace' : 'Under pace';
  return <Card className={cardStyle}><CardContent className="cero-hero relative space-y-2 px-0 py-3">
    <div className="relative">
      <div className="flex items-center justify-between gap-2 pr-10 text-left"><SectionHeading title="Spending allowance" icon={Gauge}/></div>
      <div className="relative mx-auto mt-2 w-full max-w-[290px]">
        <svg viewBox="0 0 280 153" className="block w-full" role="img" aria-label={Math.round(remainingPct * 100) + '% of daily allowance remaining'}>
          <path d="M 16 140 A 124 124 0 0 1 264 140" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-muted"/>
          {remainingPct > 0 && <motion.path d="M 16 140 A 124 124 0 0 1 264 140" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: remainingPct }} transition={{ duration: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}/>}
        </svg>
        <div className="absolute inset-x-8 bottom-3 flex flex-col items-center gap-1 text-center">
          <p className="text-xs text-muted-foreground">Available to spend today</p>
          <Money value={pace.leftToday} formatCurrency={formatCurrency} className="cero-primary-amount leading-none"/>
          <p className="text-xs text-muted-foreground">Of <Money value={pace.allowance} formatCurrency={formatCurrency}/> daily allowance</p>
          <p className={'text-xs font-medium '+statusColor}>{chip}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1 text-center">
        {[['Spent today',pace.spentToday],['Left this month',pace.remaining]].map(([label,value]) => <div key={label} className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><Money value={value} formatCurrency={formatCurrency} className="cero-secondary-amount"/></div>)}
      </div>
      <p className="pt-2 text-center text-xs text-muted-foreground">{pace.daysRemaining} days left this month</p>
    </div>
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="How today's allowance is calculated" className="absolute right-0 top-1 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[state=open]:text-primary"><Info size={17}/></button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" sideOffset={6} collisionPadding={16} aria-label="How today's allowance is calculated" className="cero-allowance-popover w-[calc(100vw-32px)] max-w-[340px] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl border border-border !bg-popover p-4 text-left shadow-xl">
        <h3 className="mb-3 text-sm font-semibold">Allowance calculation</h3>
        <dl className="space-y-2 text-xs">
          <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Monthly discretionary budget</dt><dd className="shrink-0 text-right"><Money value={pace.budget} formatCurrency={formatCurrency}/></dd></div>
          <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Spent before today</dt><dd className="shrink-0 text-right"><Money value={-(pace.spent-pace.spentToday)} formatCurrency={formatCurrency}/></dd></div>
          <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2 font-medium"><dt>Budget left before today</dt><dd className="shrink-0 text-right"><Money value={Math.max(0,pace.budget-pace.spent+pace.spentToday)} formatCurrency={formatCurrency}/></dd></div>
          <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Remaining days</dt><dd className="shrink-0 text-right tabular-nums">{pace.daysRemaining ? '÷ '+pace.daysRemaining : '—'}</dd></div>
          <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2 font-medium"><dt>Daily allowance</dt><dd className="shrink-0 text-right"><Money value={pace.allowance} formatCurrency={formatCurrency}/></dd></div>
          <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">Spent today</dt><dd className="shrink-0 text-right"><Money value={-pace.spentToday} formatCurrency={formatCurrency}/></dd></div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 font-semibold"><dt className="text-sm">Available today</dt><dd className="shrink-0 text-right"><Money value={pace.leftToday} formatCurrency={formatCurrency} className="text-lg text-primary"/></dd></div>
        </dl>
        {(pace.spent-pace.spentToday > pace.budget || pace.spentToday > pace.allowance) && <p className="mt-2 text-xs text-muted-foreground">Remaining allowance cannot fall below zero.</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Excludes separately planned bills, debt and savings. Remaining days include today when viewing the current month.</p>
        <style>{'@keyframes ceroAllowancePopoverIn { from { opacity: 0; scale: .97; } to { opacity: 1; scale: 1; } } @media (prefers-reduced-motion: no-preference) { .cero-allowance-popover[data-state="open"] { animation: ceroAllowancePopoverIn 180ms ease-out; transform-origin: var(--radix-popover-content-transform-origin); } }'}</style>
      </PopoverContent>
    </Popover>
  </CardContent></Card>;
}
function MonthlyAllocationDetails({ budget, transactions = [], formatCurrency }) {
  const income = num(budget.realizedIncome ?? budget.totalIncome);
  const expenses = num(budget.totalExpenses);
  const recurringPaid = transactions
    .filter(t => t.type === 'expense' && (t.recurring_transaction_id || t.source_type === 'recurring'))
    .reduce((sum, t) => sum + num(t.amount), 0);
  const variablePaid = expenses - recurringPaid;
  const debt = num(budget.totalTrackedDebt);
  const savings = num(budget.totalTrackedSavings);
  const planned = num(budget.totalPlannedExpenses) + num(budget.totalPlannedSavings) + num(budget.assignablePlannedDebt ?? budget.totalPlannedDebt);
  const tracked = expenses + savings + debt;
  const remaining = income - tracked;
  const rows = [
    ['Variable expenses', variablePaid, 'bg-primary'],
    ['Recurring bills', recurringPaid, 'bg-violet-500'],
    ['Debt paid', debt, 'bg-blue-500'],
    ['Savings funded', savings, 'bg-teal-500'],
  ];
  const percentage = planned > 0 ? Math.round(tracked / planned * 1000) / 10 : null;
  return <div className="space-y-4 text-left">
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><p className="mb-1 text-xs text-muted-foreground">Received income</p><Money value={income} formatCurrency={formatCurrency} className="cero-secondary-amount"/></div>
        <div className="text-right"><p className="mb-1 text-xs text-muted-foreground">{remaining<0?'Income shortfall':'Income remaining'}</p><Money value={remaining} formatCurrency={formatCurrency} className={'cero-secondary-amount '+(remaining<0?'text-destructive':'text-emerald-600 dark:text-emerald-400')}/></div>
      </div>
      <dl className="space-y-0">
        {rows.map(([label,value,color])=><div key={label} className="flex min-h-9 items-center justify-between gap-3 py-1"><dt className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><span className={color+' size-1.5 shrink-0 rounded-full'}/>{label}</dt><dd className="shrink-0"><Money value={value} formatCurrency={formatCurrency} className="text-sm font-medium"/></dd></div>)}
      </dl>
    </div>
    <details className="group border-t border-border/60 pt-2">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-xs text-muted-foreground [&::-webkit-details-marker]:hidden"><span>{percentage===null?'Plan utilization':percentage+'% of plan tracked'}</span><ChevronRight size={14} className="group-open:rotate-90"/></summary>
      <p className="pb-2 text-xs text-muted-foreground"><Money value={tracked} formatCurrency={formatCurrency}/> of <Money value={planned} formatCurrency={formatCurrency}/> tracked</p>
    </details>
  </div>;
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
    {Math.abs(num(budget.leftToAllocate)) >= 0.01 && <div className="mx-auto mb-2 flex w-full max-w-3xl items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2" style={{order:-2}}><span className={'text-sm font-medium '+(num(budget.leftToAllocate)<0?'text-destructive':'text-primary')}><Money value={Math.abs(num(budget.leftToAllocate))} formatCurrency={formatCurrency}/> {num(budget.leftToAllocate)<0?'overallocated':'left to allocate'}</span><Action to="/plan">{num(budget.leftToAllocate)<0?'Adjust':'Assign'} <ChevronRight size={14}/></Action></div>}
    <div className="cero-safe-hero mx-auto w-full max-w-3xl border-b border-border text-center"><Entrance index={0}><SafeCard allocations={allocations} categories={categories} transactions={transactions} recurringTransactions={recurringTransactions} savingsGoals={savingsGoals} allTransactions={allTransactions} currentMonth={currentMonth} formatCurrency={formatCurrency}/></Entrance></div>
    <div className="cero-monthly-overview mx-auto w-full max-w-3xl border-b border-border py-4 text-center lg:py-5">
      <div className="mb-4 text-left">
        <SectionHeading title="Monthly overview" icon={LayoutDashboard}/>
        
      </div>
      <MonthlyAllocationDetails budget={budget} transactions={transactions} formatCurrency={formatCurrency}/>
    </div>
    <div className="contents md:grid md:grid-cols-2 md:gap-4 md:pt-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
      <div className="contents">
        <div className="contents md:order-2"><Entrance index={3}><UpcomingBillsPreview recurringTransactions={recurringTransactions} accounts={accounts} categories={categories} transactions={transactions} formatCurrency={formatCurrency} limit={3} className="cero-overview-section cero-upcoming-section !rounded-none !border-0 !bg-transparent !shadow-none !backdrop-blur-none !px-0"/></Entrance></div>
        <div className="contents md:order-1"><Entrance index={4}><Recent transactions={transactions} categories={categories} accounts={accounts} recurringTransactions={recurringTransactions} goals={goals} formatCurrency={formatCurrency}/></Entrance></div>
        <div className="contents md:order-3">{upcomingGoals.length > 0 && <Entrance index={5}><ScheduledGoalsPreview goals={upcomingGoals} accounts={accounts} formatCurrency={formatCurrency}/></Entrance>}</div>
      </div>
    </div>
  </div>;
}
