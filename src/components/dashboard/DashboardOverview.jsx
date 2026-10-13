
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarClock, ChevronRight, Plus, Receipt, Target, TrendingDown, TrendingUp, Wallet, WalletCards } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UpcomingBillsPreview from '@/components/dashboard/UpcomingBillsPreview';
import TransactionRow from '@/components/transactions/TransactionRow';
import { getGoalProgress, getGoalRemaining, isGoalPlannedForMonth, sortGoalsByPriority } from '@/lib/goals';

const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const cardStyle = 'rounded-2xl border-border/50 bg-card/70 shadow-sm backdrop-blur-xl';
const amountStyle = 'font-["DM_Mono",monospace] tabular-nums tracking-tight';
const formatDate = value => {
  if (!value || !/^\\d{4}-\\d{2}-\\d{2}/.test(String(value))) return '—';
  return format(parseISO(String(value).slice(0, 10)), 'MMM d');
};
function Money({ value, formatCurrency, className = '' }) {
  // Cero's formatter returns a React element (SAR uses an SVG mask), not a string.
  // Rendering that element directly preserves the selected currency and prevents .match crashes.
  return <span className={className + ' tabular-nums'}>{formatCurrency(num(value))}</span>;
}
function Entrance({ children, index }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 190, damping: 24, delay: index * 0.06 }}>{children}</motion.div>;
}
function Section({ title, action, children }) {
  return <Card className={cardStyle}><CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-1 pt-4"><CardTitle className="text-sm font-semibold">{title}</CardTitle>{action}</CardHeader><CardContent className="px-4 pb-3 pt-1">{children}</CardContent></Card>;
}
function Action({ to, children }) {
  return <Button asChild variant="ghost" size="sm" className="min-h-11 px-2 text-xs"><Link to={to}>{children}</Link></Button>;
}
function SafeCard({ budget, formatCurrency }) {
  // This is NOT a safe-to-spend estimate. Display only known monthly budget
  // numbers until discretionary allocations and protected funds are reconciled.
  const planned = Math.max(0, num(budget.totalPlannedExpenses));
  const spent = Math.max(0, num(budget.totalExpenses));
  const remaining = Math.max(0, planned - spent);
  const percentage = planned > 0 ? Math.min(100, spent / planned * 100) : 0;
  return <Card className={cardStyle + ' border-primary/20'}><CardContent className="space-y-2.5 p-3.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold text-muted-foreground">Monthly expense budget remaining</p>
      <span className="text-[10px] text-muted-foreground">{planned > 0 ? Math.round(percentage) + '% spent' : 'No expense plan'}</span>
    </div>
    <Money value={remaining} formatCurrency={formatCurrency} className="text-2xl font-semibold leading-tight"/>
    <div className="h-1.5 overflow-hidden rounded-full bg-primary/10"><motion.div className="h-full rounded-full bg-primary" initial={{width: 0}} animate={{width: percentage + '%'}} transition={{duration: 0.45}}/></div>
    <p className="text-[11px] text-muted-foreground">Expense plan only · Not a safe-to-spend allowance</p>
  </CardContent></Card>;
}
function Snapshot({ budget, formatCurrency }) {
  const planned = num(budget.totalPlannedExpenses) + num(budget.totalPlannedSavings) + num(budget.assignablePlannedDebt ?? budget.totalPlannedDebt);
  const tracked = num(budget.totalExpenses) + num(budget.totalTrackedSavings) + num(budget.totalTrackedDebt);
  const rows = [
    { label: 'Received income', value: num(budget.realizedIncome ?? budget.totalIncome), icon: TrendingUp, tone: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Expenses', value: num(budget.totalExpenses), icon: TrendingDown, tone: 'text-destructive bg-destructive/10' },
    { label: 'Planned', value: planned, icon: Receipt, tone: 'text-blue-600 bg-blue-500/10' },
    { label: 'Tracked', value: tracked, icon: WalletCards, tone: 'text-amber-600 bg-amber-500/10' },
  ];
  return <Section title="Budget snapshot"><div>{rows.map(({ label, value, icon: Icon, tone }) => <div key={label} className="flex min-h-12 items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2.5"><span className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={17}/></span><span className="text-sm">{label}</span></div><Money value={value} formatCurrency={formatCurrency} className="shrink-0 text-sm font-medium"/></div>)}</div></Section>;
}
function Recent({ transactions, categories, accounts, recurringTransactions, goals, formatCurrency }) {
  const navigate = useNavigate();
  const categoriesById = new Map(categories.map(item => [item.id, item]));
  const accountsById = new Map(accounts.map(item => [item.id, item]));
  const recurringById = new Map(recurringTransactions.map(item => [item.id, item]));
  const goalsById = new Map(goals.map(item => [item.id, item]));
  const rows = [...transactions]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 4);
  return <Section title="Recent transactions" action={<div className="flex items-center"><Action to="/add-transaction"><Plus size={14}/> Add</Action><Action to="/transactions">View all</Action></div>}>
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
        compactSourceBadges
        flush
        onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
      />
    )}</div> : <p className="py-5 text-center text-sm text-muted-foreground">No transactions this month.</p>}
  </Section>;
}
export default function DashboardOverview({ currentMonth, budget = {}, transactions = [], categories = [], accounts = [], recurringTransactions = [], goals = [], formatCurrency }) {
  // Retain the exact goal funding/progress calculations used throughout Cero.
  // A database goal is not necessarily an active, scheduled goal this month.
  const activeGoal = sortGoalsByPriority(goals.filter(goal =>
    goal && !goal.is_archived && goal.is_active !== false &&
    Number(goal.target_amount || 0) > 0 &&
    getGoalRemaining(goal) > 0 &&
    isGoalPlannedForMonth(goal, currentMonth)
  ))[0] || null;
  const progress = activeGoal ? getGoalProgress(activeGoal) : 0;
  return <div className="mx-auto max-w-3xl space-y-3">
    <Entrance index={0}><SafeCard budget={budget} formatCurrency={formatCurrency}/></Entrance>
    <Entrance index={1}><Snapshot budget={budget} formatCurrency={formatCurrency}/></Entrance>
    {num(budget.leftToAllocate) > 0.005 && <Entrance index={2}><div className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-primary/[0.07] px-3"><span className="text-sm font-medium"><Money value={budget.leftToAllocate} formatCurrency={formatCurrency}/> left to allocate</span><Action to="/plan">Assign <ChevronRight size={14}/></Action></div></Entrance>}
    <Entrance index={3}><div className="[&_.dashboard-section-subtitle]:hidden"><UpcomingBillsPreview recurringTransactions={recurringTransactions} accounts={accounts} categories={categories} transactions={transactions} formatCurrency={formatCurrency} limit={3}/></div></Entrance>
    <Entrance index={4}><Recent transactions={transactions} categories={categories} accounts={accounts} recurringTransactions={recurringTransactions} goals={goals} formatCurrency={formatCurrency}/></Entrance>
    {activeGoal && <Entrance index={5}><Link to="/manage-plan?tab=goals" className={`flex min-h-14 items-center gap-3 border px-3 ${cardStyle}`}><Target size={17} className="shrink-0 text-primary"/><span className="min-w-0 flex-1 truncate text-sm">{activeGoal.name}</span><div className="h-1.5 w-14 rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{width: `${progress}%`}}/></div><span className="text-xs text-muted-foreground">{progress}%</span></Link></Entrance>}
  </div>;
}
