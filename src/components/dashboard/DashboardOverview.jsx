import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarClock, ChevronRight, Plus, Receipt, Target, TrendingDown, TrendingUp, Wallet, WalletCards } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sortRecurringByDueDate } from '@/lib/recurringTransactions';

const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const cardStyle = 'rounded-2xl border-border/50 bg-card/70 shadow-sm backdrop-blur-xl';
const amountStyle = 'font-["DM_Mono",monospace] tabular-nums tracking-tight';
const formatDate = value => {
  if (!value || !/^\\d{4}-\\d{2}-\\d{2}/.test(String(value))) return '—';
  return format(parseISO(String(value).slice(0, 10)), 'MMM d');
};
function Money({ value, formatCurrency, className = '' }) {
  const str = formatCurrency(num(value));
  const match = str.match(/[-−+]?\\d[\\d\\s,.\u0660-\u0669]*/);
  if (!match || match.index == null) return <span className={className}>{str}</span>;
  const start = match.index;
  return <span className={className}><span className="font-sans">{str.slice(0, start)}</span><span className={amountStyle}>{match[0]}</span><span className="font-sans">{str.slice(start + match[0].length)}</span></span>;
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
function SafeCard({ formatCurrency }) {
  // A safe daily allowance requires verified discretionary funding and liquid reserves.
  // Do not infer it from total income, balances, or planned expenses.
  return <Card className={cardStyle + ' border-primary/20'}><CardContent className="space-y-3 p-4">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">Safe to spend today</p><Badge variant="secondary" className="rounded-full text-[10px]">Awaiting funding data</Badge></div>
    <div className="flex items-baseline gap-2"><Money value={0} formatCurrency={formatCurrency} className="text-4xl font-semibold leading-none"/><span className="text-sm text-muted-foreground">/ day</span></div>
    <p className="text-xs text-muted-foreground">Discretionary funds must be verified before a safe amount can be shown.</p>
    <div className="relative h-2 rounded-full bg-primary/10"><motion.div className="h-full rounded-full bg-primary/40" initial={{ width: 0 }} animate={{ width: 0 }} /></div>
    <p className="text-xs text-muted-foreground">Projection unavailable until fixed and discretionary expenses are separated.</p>
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
function Upcoming({ rules, accounts, formatCurrency }) {
  const names = new Map(accounts.map(a => [a.id, a.name]));
  const rows = sortRecurringByDueDate(rules).filter(r => r.is_active !== false && !r.completed_at && r.next_due_date).slice(0, 3);
  return <Section title="Upcoming" action={<Action to="/transactions?tab=scheduled">View all <ChevronRight size={14}/></Action>}>
    {rows.length ? rows.map(r => { const transfer = r.type === 'transfer'; const Icon = transfer ? ArrowLeftRight : CalendarClock; return <div key={r.id} className="flex min-h-14 items-center justify-between gap-2 border-b border-border/30 last:border-0"><div className="flex min-w-0 items-center gap-2.5"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${transfer ? 'bg-blue-500/10 text-blue-600' : 'bg-secondary text-muted-foreground'}`}><Icon size={17}/></span><div className="min-w-0"><p className="truncate text-sm font-medium">{transfer ? `Transfer to ${names.get(r.to_account_id) || 'account'}` : r.name}</p><p className="text-xs text-muted-foreground">{formatDate(r.next_due_date)}</p></div></div><Money value={Math.abs(num(r.amount))} formatCurrency={formatCurrency} className="shrink-0 text-sm"/></div>; }) : <p className="py-5 text-center text-sm text-muted-foreground">No upcoming payments.</p>}
  </Section>;
}
function Recent({ transactions, categories, formatCurrency }) {
  const names = new Map(categories.map(c => [c.id, c.name]));
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const rows = [...transactions].sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0,4);
  return <Section title="Recent transactions" action={<div className="flex items-center"><Action to="/add-transaction"><Plus size={14}/> Add</Action><Action to="/transactions">View all</Action></div>}>
    {rows.length ? rows.map(t => { const income = t.type === 'income', transfer = t.type === 'transfer'; const Icon = transfer ? ArrowLeftRight : income ? ArrowDownLeft : ArrowUpRight; const day = String(t.date || '').slice(0,10); return <Link to={`/transactions/${t.id}/edit`} key={t.id} className="flex min-h-14 items-center justify-between gap-2 border-b border-border/30 last:border-0"><div className="flex min-w-0 items-center gap-2.5"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${income ? 'bg-emerald-500/10 text-emerald-600' : transfer ? 'bg-blue-500/10 text-blue-600' : 'bg-destructive/10 text-destructive'}`}><Icon size={17}/></span><div className="min-w-0"><p className="flex items-center gap-1 truncate text-sm font-medium">{names.get(t.category_id) || (transfer ? 'Transfer' : income ? 'Income' : 'Expense')}{t.recurring_transaction_id && <Badge variant="secondary" className="h-4 px-1 text-[9px]">R</Badge>}</p><p className="text-xs text-muted-foreground">{day === today ? 'Today' : day === yesterday ? 'Yesterday' : formatDate(day)}</p></div></div><span className={`shrink-0 text-sm font-medium ${income ? 'text-emerald-600' : transfer ? '' : 'text-destructive'}`}>{income ? '+' : transfer ? '' : '−'}<Money value={Math.abs(num(t.amount))} formatCurrency={formatCurrency}/></span></Link>; }) : <p className="py-5 text-center text-sm text-muted-foreground">No transactions yet.</p>}
  </Section>;
}
export default function DashboardOverview({ budget = {}, transactions = [], categories = [], accounts = [], recurringTransactions = [], goals = [], formatCurrency }) {
  const activeGoal = goals.find(g => !g.is_archived && num(g.current_amount) < num(g.target_amount));
  const pct = activeGoal && num(activeGoal.target_amount) > 0 ? Math.min(100, Math.max(0, 100 * num(activeGoal.current_amount) / num(activeGoal.target_amount))) : 0;
  return <div className="mx-auto max-w-3xl space-y-3">
    <Entrance index={0}><SafeCard formatCurrency={formatCurrency}/></Entrance>
    <Entrance index={1}><Snapshot budget={budget} formatCurrency={formatCurrency}/></Entrance>
    {num(budget.leftToAllocate) > 0.005 && <Entrance index={2}><div className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-primary/[0.07] px-3"><span className="text-sm font-medium"><Money value={budget.leftToAllocate} formatCurrency={formatCurrency}/> left to allocate</span><Action to="/plan">Assign <ChevronRight size={14}/></Action></div></Entrance>}
    <Entrance index={3}><Upcoming rules={recurringTransactions} accounts={accounts} formatCurrency={formatCurrency}/></Entrance>
    <Entrance index={4}><Recent transactions={transactions} categories={categories} formatCurrency={formatCurrency}/></Entrance>
    {activeGoal && <Entrance index={5}><Link to="/plan" className={`flex min-h-14 items-center gap-3 border px-3 ${cardStyle}`}><Target size={17} className="shrink-0 text-primary"/><span className="min-w-0 flex-1 truncate text-sm">{activeGoal.name}</span><div className="h-1.5 w-14 rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{width: `${pct}%`}}/></div><span className="text-xs text-muted-foreground">{Math.round(pct)}%</span></Link></Entrance>}
  </div>;
}
