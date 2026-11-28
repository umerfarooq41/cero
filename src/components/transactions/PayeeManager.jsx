import {useState,useMemo} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {supabase} from '@/lib/supabase';
import {useCategories,useAllTransactions,useAccounts} from '@/hooks/useBudgetData';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {toast} from 'sonner';
import {Plus,ChevronRight,Pencil,MoreVertical,Search} from 'lucide-react';
import {useNavigate,useParams,useLocation} from 'react-router-dom';
import {useCurrency} from '@/hooks/useCurrency';
import {getCurrencyCode,getCurrencySymbol,formatCurrencyNumberText} from '@/lib/currencies';
import TransactionRow from '@/components/transactions/TransactionRow';
import {format,parseISO} from 'date-fns';
import CategoryIcon from '@/components/shared/CategoryIcon';
import PageHeader from '@/components/layout/PageHeader';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';

export function usePayees(){
 const {session}=useAuth();
 return useQuery({queryKey:['payees',session?.user?.id],enabled:!!session?.user?.id,retry:false,queryFn:async()=>{const {data,error}=await supabase.from('payees').select('*').eq('user_id',session.user.id).order('name');if(error)throw error;return data||[];}});
}
function Money({value,currency}) {
 const code=getCurrencyCode(currency);
 return <span className="inline-flex items-center gap-1 tabular-nums">{code==='SAR'?<span aria-label="SAR" className="inline-block size-[1em] bg-current" style={{mask:'url(/sar.svg) center / contain no-repeat',WebkitMask:'url(/sar.svg) center / contain no-repeat'}}/>:getCurrencySymbol(code)}{formatCurrencyNumberText(value)}</span>;
}
function CategoryPills({categories,value,onChange}){
 const [query,setQuery]=useState('');
 const [showAll,setShowAll]=useState(false);
 const eligible=categories.filter(c=>!c.is_archived&&['expense','income'].includes(c.type));
 const matching=eligible.filter(c=>c.name.toLowerCase().includes(query.trim().toLowerCase()));
 const ordered=[...matching].sort((a,b)=>Number(b.id===value)-Number(a.id===value));
 const visible=showAll||query.trim()?ordered:ordered.slice(0,8);
 const pill=active=>'inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm '+(active?'border-primary bg-primary/10 text-primary':'border-border bg-muted/30');
 return <div role="group" aria-labelledby="payee-category-label" className="space-y-2">
 {eligible.length>8&&<Input aria-label="Search categories" placeholder="Search categories" value={query} onChange={e=>setQuery(e.target.value)} className="h-9"/>}
 <div className="flex flex-wrap gap-2"><button type="button" aria-pressed={!value} onClick={()=>onChange('')} className={pill(!value)}>None</button>{visible.map(c=><button key={c.id} type="button" aria-pressed={value===c.id} onClick={()=>onChange(c.id)} className={pill(value===c.id)}><CategoryIcon icon={c.icon||'tag'} color={c.color} size="sm"/><span className="break-words text-left">{c.name}</span></button>)}</div>
 {!query.trim()&&matching.length>8&&<button type="button" onClick={()=>setShowAll(v=>!v)} className="text-sm text-primary">{showAll?'Show less':'View all ('+matching.length+')'}</button>}
 {!matching.length&&<p className="text-xs text-muted-foreground">No matching categories.</p>}
 </div>;
}
export function PayeeManager(){
 const navigate=useNavigate(),location=useLocation(),{payeeId}=useParams();
 const {data:rows=[],error,isLoading}=usePayees();
 const {data:categories=[]}=useCategories();
 const {data:accounts=[]}=useAccounts(true);
 const {data:transactions=[],isLoading:loadingTransactions}=useAllTransactions();
 const currency=useCurrency(),qc=useQueryClient();
 const [search,setSearch]=useState(''),[archived,setArchived]=useState(false),[period,setPeriod]=useState('all'),[mode,setMode]=useState(''),[name,setName]=useState(''),[category,setCategory]=useState(''),[merge,setMerge]=useState(''),[busy,setBusy]=useState(false),[menu,setMenu]=useState(false);
 const selected=rows.find(p=>p.id===payeeId);
 const byName=useMemo(()=>{const m=new Map();for(const t of transactions){const k=t.payee_name?.trim().toLowerCase();if(k){if(!m.has(k))m.set(k,[]);m.get(k).push(t);}}return m;},[transactions]);
 const currentMonth=format(new Date(),'yyyy-MM');
 const history=(byName.get(selected?.name.toLowerCase())||[]).filter(t=>period==='all'||String(t.date).startsWith(currentMonth)).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const expenses=history.filter(t=>t.type==='expense'),income=history.filter(t=>t.type==='income');
 const total=items=>items.reduce((sum,t)=>sum+Number(t.amount||0),0);
 const categoryMap=new Map(categories.map(c=>[c.id,c])),accountMap=new Map(accounts.map(a=>[a.id,a]));
 const start=action=>{setMenu(false);setMode(action);setName(action==='add'?'':selected?.name||'');setCategory(action==='add'?'':selected?.default_category_id||'');setMerge('');};
 const save=async()=>{if(busy||!navigator.onLine)return;setBusy(true);try{const {error}=await supabase.rpc('cero_manage_payee',{p_action:mode==='add'||mode==='edit'?'save':mode,p_id:mode==='add'?null:selected?.id||null,p_name:name.trim()||null,p_target_id:merge||null,p_category_id:category||null});if(error)throw error;await qc.invalidateQueries();setMode('');if(mode==='delete'||mode==='merge'||mode==='archive'||mode==='restore')navigate('/settings/payees');toast.success('Payee updated');}catch(e){toast.error(e.message||'Could not update payee');}finally{setBusy(false);}};
 const duplicate=rows.some(p=>p.id!==(mode==='add'?null:selected?.id)&&p.name.toLowerCase()===name.trim().toLowerCase());
 return <div className="min-h-full"><PageHeader title={selected?.name||'Payees'} onBack={()=>navigate(payeeId?'/settings/payees':'/settings')} action={<div className="flex items-center gap-1">{!payeeId?<button type="button" aria-label="Add payee" onClick={()=>start('add')} className="grid size-9 place-items-center text-primary"><Plus className="size-5"/></button>:selected&&<><button type="button" aria-label="Edit payee" onClick={()=>start('edit')} className="grid size-9 place-items-center text-primary"><Pencil className="size-4"/></button><div className="relative"><button type="button" aria-label="Payee actions" aria-expanded={menu} onClick={()=>setMenu(v=>!v)} className="grid size-9 place-items-center"><MoreVertical className="size-5"/></button>{menu&&<div className="absolute right-0 top-full z-20 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">{[['merge','Merge payee'],[selected.is_archived?'restore':'archive',selected.is_archived?'Restore payee':'Archive payee'],['delete','Delete payee']].map(([k,l])=><button type="button" key={k} onClick={()=>start(k)} className={'block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted '+(k==='delete'?'text-destructive':'')}>{l}</button>)}</div>}</div></>}</div>}/><main className="cero-page-content mx-auto w-full max-w-6xl px-4 pb-8 pt-2 lg:px-8">
 {isLoading?<p className="py-6 text-sm text-muted-foreground">Loading payees…</p>:error?<p className="py-6 text-sm text-muted-foreground">Payee registry unavailable. Reconnect and try again.</p>:!payeeId?<><nav className="flex border-b border-border">{[false,true].map(v=><button type="button" key={String(v)} aria-pressed={archived===v} onClick={()=>setArchived(v)} className={'flex-1 border-b-2 py-3 text-sm font-medium '+(archived===v?'border-primary text-primary':'border-transparent text-muted-foreground')}>{v?'Archived':'Active'} ({rows.filter(p=>p.is_archived===v).length})</button>)}</nav><div className="relative my-3"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search payees" className="h-10 pl-9" placeholder="Search payees" value={search} onChange={e=>setSearch(e.target.value)}/></div><div>{rows.filter(p=>p.is_archived===archived&&p.name.toLowerCase().includes(search.toLowerCase())).map(p=>{const count=byName.get(p.name.toLowerCase())?.length||0;return <button key={p.id} type="button" onClick={()=>{setPeriod('all');navigate('/settings/payees/'+p.id)}} className="flex min-h-12 w-full items-center gap-3 border-b border-border/60 py-2.5 text-left hover:bg-muted/30"><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{p.name}</span><span className="block text-xs text-muted-foreground">{count} {count===1?'transaction':'transactions'}{categoryMap.get(p.default_category_id)?.name?' · '+categoryMap.get(p.default_category_id).name:''}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground"/></button>})}{!rows.some(p=>p.is_archived===archived&&p.name.toLowerCase().includes(search.toLowerCase()))&&<p className="py-8 text-center text-sm text-muted-foreground">No payees found</p>}</div></>:selected?<><div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm"><span className="text-muted-foreground">Default category</span><span>{categoryMap.get(selected.default_category_id)?.name||'None'}</span></div><div className="flex items-center justify-between pt-3"><h2 className="text-sm font-medium">Activity summary</h2><Select value={period} onValueChange={setPeriod}><SelectTrigger aria-label="Activity period" className="h-9 w-auto min-w-28"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All time</SelectItem><SelectItem value="month">This month</SelectItem></SelectContent></Select></div><div className="grid grid-cols-2 gap-3 border-b border-border/60 py-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Total spent</p><p className="mt-1 text-lg font-semibold text-destructive"><Money value={total(expenses)} currency={currency}/></p></div>{income.length>0&&<div><p className="text-xs text-muted-foreground">Total received</p><p className="mt-1 text-lg font-semibold text-[hsl(var(--success))]"><Money value={total(income)} currency={currency}/></p></div>}<div><p className="text-xs text-muted-foreground">Transactions</p><p className="mt-1 text-lg font-semibold">{history.length}</p></div></div><h2 className="pb-1 pt-4 text-sm font-semibold">Transactions</h2>{loadingTransactions?<p className="text-sm text-muted-foreground">Loading transactions…</p>:!history.length?<p className="py-6 text-sm text-muted-foreground">No transactions in this period.</p>:history.map((t,i)=><div key={t.id}>{(i===0||history[i-1].date!==t.date)&&<h3 className="border-b border-border/60 py-2 text-xs font-medium text-muted-foreground">{format(parseISO(t.date),'d MMMM yyyy')}</h3>}<div className="border-b border-border/60"><TransactionRow transaction={t} category={categoryMap.get(t.category_id)} account={accountMap.get(t.account_id)} toAccount={accountMap.get(t.to_account_id)} formatCurrency={v=><Money value={v} currency={currency}/>} flush onClick={()=>navigate('/transactions/'+t.id+'/edit',{state:{backgroundLocation:location,returnTo:location.pathname}})}/></div></div>)}</>:<p className="py-6 text-sm text-muted-foreground">Payee not found.</p>}
 <Dialog open={!!mode} onOpenChange={v=>{if(!v&&!busy)setMode('')}}><DialogContent className="sm:max-w-md app-desktop-editor" onOpenAutoFocus={e=>e.preventDefault()}><DialogHeader><DialogTitle>{mode==='add'?'New payee':mode==='edit'?'Edit payee':mode.charAt(0).toUpperCase()+mode.slice(1)+' payee'}</DialogTitle><DialogDescription className="sr-only">Manage payee information and associations.</DialogDescription></DialogHeader><div className="app-dialog-scroll space-y-3 py-1">
 {['add','edit'].includes(mode)&&<><div className="space-y-1.5"><label className="block text-xs font-medium text-muted-foreground" htmlFor="payee-name">Payee name</label><Input id="payee-name" maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Enter payee name" className="h-10"/>{duplicate&&<p className="text-xs text-destructive">A payee with this name already exists. Use Merge instead.</p>}</div><div className="space-y-1.5"><label className="block text-xs font-medium text-muted-foreground" id="payee-category-label">Default category (optional)</label><CategoryPills categories={categories} value={category} onChange={setCategory}/><p className="text-xs text-muted-foreground">Used when selecting this payee in a new transaction.</p></div></>}
 {mode==='merge'&&<div className="space-y-2"><p className="text-sm">Move transactions from {selected?.name} to another payee.</p><Select value={merge} onValueChange={setMerge}><SelectTrigger aria-label="Merge destination"><SelectValue placeholder="Choose payee"/></SelectTrigger><SelectContent>{rows.filter(p=>p.id!==selected?.id).map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>}
 {mode==='delete'&&<p className="text-sm">Remove {selected?.name} from its transactions? Transactions and balances remain unchanged.</p>}{mode==='archive'&&<p className="text-sm">Hide {selected?.name} from suggestions while preserving history?</p>}{mode==='restore'&&<p className="text-sm">Restore this payee to suggestions?</p>}
 </div><div className="app-dialog-actions flex items-center gap-2"><Button data-app-sheet-cancel variant="outline" disabled={busy} onClick={()=>setMode('')} className="hidden lg:inline-flex">Cancel</Button><Button className="flex-1 lg:flex-none lg:ml-auto" variant={mode==='delete'?'destructive':'default'} disabled={busy||(['add','edit'].includes(mode)&&(!name.trim()||duplicate))||(mode==='merge'&&!merge)} onClick={save}>{busy?'Saving…':['add','edit'].includes(mode)?'Save changes':'Confirm'}</Button></div></DialogContent></Dialog>
 </main></div>;
}
