import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  Building,
  Landmark,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  ChevronDown,
  Plus,
  Settings,
  WifiOff,
  MoreHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import NetWorthDelta from '@/components/shared/NetWorthDelta';
import { useAccounts, useCurrencyFormatter, useTransactions, useAllTransactions, useCategories } from '@/hooks/useBudgetData';
import { format, addMonths } from 'date-fns';
import { getTransactionDeltas } from '@/lib/transactionEffects';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePageEntrance } from '@/hooks/usePageTransition';

const typeIcons = {
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
  loan: Building,
  other: Wallet,
};

function InlineMoney({ children }) {
  return (
    <span className="inline-flex items-center align-middle whitespace-nowrap tabular-nums">
      {children}
    </span>
  );
}

function normalizeType(type = '') {
  return String(type).toLowerCase().replace(/\s+/g, '_');
}

function AccountSummaryCard({ cashAvailable, savingsTotal, debtTotal, formatCurrency }) {
  const items = [
    {
      label: 'Available',
      value: cashAvailable,
      Icon: Banknote,
      tone: 'text-emerald-600 dark:text-emerald-400',
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Savings',
      value: savingsTotal,
      Icon: PiggyBank,
      tone: 'text-blue-600 dark:text-blue-400',
      iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Debt',
      value: debtTotal,
      Icon: CreditCard,
      tone: 'text-purple-600 dark:text-purple-400',
      iconClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <section className="grid grid-cols-3 divide-x divide-border/40 overflow-hidden rounded-2xl app-card-surface lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!shadow-none lg:!backdrop-blur-none lg:py-3">
      {items.map(({ label, value, Icon, tone, iconClass }) => (
        <div key={label} className="flex min-w-0 flex-col items-center justify-center px-1.5 py-2.5 text-center sm:px-3">
          <div className="mb-1.5 flex flex-col items-center gap-1">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                iconClass
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
              {label}
            </span>
          </div>

          <div className={cn('flex min-w-0 justify-center text-[12px] font-semibold tabular-nums sm:text-base', tone)}>
            <InlineMoney>{formatCurrency(Math.abs(value))}</InlineMoney>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Accounts() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const location = useLocation();
  
  const header = <PageHeader title={<><span className="lg:hidden">Financial overview</span><span className="hidden lg:inline">Accounts</span></>} action={<div className="flex items-center gap-1">
    <button type="button" aria-label="Add account" onClick={() => navigate("/add-account", { state: { backgroundLocation: location } })} className="grid lg:hidden size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"><Plus className="size-[19px]" /></button>
    {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline"/>}
    <button type="button" aria-label="Settings" onClick={() => navigate("/settings")} className="grid lg:hidden size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"><Settings className="size-[19px]" /></button>
  </div>} />;
  const formatCurrency = useCurrencyFormatter();
  const {
    data: accounts = [],
    isPending: accountsPending,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccounts();

  const [desktop,setDesktop] = useState(()=>window.matchMedia('(min-width: 1024px)').matches);
  useEffect(()=>{const mq=window.matchMedia('(min-width: 1024px)');const sync=()=>setDesktop(mq.matches);mq.addEventListener('change',sync);return ()=>mq.removeEventListener('change',sync);},[]);
  const [tab,setTab]=useState('asset');
  const [selectedId,setSelectedId]=useState(null);
  const [month,setMonth]=useState(()=>format(new Date(),'yyyy-MM'));
  const {data: allAccounts=[]}=useAccounts(true);
  const {data: monthly=[],isPending: monthlyPending,isError: monthlyError}=useTransactions(month);
  const {data: history=[],isPending: historyPending,isError: historyError}=useAllTransactions();
  const {data: categories=[]}=useCategories();
  const [collapsedGroups, setCollapsedGroups] = useState({
    assets: false,
    liabilities: false,
  });

  if (accountsPending) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        {header}
        <main className="cero-page-content mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </main>
      </div>
    );
  }

  if (accountsError) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        {header}
        <main className="cero-page-content mx-auto flex min-h-[50vh] w-full max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center">
          <h2 className="text-lg font-semibold">Couldn't load accounts</h2>
          <p className="text-sm text-muted-foreground">Your data has not been changed. Check your connection and try again.</p>
          <button type="button" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => refetchAccounts()}>
            Retry
          </button>
        </main>
      </div>
    );
  }

  const assets = accounts.filter((account) => account.category === 'asset');
  const liabilities = accounts.filter(
    (account) => account.category === 'liability'
  );

  const totalAssets = assets.reduce(
    (sum, account) => sum + (Number(account.balance) || 0),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Math.abs(Number(account.balance) || 0),
    0
  );

  const cashAvailable = assets.reduce((sum, account) => {
    const type = normalizeType(account.type);

    if (type === 'checking' || type === 'cash') {
      return sum + (Number(account.balance) || 0);
    }

    return sum;
  }, 0);

  const savingsTotal = assets.reduce((sum, account) => {
    return normalizeType(account.type) === 'savings'
      ? sum + (Number(account.balance) || 0)
      : sum;
  }, 0);

  const netWorth = totalAssets - totalLiabilities;

  const rows=tab==='archived'?allAccounts.filter(a=>a.is_archived):tab==='asset'?assets:liabilities;
  const selected=rows.find(a=>a.id===selectedId);
  const activity=new Map();
  if(desktop) for(const tx of monthly){
    const deltas=getTransactionDeltas(tx,allAccounts.length?allAccounts:accounts);
    for(const [id,delta] of Object.entries(deltas)){
      const value=activity.get(id)||{inflow:0,outflow:0};
      if(delta>0)value.inflow+=delta;else value.outflow-=delta;
      activity.set(id,value);
    }
  }
  const money=value=><>{value<0?'−':''}{formatCurrency(Math.abs(value))}</>;
  const recent=selected?history.filter(t=>t.account_id===selected.id||t.to_account_id===selected.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5):[];
  const toggleGroup = (key) => {
    setCollapsedGroups((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderGroup = (title, accs, isLiability) => {
    if (accs.length === 0) return null;

    const groupKey = isLiability ? 'liabilities' : 'assets';
    const isCollapsed = collapsedGroups[groupKey];

    const total = accs.reduce(
      (sum, account) => sum + Math.abs(Number(account.balance) || 0),
      0
    );

    return (
      <section className="overflow-hidden rounded-2xl app-card-surface lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!shadow-none lg:!backdrop-blur-none">
        <button
          type="button"
          onClick={() => toggleGroup(groupKey)}
          className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
        >
          <div className="flex min-w-0 items-center gap-2">
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isCollapsed && '-rotate-90'
              )}
            />

            <h3
              className={cn(
                'truncate text-sm font-semibold',
                isLiability
                  ? 'text-destructive'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {title}
            </h3>

            <span
              className={cn(
                'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none tabular-nums',
                isLiability
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              )}
            >
              {accs.length}
            </span>
          </div>

          <div
            className={cn(
              'shrink-0 text-right text-sm font-bold tabular-nums sm:text-base',
              isLiability
                ? 'text-destructive'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            <InlineMoney>{formatCurrency(total)}</InlineMoney>
          </div>
        </button>

        {!isCollapsed && (
          <div className="divide-y divide-border/40">
            <div className="hidden grid-cols-[2.25rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(8rem,0.8fr)] gap-3 bg-muted/30 px-3 py-2 text-xs text-muted-foreground lg:grid"><span className="col-span-2">Account</span><span>Type</span><span className="text-right">Balance</span></div>
            {accs.map((account) => {
              const Icon = typeIcons[account.type] || Wallet;
              const balance = Math.abs(Number(account.balance) || 0);
              const accountColor = account.color || '#0078D4';
              const typeLabel = account.type?.replace('_', ' ') || 'Account';

              return (
                <Link
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  className="flex min-h-[3.75rem] items-center gap-2.5 px-3 py-2 transition-colors hover:bg-accent/20 lg:grid lg:min-h-12 lg:grid-cols-[2.25rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(8rem,0.8fr)] lg:gap-3"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${accountColor}15`,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{
                        color: accountColor,
                      }}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-sm font-medium leading-tight text-foreground">
                      {account.name}
                    </div>

                    <div className="mt-0.5 truncate text-[11px] capitalize leading-tight text-muted-foreground lg:hidden">
                      {typeLabel} · {isLiability ? 'Liability' : 'Asset'}
                    </div>
                  </div>

                  <span className="hidden capitalize text-sm text-muted-foreground lg:block">{typeLabel}</span>
                  <div className="flex min-w-0 shrink-0 items-center justify-end text-right">
                    <div
                      className={cn(
                        'text-sm font-semibold tabular-nums lg:font-medium',
                        isLiability ? 'text-destructive' : 'text-foreground'
                      )}
                    >
                      <InlineMoney><span className="hidden lg:inline">{!isLiability && Number(account.balance) < 0 ? "−" : ""}</span>{formatCurrency(balance)}</InlineMoney>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      {header}

      <main className="cero-page-content mx-auto w-full max-w-7xl px-4 py-3 pb-28 md:px-6 md:py-5 lg:px-8 lg:py-3 lg:pb-8">
        <div className="animate-child mb-3 lg:hidden">
          <NetWorthDelta
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="hidden items-center justify-between gap-4 py-5 lg:flex">
          <div><p className="text-xs text-muted-foreground">Net worth</p><p className="mt-1 text-2xl font-semibold tabular-nums">{netWorth < 0 ? '−' : ''}{formatCurrency(Math.abs(netWorth))}</p></div>
          <div><p className="text-xs text-muted-foreground">Total assets</p><p className="mt-1 text-lg font-semibold">{totalAssets < 0 ? '−' : ''}{formatCurrency(Math.abs(totalAssets))}</p></div>
          <div><p className="text-xs text-muted-foreground">Total liabilities</p><p className="mt-1 text-lg font-semibold text-destructive">{formatCurrency(totalLiabilities)}</p></div>
          <button type="button" onClick={() => navigate('/add-account', {state:{backgroundLocation:location}})} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus size={16}/>Add account</button>
        </div>
        <div className="hidden py-3 lg:block"><div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label="Assets and liabilities proportion">{totalAssets + totalLiabilities > 0 && <><div className="bg-emerald-500" style={{width: `${Math.max(0, Math.min(100,totalAssets/(totalAssets+totalLiabilities)*100))}%`}}/><div className="flex-1 bg-destructive"/></>}</div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Assets</span><span>Liabilities</span></div></div>
        <div className="animate-child mb-3 lg:hidden">
          <AccountSummaryCard
            cashAvailable={cashAvailable}
            savingsTotal={savingsTotal}
            debtTotal={totalLiabilities}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="hidden grid-cols-3 gap-6 border-b border-border py-4 lg:grid">{[["Available",cashAvailable],["Savings",savingsTotal],["Debt",totalLiabilities]].map(([label,value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-medium tabular-nums">{value < 0 ? "−" : ""}{formatCurrency(Math.abs(value))}</p></div>)}</div>
        <div className="hidden lg:block">
          <nav aria-label="Account groups" className="cero-workplace-tabs flex items-center gap-5 border-b border-border">
            {[['asset','Assets'],['liability','Liabilities'],['archived','Archived']].map(([key,label])=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>{setTab(key);setSelectedId(null)}} className={cn('px-2 py-3 text-sm font-medium',tab===key?'text-primary':'text-muted-foreground')}>{label}</button>)}
            <div className="ml-auto flex items-center gap-2 text-sm"><button aria-label="Previous activity month" onClick={()=>setMonth(m=>format(addMonths(new Date(m+'-01T12:00:00'),-1),'yyyy-MM'))}><ChevronLeft size={16}/></button>{format(new Date(month+'-01T12:00:00'),'MMM yyyy')}<button aria-label="Next activity month" onClick={()=>setMonth(m=>format(addMonths(new Date(m+'-01T12:00:00'),1),'yyyy-MM'))}><ChevronRight size={16}/></button></div>
          </nav>
          <div className="grid grid-cols-[minmax(0,65fr)_minmax(0,35fr)] pt-3">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/30 text-muted-foreground"><tr>{(tab==='asset'?['Account','Type','Inflow','Outflow','Balance','Share']:tab==='liability'?['Account','Type','Borrowed','Repaid','Outstanding']:['Account','Type','Balance']).map((label,i)=><th key={label} className={cn('px-2 py-2 font-medium',i<2?'text-left':'text-right')}>{label}</th>)}</tr></thead><tbody>
            {rows.map(account=>{const Icon=typeIcons[account.type]||Wallet;const v=activity.get(account.id)||{inflow:0,outflow:0};const balance=Number(account.balance)||0;const share=totalAssets>0?balance/totalAssets*100:0;return <tr key={account.id} onClick={()=>setSelectedId(account.id)} className={cn('cursor-pointer border-b border-border/60 hover:bg-muted/30',selectedId===account.id&&'bg-primary/10')}><td className="px-2 py-3"><button onClick={()=>setSelectedId(account.id)} className="flex items-center gap-2 text-left"><Icon size={16} style={{color:account.color||undefined}}/>{account.name}</button></td><td className="px-2 py-3 capitalize text-muted-foreground">{account.type?.replaceAll('_',' ')}</td>{tab!=='archived'&&<><td className="px-2 py-3 text-right whitespace-nowrap text-emerald-500">{monthlyPending||monthlyError?'—':money(v.inflow)}</td><td className="px-2 py-3 text-right whitespace-nowrap text-destructive">{monthlyPending||monthlyError?'—':money(v.outflow)}</td></>}<td className="px-2 py-3 text-right whitespace-nowrap font-medium">{money(tab==='liability'?Math.abs(balance):balance)}</td>{tab==='asset'&&<td className="px-2 py-3 text-right"><span>{share.toFixed(1)}%</span><div className="ml-auto mt-1 h-1 w-10 rounded bg-muted"><div className="h-full rounded bg-primary" style={{width:Math.max(0,Math.min(100,share))+'%'}}/></div></td>}</tr>})}
            </tbody></table>{!rows.length&&<p className="p-6 text-center text-sm text-muted-foreground">No accounts in this section.</p>}{monthlyError&&<p className="p-2 text-sm text-destructive">Monthly activity could not be loaded.</p>}</div>
            <aside className="min-w-0 border-l border-border px-5 py-3 space-y-4">
            {selected?<><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{selected.name}</h2>{!selected.is_archived&&<DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Account actions"><MoreHorizontal size={20}/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>navigate('/accounts/'+selected.id+'/edit')}>Edit account</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={()=>navigate('/accounts/'+selected.id+'?action=delete')}>Delete account</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div><div><p className="text-sm text-muted-foreground">Current balance</p><p className="text-2xl font-semibold">{money(Number(selected.balance)||0)}</p></div>
            <div className="space-y-2 border-t border-border pt-3"><h3 className="font-semibold">Monthly activity</h3>{(selected.category==='liability'?[['Borrowed',activity.get(selected.id)?.inflow||0],['Repaid',activity.get(selected.id)?.outflow||0]]:[['Inflow',activity.get(selected.id)?.inflow||0],['Outflow',activity.get(selected.id)?.outflow||0],['Net movement',(activity.get(selected.id)?.inflow||0)-(activity.get(selected.id)?.outflow||0)]]).map(([label,value])=><div key={label} className="flex justify-between gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span>{monthlyPending||monthlyError?'—':money(value)}</span></div>)}</div>
            <div className="space-y-3 border-t border-border pt-3"><h3 className="font-semibold">Recent transactions</h3>{historyPending||historyError?<p className="text-sm text-muted-foreground">{historyError?'Unable to load transactions':'Loading…'}</p>:recent.length?recent.map(tx=>{const delta=getTransactionDeltas(tx,allAccounts.length?allAccounts:accounts)[selected.id]||0;return <div key={tx.id} className="flex items-center justify-between gap-2 text-sm"><div className="min-w-0"><p className="truncate">{categories.find(c=>c.id===tx.category_id)?.name||tx.category_name_snapshot||tx.type}</p><p className="text-xs text-muted-foreground">{tx.date}</p></div><span className={cn('whitespace-nowrap',delta<0?'text-destructive':'text-emerald-500')}>{money(delta)}</span></div>}):<p className="text-sm text-muted-foreground">No transactions yet.</p>}{!selected.is_archived&&<Link className="text-sm text-primary" to={'/accounts/'+selected.id}>View full history →</Link>}</div></>:<><h2 className="text-lg font-semibold">Account summary</h2><p className="text-sm text-muted-foreground">Select an account to see its balance and recent transactions.</p></>}
            </aside>
          </div>
        </div>
        <div className="animate-child space-y-3 lg:hidden">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

      </main>
    </div>
  );
}
