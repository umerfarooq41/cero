import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {supabase} from '@/lib/supabase';
import {useCategories,useAllTransactions} from '@/hooks/useBudgetData';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {toast} from 'sonner';
import {Plus,Store} from 'lucide-react';

export function usePayees(){
 const {session}=useAuth();
 return useQuery({queryKey:['payees',session?.user?.id],enabled:!!session?.user?.id,retry:false,queryFn:async()=>{const {data,error}=await supabase.from('payees').select('*').eq('user_id',session.user.id).order('name');if(error)throw error;return data||[];}});
}
export function PayeeManager({open,onClose,onChange}){
 const {data:rows,error,isLoading}=usePayees();
 const {data:categories=[]}=useCategories();
 const {data:transactions=[]}=useAllTransactions();
 const qc=useQueryClient();
 const [search,setSearch]=useState(''),[target,setTarget]=useState(null),[mode,setMode]=useState(''),[name,setName]=useState(''),[category,setCategory]=useState(''),[merge,setMerge]=useState(''),[busy,setBusy]=useState(false);
 const start=(action,p)=>{setMode(action);setTarget(p);setName(p?.name||'');setCategory(p?.default_category_id||'');setMerge('');};
 const save=async()=>{if(busy)return;setBusy(true);try{const {error}=await supabase.rpc('cero_manage_payee',{p_action:mode,p_id:target?.id||null,p_name:name.trim()||null,p_target_id:merge||null,p_category_id:category||null});if(error)throw error;onChange?.(target?.name,mode==='merge'?rows.find(p=>p.id===merge)?.name:mode==='delete'?'':mode==='save'?name.trim():target?.name);await qc.invalidateQueries();setMode('');toast.success('Payee updated');}catch(e){toast.error(e.message||'Could not update payee');}finally{setBusy(false);}};
 return <Dialog open={open} onOpenChange={v=>{if(!v&&!busy)onClose()}}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Manage payees</DialogTitle></DialogHeader>
 <div className="max-h-[65dvh] overflow-y-auto space-y-3">
 {isLoading?<p>Loading payees…</p>:error?<p className="text-sm text-muted-foreground">Payee registry unavailable. Apply the payee management database migration and reconnect.</p>:<>
 <div className="flex gap-2"><Input placeholder="Search payees" value={search} onChange={e=>setSearch(e.target.value)}/><Button onClick={()=>start('save',null)}><Plus className="size-4"/> Add</Button></div>
 {mode&&<div className="space-y-3 border border-border rounded-lg p-3"><p className="font-medium capitalize">{mode==='save'?(target?'Edit payee':'New payee'):mode+' payee'}</p>
 {mode==='save'&&<><Input aria-label="Payee name" maxLength={120} value={name} onChange={e=>setName(e.target.value)}/><label className="text-xs text-muted-foreground">Default category (optional)</label><select className="w-full rounded-md border bg-background p-2 text-sm" value={category} onChange={e=>setCategory(e.target.value)}><option value="">None</option>{categories.filter(c=>['expense','income'].includes(c.type)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></>}
 {mode==='merge'&&<select aria-label="Merge into" className="w-full rounded-md border bg-background p-2" value={merge} onChange={e=>setMerge(e.target.value)}><option value="">Choose destination payee</option>{rows.filter(p=>p.id!==target.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}
 {mode==='delete'&&<p className="text-sm text-muted-foreground">Remove this payee from all associated transactions? Transactions and balances remain unchanged.</p>}
 {mode==='archive'&&<p className="text-sm">Hide this payee from suggestions without changing history?</p>}
 <div className="flex justify-end gap-2"><Button variant="ghost" disabled={busy} onClick={()=>setMode('')}>Cancel</Button><Button disabled={busy||(mode==='save'&&!name.trim())||(mode==='merge'&&!merge)} onClick={save}>{busy?'Saving…':'Confirm'}</Button></div></div>}
 {rows.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(p=><div key={p.id} className="border-b border-border py-3"><div className="flex items-center gap-2"><Store className="size-4 text-muted-foreground"/><div className="flex-1 min-w-0"><p className="font-medium break-words">{p.name}{p.is_archived?' (Archived)':''}</p><p className="text-xs text-muted-foreground">{transactions.filter(t=>t.payee_name?.trim().toLowerCase()===p.name.toLowerCase()).length} transactions</p></div></div><div className="flex flex-wrap gap-1 mt-2">{[['save','Edit'],['merge','Merge'],[p.is_archived?'restore':'archive',p.is_archived?'Restore':'Archive'],['delete','Delete']].map(([a,l])=><Button key={a} size="sm" variant="ghost" disabled={busy} onClick={()=>start(a,p)}>{l}</Button>)}</div></div>)}
 </>}</div></DialogContent></Dialog>;
}
