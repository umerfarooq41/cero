import MobileHeaderActions from '@/components/layout/MobileHeaderActions';
import { format as formatRegisterDate, parseISO as parseRegisterDate } from 'date-fns';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Pencil, Plus, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { recurringTransactionsApi } from '@/lib/budgetData';
import { supabase } from '@/lib/supabase';
import { getFixedDebtNextDueDate } from '@/lib/recurringTransactions';
import { useAccounts, useAllTransactions, useCategories, useRecurringTransactions } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { countVerifiedRecurringOccurrencesByRule, sumRecurringPostedByRule } from '@/components/transactions/scheduledUtils';
import { normalizeRuleType } from './recurringPanelHelpers';

import RecurringRuleModal from './RecurringRuleModal';
import { RecurringActionSheet, RecurringSection, CompletedDebtsSection } from './RecurringRuleSections';

export default function ManageRecurringPanel({embedded=false,request=null}) {
  const [desktopTab,setDesktopTab] = useState('income');
  const [desktopSelected,setDesktopSelected] = useState(null);
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { data: recurringRules = [] } = useRecurringTransactions();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [initialType, setInitialType] = useState('expense');
  const [saving, setSaving] = useState(false);
  const [recurringSaveError, setRecurringSaveError] = useState('');
  const recurringPaidByRule = useMemo(
    () => sumRecurringPostedByRule(allTransactions),
    [allTransactions]
  );
  const verifiedOccurrencesByRule = useMemo(
    () => countVerifiedRecurringOccurrencesByRule(allTransactions),
    [allTransactions]
  );

  const completedDebtRules = useMemo(() => {
    return recurringRules
      .filter((rule) => !rule.is_archived && normalizeRuleType(rule.type) === 'transfer')
      .filter((rule) => {
        const total = Math.max(0, Number(rule.total_amount || 0));
        const paid = Math.max(0, Number(recurringPaidByRule[rule.id] || 0));
        return !!rule.completed_at || (total > 0 && paid >= total - 0.005);
      })
      .sort((a, b) =>
        String(b.completed_at || b.next_due_date || '').localeCompare(
          String(a.completed_at || a.next_due_date || '')
        )
      );
  }, [recurringPaidByRule, recurringRules, verifiedOccurrencesByRule]);

  const visibleRules = useMemo(() => {
    return recurringRules
      .filter((rule) => !rule.is_archived)
      .filter((rule) => {
        if (normalizeRuleType(rule.type) !== 'transfer') return true;
        const total = Math.max(0, Number(rule.total_amount || 0));
        const paid = Math.max(0, Number(recurringPaidByRule[rule.id] || 0));
        return !rule.completed_at && (total <= 0 || paid < total - 0.005);
      })
      .map((rule) => {
        if (
          normalizeRuleType(rule.type) !== 'transfer' ||
          (rule.payment_mode || 'fixed') !== 'fixed'
        ) return rule;

        const postedOccurrences = Math.max(
          0,
          Number(verifiedOccurrencesByRule[rule.id] || 0)
        );

        return {
          ...rule,
          next_due_date: getFixedDebtNextDueDate(rule, postedOccurrences),
        };
      })
      .sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active === false ? 1 : -1;
        return String(a.next_due_date || '').localeCompare(String(b.next_due_date || ''));
      });
  }, [recurringPaidByRule, recurringRules, verifiedOccurrencesByRule]);

  const groupedRules = useMemo(() => {
    return {
      income: visibleRules.filter((rule) => normalizeRuleType(rule.type) === 'income'),
      expense: visibleRules.filter((rule) => normalizeRuleType(rule.type) === 'expense'),
      transfer: visibleRules.filter((rule) => normalizeRuleType(rule.type) === 'transfer'),
    };
  }, [visibleRules]);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => query.queryKey?.[0] === 'recurring-transactions',
    });
  };

  const openNew = (type = 'expense') => {
    setInitialType(type);
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setInitialType(normalizeRuleType(rule.type));
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handledRequest = useRef(null);
  useEffect(()=>{if(!request||handledRequest.current===request)return;if(!request.row){handledRequest.current=request;openNew(request.type==='debt'?'transfer':request.type);}else {const rule=recurringRules.find(item=>item.id===request.row.id);if(rule){handledRequest.current=request;openEdit(rule);}}},[request,recurringRules]);
  const handleSave = async (payload) => {
    setRecurringSaveError('');
    setSaving(true);
    const rulePayload = payload;

    try {
      if (editingRule?.id) {
        await recurringTransactionsApi.update(editingRule.id, rulePayload);
        toast.success('Recurring rule updated');
      } else if (rulePayload.type === 'transfer') {
        const { error } = await supabase.rpc('cero_create_debt_rule', {
          p_name: rulePayload.name,
          p_amount: Number(rulePayload.amount),
          p_total_amount: Number(rulePayload.total_amount),
          p_duration_count: rulePayload.duration_count ?? null,
          p_duration_unit: rulePayload.duration_unit ?? null,
          p_payment_mode: rulePayload.payment_mode || 'fixed',
          p_category_id: rulePayload.category_id || null,
          p_account_id: rulePayload.account_id,
          p_to_account_id: rulePayload.to_account_id,
          p_frequency: rulePayload.frequency,
          p_start_date: rulePayload.start_date || rulePayload.next_due_date,
          p_next_due_date: rulePayload.next_due_date,
          p_is_active: rulePayload.is_active !== false,
          p_icon: rulePayload.icon || null,
          p_color: rulePayload.color || null,
          p_note: rulePayload.note || null,
        });
        if (error) throw error;
        toast.success('Recurring rule created');
      } else {
        await recurringTransactionsApi.create(rulePayload);
        toast.success('Recurring rule created');
      }

      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      await refresh();
      setModalOpen(false);
      setEditingRule(null);
      setSelectedRule(null);
    } catch (error) {
      console.error('Recurring rule save failed:', error);
      const message = [error?.message, error?.details, error?.hint].filter(Boolean).join(' · ') || 'Could not save recurring rule';
      setRecurringSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (rule) => {
    try {
      await recurringTransactionsApi.update(rule.id, {
        is_archived: !rule.is_archived,
      });
      await refresh();
      toast.success(rule.is_archived ? 'Recurring rule restored' : 'Recurring rule archived');
    } catch (error) {
      console.error('Recurring rule archive failed:', error);
      toast.error(error.message || 'Could not archive recurring rule');
    }
  };

  const handleDelete = async (rule) => {
    try {
      await recurringTransactionsApi.delete(rule.id);
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await refresh();
      toast.success('Recurring rule deleted');
    } catch (error) {
      console.error('Recurring rule delete failed:', error);
      toast.error(error.message || 'Could not delete recurring rule');
    }
  };

  const handleAction = (rule) => {
    setSelectedRule(rule);
    setActionSheetOpen(true);
  };

  const groups = {income:groupedRules.income,expense:groupedRules.expense,transfer:groupedRules.transfer,completed:completedDebtRules,archived:recurringRules.filter(rule=>rule.is_archived)};
  const labels = {income:'Income',expense:'Expenses',transfer:'Debt payments',completed:'Completed debts',archived:'Archived'};
  const rows = groups[desktopTab];
  const selected = rows.find(row=>row.id===desktopSelected);
  const debtDetails = (rule) => {
    const total = Number(rule.total_amount || 0);
    if (normalizeRuleType(rule.type) !== 'transfer' || total <= 0) return null;
    const paid = Number(recurringPaidByRule[rule.id] || 0);
    const remaining = Math.max(0, total - paid);
    const percent = Math.max(0, Math.min(100, paid / total * 100));
    return <div className="space-y-2 border-t border-border pt-2">{[['Total debt',total],['Paid',paid],['Outstanding',remaining]].map(([label,value])=><div key={label} className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{formatCurrency(value)}</span></div>)}<div className="flex justify-between text-xs text-muted-foreground"><span>Repayment progress</span><span>{Math.round(percent)}%</span></div><div role="progressbar" aria-label="Repayment progress" aria-valuenow={Math.round(percent)} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{width:percent+'%'}}/></div></div>;
  };
  return (
    <div className="space-y-3 lg:space-y-5">
      {!embedded&&<div><MobileHeaderActions onAdd={['income','expense','transfer'].includes(desktopTab)?()=>openNew(desktopTab):undefined} addLabel="Add rule" items={[{label:"Completed debts",onClick:()=>{setDesktopTab("completed");setDesktopSelected(null)}},{label:"Archived",onClick:()=>{setDesktopTab("archived");setDesktopSelected(null)}}]}/>
<div className="cero-tab-toolbar"><nav className="cero-workplace-tabs flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border workspace:gap-5" aria-label="Recurring types">{Object.entries(labels).map(([key,label])=><button key={key} type="button" aria-pressed={desktopTab===key} onClick={()=>{setDesktopTab(key);setDesktopSelected(null)}} className={cn("border-b-2 px-2 py-3 text-sm font-medium", ['completed','archived'].includes(key)&&"hidden md:block",desktopTab===key?"border-primary text-primary":"border-transparent text-muted-foreground")}><span className="md:hidden">{key==='transfer'?'Debt':label}</span><span className="hidden md:inline">{label}</span></button>)}</nav><select aria-label="Other recurring sections" className="!hidden max-w-[82px] h-9 rounded-md border border-border bg-background text-xs" value={['completed','archived'].includes(desktopTab)?desktopTab:''} onChange={e=>{if(e.target.value){setDesktopTab(e.target.value);setDesktopSelected(null)}}}><option value="" disabled>More</option><option value="completed">Completed debts</option><option value="archived">Archived</option></select>{['income','expense','transfer'].includes(desktopTab)&&<Button size="sm" variant="outline" className="cero-add-action cero-desktop-only-action" aria-label="Add rule" onClick={()=>openNew(desktopTab)}><Plus className="size-4"/><span>Add</span></Button>}</div>
<div className="grid grid-cols-1 workspace:grid-cols-[minmax(0,1fr)_minmax(240px,30%)] pt-3"><div className="overflow-auto workspace:max-h-[65vh]"><table className="cero-adaptive-register cero-recurring-register w-full text-sm"><thead className="sticky top-0 bg-card text-muted-foreground"><tr><th className="p-3 font-medium text-left">Name</th><th className="p-3 font-medium text-left">Frequency</th><th className="p-3 font-medium text-left">Next due</th><th className="p-3 font-medium text-right">Amount</th></tr></thead><tbody>{rows.map(row=><Fragment key={row.id}><tr onClick={()=>setDesktopSelected(current=>current===row.id?null:row.id)} className={cn("border-b border-border/60 cursor-pointer hover:bg-muted/30",desktopSelected===row.id&&"bg-primary/10")}><td className="p-3"><button type="button" aria-expanded={desktopSelected===row.id} onClick={e=>{e.stopPropagation();setDesktopSelected(current=>current===row.id?null:row.id)}} className="flex items-center gap-2 text-left"><CategoryIcon icon={row.icon} color={row.color} size="sm"/>{row.name}</button></td><td className="p-3">{row.frequency||'—'}</td><td className="p-3">{row.next_due_date?formatRegisterDate(parseRegisterDate(row.next_due_date),'d MMM yyyy'):'—'}</td><td className="p-3 text-right tabular-nums"><span className="cero-amount-nowrap">{formatCurrency(row.amount)}<ChevronDown aria-hidden="true" className={cn("cero-register-chevron size-4 shrink-0 text-muted-foreground workspace:hidden",desktopSelected===row.id&&"rotate-180")}/></span></td></tr>{desktopSelected===row.id&&<tr className="cero-inline-detail-row cero-workplace-inline"><td colSpan={4}><div className="cero-detail-panel"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Recurring details</h3><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Edit" onClick={()=>openEdit(row)}><Pencil className="size-4"/></Button><Button variant="ghost" size="icon" aria-label="More actions" onClick={()=>handleAction(row)}><MoreHorizontal className="size-4"/></Button></div></div><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Account</span><span>{accounts.find(a=>a.id===row.account_id)?.name||'—'}</span></div>{debtDetails(row)}</div></td></tr>}</Fragment>)}</tbody></table>{!rows.length&&<p className="p-8 text-center text-sm text-muted-foreground">No items in this section</p>}</div><aside className={cn("cero-desktop-inspector cero-register-inspector border-t border-border px-3 py-3 space-y-4 workspace:border-l workspace:border-t-0 workspace:px-5",!selected&&"hidden workspace:block")}><div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{selected?.name||labels[desktopTab]}</h2>{selected&&<button type="button" className="text-xs text-primary workspace:hidden" onClick={()=>setDesktopSelected(null)}>Close details</button>}</div>{selected?<>{[['Frequency',selected.frequency],['Next due',selected.next_due_date?formatRegisterDate(parseRegisterDate(selected.next_due_date),'d MMM yyyy'):'—'],['Amount',formatCurrency(selected.amount)],['Account',accounts.find(a=>a.id===selected.account_id)?.name]].map(([label,value])=><div key={label} className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span>{value||'—'}</span></div>)}{debtDetails(selected)}<div className="flex gap-2 border-t border-border pt-4"><Button variant="outline" size="sm" onClick={()=>openEdit(selected)}><Pencil className="mr-1 size-4"/>Edit</Button><Button variant="ghost" size="sm" onClick={()=>handleAction(selected)}>More</Button></div></>:<p className="text-sm text-muted-foreground">Select an item to view its details.</p>}</aside></div></div>}
      <RecurringRuleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSave}
        editingRule={editingRule}
        initialType={initialType}
        accounts={accounts}
        categories={categories}
        allTransactions={allTransactions}
        formatCurrency={formatCurrency}
        saving={saving}
        saveError={recurringSaveError}
      />

      <RecurringActionSheet
        rule={selectedRule}
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onEdit={openEdit}
        onArchive={handleArchive}
        onDelete={setDeleteTarget}
      />
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{deleteTarget?.type === 'transfer' ? 'Delete debt?' : 'Delete recurring rule?'}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{deleteTarget?.type === 'transfer' && (Number(deleteTarget.total_amount || 0) - Number(recurringPaidByRule[deleteTarget.id] || 0) > 0.005 || allTransactions.some((tx) => tx.recurring_transaction_id === deleteTarget.id)) ? 'This debt has an outstanding balance or payment history. It cannot be deleted. Archive it instead.' : 'Delete this recurring rule? Existing posted transactions will remain in your history. This cannot be undone.'}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            {deleteTarget?.type === 'transfer' && (Number(deleteTarget.total_amount || 0) - Number(recurringPaidByRule[deleteTarget.id] || 0) > 0.005 || allTransactions.some((tx) => tx.recurring_transaction_id === deleteTarget.id)) ? <Button onClick={() => { handleArchive(deleteTarget); setDeleteTarget(null); }}>Archive Debt</Button> : <Button variant="destructive" onClick={() => { const rule = deleteTarget; setDeleteTarget(null); handleDelete(rule); }}>Delete</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
