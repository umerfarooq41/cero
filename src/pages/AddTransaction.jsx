import QuickDates from '@/components/shared/QuickDates';
import { usePayees } from '@/components/transactions/PayeeManager';
import { useAppSheetKeyboard } from '@/hooks/useAppSheetKeyboard';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import CategoryEditorModal from '@/components/categories/CategoryEditorModal';
import CompactChoiceChip from '@/components/shared/CompactChoiceChip';
import { categoriesApi } from '@/lib/budgetData';
import {
  ArrowDownLeft,
  X,
  ArrowLeftRight,
  ArrowUpRight,
  AlertTriangle,
  Trash2, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Wallet, LayoutGrid, Plus, Delete,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAccounts,
  useAllTransactions,
  useCategories,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/lib/supabase';
import { invalidateScheduledQueries } from '@/lib/queryInvalidation';
import { getCurrencyCode, getCurrencySymbol } from '@/lib/currencies';

const typeOptions = [
  {
    value: 'expense',
    label: 'Expense',
    icon: ArrowUpRight,
    tone: 'red',
  },
  {
    value: 'income',
    label: 'Income',
    icon: ArrowDownLeft,
    tone: 'emerald',
  },
  {
    value: 'transfer',
    label: 'Transfer',
    icon: ArrowLeftRight,
    tone: 'transfer',
  },
];

const TRANSFER_PURPOSES = {
  normal: 'normal',
  savingsAllocation: 'savings_allocation',
  debtPayment: 'debt_payment',
};

function CurrencyPrefix({ currency }) {
  const currencyCode = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currencyCode);

  if (currencyCode === 'SAR') {
    return (
      <span
        aria-label="SAR"
        className="inline-block h-[1em] w-[1em] shrink-0 bg-current opacity-90 align-[-0.08em]"
        style={{
          WebkitMask: 'url(/sar.svg) center / contain no-repeat',
          mask: 'url(/sar.svg) center / contain no-repeat',
        }}
      />
    );
  }

  return (
    <span className="text-[1em] font-bold leading-none text-current">
      {symbol}
    </span>
  );
}

function TransactionTypeSelector({ value, onChange }) {
  return <nav aria-label="Transaction type" className="flex border-b border-border">{typeOptions.map(({value:key,label,icon:Icon})=><button key={key} type="button" aria-pressed={value===key} onClick={()=>onChange(key)} className={'flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors '+(value===key?'border-primary text-primary':'border-transparent text-muted-foreground')}><Icon className="size-4"/>{label}</button>)}</nav>;
}

function normalizeCategoryType(type) {
  if (type === 'saving') return 'savings';
  if (type === 'liability') return 'debt';
  return String(type || '').toLowerCase();
}

function isSavingsAccount(account) {
  return normalizeCategoryType(account?.type) === 'savings';
}

function isDebtAccount(account) {
  const accountType = normalizeCategoryType(account?.type);
  const accountCategory = normalizeCategoryType(account?.category);

  return (
    accountCategory === 'debt' ||
    accountCategory === 'liability' ||
    accountType === 'debt' ||
    accountType === 'loan' ||
    accountType === 'credit_card'
  );
}

function getTransferPurposeFromCategory(category) {
  const categoryType = normalizeCategoryType(category?.type);

  if (categoryType === 'savings') return TRANSFER_PURPOSES.savingsAllocation;
  if (categoryType === 'debt') return TRANSFER_PURPOSES.debtPayment;

  return TRANSFER_PURPOSES.normal;
}

function ExpandField({label, value, icon: Icon, open, onToggle, children}) {
  return <section className="border-b border-border/60">
    <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
      <Icon className="size-5 shrink-0 text-muted-foreground"/><span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{label}</span><span className="block break-words text-sm font-medium">{value||'Choose '+label.toLowerCase()}</span></span><ChevronDown className={'size-4 shrink-0 text-muted-foreground transition-transform '+(open?'rotate-180':'')}/>
    </button>
    {open&&<div className="cero-entry-expand space-y-2 pb-3">{children}</div>}
  </section>;
}
function ChipOptions({items,value,onChoose,onAdd,searchable=true}) {
  const [query,setQuery]=useState('');
  const [all,setAll]=useState(false);
  const matched=items.filter(item=>item.name.toLowerCase().includes(query.toLowerCase()));
  return <>{searchable&&items.length>8&&<Input aria-label="Search choices" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} className="h-9"/>}
    <div className="flex flex-wrap gap-1.5">{(all||query?matched:matched.slice(0,8)).map(item=><CompactChoiceChip key={item.id} selected={value===item.id} item={{...item,icon:item.icon||'wallet'}} onClick={()=>onChoose(item.id)}>{item.name}</CompactChoiceChip>)}{onAdd&&<CompactChoiceChip action onClick={onAdd}>New category</CompactChoiceChip>}</div>
    {!query&&matched.length>8&&<button type="button" className="text-sm text-primary" onClick={()=>setAll(v=>!v)}>{all?'Show less':'View all ('+matched.length+')'}</button>}
    {!matched.length&&<p className="text-xs text-muted-foreground">No matching items.</p>}
  </>;
}
export default function AddTransaction() {
  useAppSheetKeyboard();
  const navigate = useNavigate();
  const location=useLocation();
  const returnTo=typeof location.state?.returnTo==='string'&&/^\/settings\/payees\/[a-f0-9-]+$/i.test(location.state.returnTo)?location.state.returnTo:'/transactions';
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const { data: categories = [], isPending: categoriesPending } = useCategories();
  const { data: accounts = [], isPending: accountsPending } = useAccounts(true);
  const { data: allTransactions = [], isPending: transactionsPending, isError: transactionsError, refetch: refetchTransactions } = useAllTransactions();

  const existingTransaction = allTransactions.find((transaction) => transaction.id === id);
  const currency = useCurrency();
  const isRecurringDateCorrection = isEditing && (Boolean(existingTransaction?.recurring_transaction_id) || Boolean(existingTransaction?.savings_goal_id));
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [linkedFixed, setLinkedFixed] = useState(true);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferPurpose, setTransferPurpose] = useState(TRANSFER_PURPOSES.normal);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [payee,setPayee]=useState('');
  const [payeeReady,setPayeeReady]=useState(false);
  const [payeeQuery,setPayeeQuery]=useState('');
  const [addingPayee,setAddingPayee]=useState(false);
  useEffect(()=>{let active=true;supabase.from('transactions').select('payee_name').limit(1).then(({error})=>{if(active)setPayeeReady(!error)});return()=>{active=false};},[]);
  const {data: registry}=usePayees();
  const historyPayees=useMemo(()=>{const seen=new Set();return [...allTransactions].sort((a,b)=>String(b.date).localeCompare(String(a.date))).filter(t=>t.type===type&&t.payee_name).map(t=>t.payee_name.trim()).filter(n=>{const k=n.toLowerCase();if(!n||seen.has(k))return false;seen.add(k);return true;});},[allTransactions,type]);
  const recentPayees=registry ? registry.filter(p=>!p.is_archived).map(p=>p.name) : historyPayees;
  const pickPayee=n=>{choose(setPayee,n);const p=registry?.find(p=>p.name===n);if(!categoryId&&p?.default_category_id&&filteredCategories.some(c=>c.id===p.default_category_id))setCategoryId(p.default_category_id);};
  const [saving, setSaving] = useState(false);
  const [linkedSaveError, setLinkedSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expanded,setExpanded]=useState('');
  const [keypad,setKeypad]=useState(()=>!isEditing && window.matchMedia('(max-width:1023px)').matches);
  const [newCategory,setNewCategory]=useState(false);
  const [operation,setOperation]=useState(null);
  const [fresh,setFresh]=useState(true);
  const calculate=()=>{const n=Number(amount||0);if(!operation)return n;return operation.op==='+'?operation.base+n:operation.op==='−'?operation.base-n:operation.op==='×'?operation.base*n:n===0?NaN:operation.base/n;};
  const finishCalc=()=>{if(!operation)return true;const result=calculate();if(!Number.isFinite(result)||result<0||result>999999999){toast.error('Enter a valid calculation');return false;}setAmount(String(Math.round(result*100)/100));setOperation(null);setFresh(true);return true;};
  const keyPress=key=>{if(key==='='){finishCalc();return;}if(['+','−','×','÷'].includes(key)){const base=calculate();if(!Number.isFinite(base)||base<0){toast.error('Invalid calculation');return;}setOperation({base,op:key});setFresh(true);return;}const old=amount||'0';const next=key==='back'?(old.slice(0,-1)||'0'):key==='.'?(fresh?'0.':old.includes('.')?old:old+'.'):fresh||old==='0'?key:old+key;if(/^\d{0,9}(\.\d{0,2})?$/.test(next)){setAmount(next);setFresh(false);}};
  const toggleField=field=>{if(!finishCalc())return;setKeypad(false);setExpanded(old=>old===field?'':field);};
  const choose=(setter,value)=>{setter(value);setExpanded('');};

  const destinationAccount = useMemo(
    () => accounts.find((account) => account.id === toAccountId),
    [accounts, toAccountId]
  );

  const transferPurposeOptions = useMemo(() => {
    const options = [
      {
        value: TRANSFER_PURPOSES.normal,
        label: 'Normal transfer',
        description: 'Move money only. Does not affect the monthly plan.',
      },
    ];

    if (isSavingsAccount(destinationAccount)) {
      options.push({
        value: TRANSFER_PURPOSES.savingsAllocation,
        label: 'Savings allocation',
        description: 'Track this transfer against a savings category.',
      });
    }

    if (isDebtAccount(destinationAccount)) {
      options.push({
        value: TRANSFER_PURPOSES.debtPayment,
        label: 'Debt payment',
        description: 'Track this transfer against a debt category.',
      });
    }

    return options;
  }, [destinationAccount]);

  const requiresCategory =
    type !== 'transfer' ||
    transferPurpose === TRANSFER_PURPOSES.savingsAllocation ||
    transferPurpose === TRANSFER_PURPOSES.debtPayment;

  const initializedEdit = useRef(null);
  const [readyEditId,setReadyEditId]=useState(null);
  useEffect(() => {
    if (!existingTransaction || categoriesPending || accountsPending || initializedEdit.current===id) return;
    initializedEdit.current=id;

    const existingCategory = categories.find(
      (category) => category.id === existingTransaction.category_id
    );

    setAmount(String(existingTransaction.amount ?? ''));
    setType(existingTransaction.type || 'expense');
    setCategoryId(existingTransaction.category_id || '');
    setAccountId(existingTransaction.account_id || '');
    setToAccountId(existingTransaction.to_account_id || '');
    setTransferPurpose(
      existingTransaction.type === 'transfer'
        ? getTransferPurposeFromCategory(existingCategory)
        : TRANSFER_PURPOSES.normal
    );
    setDate(existingTransaction.date || format(new Date(), 'yyyy-MM-dd'));
    setOccurrenceDate(existingTransaction.recurring_posted_for_date || existingTransaction.date || format(new Date(), 'yyyy-MM-dd'));
    setNote(existingTransaction.note || '');
    setPayee(existingTransaction.payee_name || '');
    setReadyEditId(id);
  }, [existingTransaction, categories, categoriesPending, accountsPending, id]);

  useEffect(() => {
    if (!isRecurringDateCorrection || !existingTransaction) return;
    let active = true;
    const load = async () => {
      if (existingTransaction.recurring_transaction_id) {
        const { data } = await supabase.from('recurring_transactions')
          .select('payment_mode,type').eq('id', existingTransaction.recurring_transaction_id).maybeSingle();
        if (active) setLinkedFixed(data?.type === 'transfer' && (data?.payment_mode || 'fixed') === 'fixed');
      } else if (existingTransaction.savings_goal_id) {
        const { data } = await supabase.from('savings_goals')
          .select('contribution_mode').eq('id', existingTransaction.savings_goal_id).maybeSingle();
        if (active) setLinkedFixed((data?.contribution_mode || 'flexible') === 'fixed');
      }
    };
    load();
    return () => { active = false; };
  }, [isRecurringDateCorrection, existingTransaction?.recurring_transaction_id, existingTransaction?.savings_goal_id]);

  useEffect(() => {
    if (type !== 'transfer' || (isEditing && readyEditId!==id)) return;

    const currentPurposeAllowed = transferPurposeOptions.some(
      (option) => option.value === transferPurpose
    );

    if (!currentPurposeAllowed) {
      setTransferPurpose(TRANSFER_PURPOSES.normal);
      setCategoryId('');
    }
  }, [transferPurpose, transferPurposeOptions, type, isEditing, readyEditId, id]);

  const filteredCategories = categories.filter((category) => {
    const categoryType = normalizeCategoryType(category.type);

    if (type === 'expense') {
      return categoryType === 'expense';
    }

    if (type === 'income') {
      return categoryType === 'income';
    }

    if (type === 'transfer') {
      if (transferPurpose === TRANSFER_PURPOSES.savingsAllocation) {
        return categoryType === 'savings';
      }

      if (transferPurpose === TRANSFER_PURPOSES.debtPayment) {
        return categoryType === 'debt';
      }
    }

    return false;
  });

  const submissionLock = useRef(false);
  const deletionLock = useRef(false);
  const handleSubmit = async () => {
    if (submissionLock.current || saving || deleting) return;
    if (navigator.onLine === false) { toast.error('Reconnect to save your transaction'); return; }
    submissionLock.current = true;
    try {
      await submitTransaction();
    } finally {
      submissionLock.current = false;
    }
  };

  const submitTransaction = async () => {
    if (isRecurringDateCorrection) {
      if (!date || !occurrenceDate || !(Number(amount) > 0)) { toast.error('Enter a valid amount and both dates'); return; }
      setLinkedSaveError('');
      setSaving(true);
      try {
        const { error } = await supabase.rpc('cero_edit_linked_payment', {
          p_transaction_id: id,
          p_actual_date: date,
          p_occurrence_date: occurrenceDate,
          p_amount: Number(amount),
          p_note: note || null,
        });
        if (error) throw error;
        invalidateScheduledQueries(queryClient);
        toast.success('Payment schedule corrected');
        navigate(returnTo);
      } catch (error) {
        console.error('Linked payment save failed:', error);
        const message = error?.message || 'Could not save the payment';
        setLinkedSaveError(message);
        toast.error(message);
      } finally {
        setSaving(false);
      }
      return;
    }
    const parsedAmount = Number(amount || 0);

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!accountId) {
      toast.error(type === 'transfer' ? 'Select a source account' : 'Select an account');
      return;
    }

    if (type === 'transfer' && !toAccountId) {
      toast.error('Select a destination account');
      return;
    }

    if (type === 'transfer' && accountId === toAccountId) {
      toast.error('Choose two different accounts for a transfer');
      return;
    }

    if (requiresCategory && !categoryId) {
      if (type === 'transfer' && transferPurpose === TRANSFER_PURPOSES.savingsAllocation) {
        toast.error('Select a savings category');
        return;
      }

      if (type === 'transfer' && transferPurpose === TRANSFER_PURPOSES.debtPayment) {
        toast.error('Select a debt category');
        return;
      }

      toast.error('Select a category');
      return;
    }

    setSaving(true);

    try {
      if (isEditing && !existingTransaction) {
        toast.error('Transaction not found');
        return;
      }

      const data = {
        amount: parsedAmount,
        type,
        date,
        note: note || null,
        category_id: requiresCategory ? categoryId || null : null,
        account_id: accountId || null,
        to_account_id: type === 'transfer' ? toAccountId || null : null,
      };

      const rpcName = isEditing
        ? 'cero_update_transaction'
        : 'cero_create_transaction';

      const rpcPayload = {
        p_amount: data.amount,
        p_type: data.type,
        p_date: data.date,
        p_account_id: data.account_id,
        p_to_account_id: data.to_account_id,
        p_category_id: data.category_id,
        p_note: data.note,
      };

      if (isEditing) {
        rpcPayload.p_transaction_id = id;
      }

      const usePayeeRpc = payeeReady;
      const { error } = await supabase.rpc(usePayeeRpc ? rpcName + '_with_payee' : rpcName, usePayeeRpc ? {...rpcPayload,p_payee_name:type==='transfer'?null:payee.trim()||null} : rpcPayload);
      if (error) throw error;

      invalidateScheduledQueries(queryClient);
      await queryClient.invalidateQueries({queryKey:['payees']});

      toast.success(isEditing ? 'Transaction updated' : 'Transaction added');
      navigate(returnTo);
    } catch (error) {
      console.error('Transaction save failed:', error);
      toast.error(error.message || 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deletionLock.current || submissionLock.current) return;
    if (navigator.onLine === false) { toast.error("Connect to the internet before deleting transactions"); return; }
    if (!isEditing || !existingTransaction) {
      toast.error('Transaction not found');
      setDeleteOpen(false);
      return;
    }

    deletionLock.current = true;
    setDeleting(true);

    try {
      const { error } = await supabase.rpc('cero_delete_transaction', {
        p_transaction_id: existingTransaction.id,
      });

      if (error) throw error;

      invalidateScheduledQueries(queryClient);

      toast.success('Transaction deleted');
      setDeleteOpen(false);
      navigate(returnTo);
    } catch (error) {
      console.error('Transaction delete failed:', error);
      toast.error(error.message || 'Could not delete transaction');
    } finally {
      deletionLock.current = false;
      setDeleting(false);
    }
  };

  if(isEditing&&(transactionsPending||categoriesPending||accountsPending||!existingTransaction||readyEditId!==id))return createPortal(<><div className="app-route-sheet-backdrop"/><div className="app-route-sheet app-sheet-surface app-desktop-route-form cero-route-editor"><header className="flex items-center justify-between p-4"><h1 className="text-base font-semibold">Edit transaction</h1><button type="button" aria-label="Close" onClick={()=>navigate(returnTo)}><X className="size-5"/></button></header><div className="space-y-3 p-5 text-sm text-muted-foreground" role="status">{transactionsError?'Could not load transaction.':!transactionsPending&&!existingTransaction?'Transaction not found.':'Loading transaction…'}{transactionsError&&<Button onClick={()=>refetchTransactions()}>Retry</Button>}</div></div></>,document.body);
  return createPortal(
    <>
      <div className="app-route-sheet-backdrop" aria-hidden="true" />
    <div className={"app-route-sheet app-sheet-surface app-desktop-route-form cero-route-editor "+(!isRecurringDateCorrection?"cero-manual-entry":"")}>
      <header className="app-sheet-header shrink-0 px-5 pb-2 pt-2">
        <div className={"mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/35 lg:hidden "+(!isRecurringDateCorrection?"hidden":"")} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">{isEditing ? 'Edit transaction' : 'Add transaction'}</h1>
          <button type="button" onClick={() => navigate(returnTo)} aria-label="Close" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"><X className="size-5" /></button>
        </div>
      </header>

      {isRecurringDateCorrection ? (
        <>
        <main className="app-route-sheet-body mx-auto w-full max-w-3xl px-4 py-4">
          <div className="space-y-4 rounded-2xl app-card-surface p-4 sm:p-5 lg:!rounded-none">
            <p className="text-sm text-muted-foreground">Correct the payment amount, actual date, and scheduled installment. Changes to amounts automatically adjust balances.</p>
            <div className="space-y-1.5">
              <label htmlFor="linked-payment-amount" className="text-sm font-medium">Payment amount</label>
              <Input id="linked-payment-amount" type="number" min="0.01" step="0.01" value={amount} disabled={linkedFixed} onChange={(event) => setAmount(event.target.value)} />
              {linkedFixed && <p className="text-xs text-muted-foreground">Fixed installment amount cannot be changed.</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="recurring-payment-date" className="text-sm font-medium">Actual payment date</label>
              <Input id="recurring-payment-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="scheduled-occurrence-date" className="text-sm font-medium">Scheduled installment date</label>
              <Input id="scheduled-occurrence-date" type="date" value={occurrenceDate} onChange={(event) => setOccurrenceDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="linked-payment-note" className="text-sm font-medium">Note</label>
              <Textarea id="linked-payment-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            {linkedSaveError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{linkedSaveError}</div>}
          </div>
        </main>
        <div className="app-route-sheet-footer">
          <Button type="button" variant="outline" className="hidden lg:inline-flex" onClick={() => navigate(returnTo)} disabled={saving}>Cancel</Button>
            <Button type="button" className="w-full" disabled={saving || deleting || !date || !occurrenceDate || !(Number(amount) > 0)} onClick={handleSubmit}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(true)}
              disabled={saving || deleting || !existingTransaction}
              className="h-12 w-full text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Transaction
            </Button>
        </div>
        </>
      ) : (
      <>
      <main className="app-route-sheet-body mx-auto w-full max-w-3xl px-4 py-3">
        <TransactionTypeSelector value={type} onChange={nextType=>{if(nextType===type)return;setType(nextType);setPayee('');setPayeeQuery('');setAddingPayee(false);setCategoryId('');setToAccountId('');setTransferPurpose(TRANSFER_PURPOSES.normal);setExpanded('');}}/>
        <div className="py-5 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Amount</p>
          <button type="button" className="cero-entry-mobile mx-auto items-center justify-center gap-2 text-4xl font-semibold tabular-nums" onClick={()=>{setExpanded('');setKeypad(true);setFresh(true);}}><CurrencyPrefix currency={currency}/>{amount||'0.00'}</button>
          <div className="cero-entry-desktop mx-auto max-w-xs items-center gap-2 text-3xl font-semibold"><CurrencyPrefix currency={currency}/><input aria-label="Amount" className="cero-hero-amount-input w-full min-w-0 bg-transparent text-center outline-none" type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div>
          {operation&&<p className="mt-1 text-xs text-muted-foreground">{operation.base} {operation.op}</p>}
        </div>
        <div className="space-y-1">
          {type!=='transfer'&&payeeReady&&<ExpandField label="Payee (optional)" icon={Wallet} value={payee||'Choose payee'} open={expanded==='payee'} onToggle={()=>{toggleField('payee');setPayeeQuery('');setAddingPayee(false);}}><Input aria-label="Search payees" placeholder={addingPayee?'New payee name':'Search payees'} maxLength={120} value={payeeQuery} onChange={e=>setPayeeQuery(e.target.value)}/><div className="flex flex-wrap gap-1.5">{recentPayees.filter(n=>n.toLowerCase().includes(payeeQuery.toLowerCase())).slice(0,payeeQuery?30:8).map(n=><CompactChoiceChip key={n} selected={payee===n} onClick={()=>pickPayee(n)}>{n}</CompactChoiceChip>)}<CompactChoiceChip action onClick={()=>setAddingPayee(true)}>New payee</CompactChoiceChip>{payee&&<button type="button" className="min-h-8 px-2 text-xs text-muted-foreground" onClick={()=>choose(setPayee,'')}>Clear</button>}</div>{(addingPayee||payeeQuery.trim())&&<Button type="button" size="sm" disabled={!payeeQuery.trim()} onClick={()=>{const n=payeeQuery.trim();pickPayee(recentPayees.find(p=>p.toLowerCase()===n.toLowerCase())||n);}}>Use payee</Button>}</ExpandField>}
          {type!=='transfer'&&<ExpandField label="Category" icon={LayoutGrid} value={categories.find(c=>c.id===categoryId)?.name} open={expanded==='category'} onToggle={()=>toggleField('category')}><ChipOptions items={filteredCategories.filter(c=>!c.is_archived||c.id===categoryId)} value={categoryId} onChoose={v=>choose(setCategoryId,v)} onAdd={()=>setNewCategory(true)}/></ExpandField>}
          <ExpandField label={type==='transfer'?'From account':type==='income'?'Deposit account':'Account'} icon={Wallet} value={accounts.find(a=>a.id===accountId)?.name} open={expanded==='account'} onToggle={()=>toggleField('account')}><ChipOptions items={accounts.filter(a=>(!a.is_archived||a.id===accountId)&&(type!=='transfer'||a.id!==toAccountId))} value={accountId} onChoose={v=>choose(setAccountId,v)}/></ExpandField>
          {type==='transfer'&&<>
            <ExpandField label="To account" icon={ArrowLeftRight} value={destinationAccount?.name} open={expanded==='destination'} onToggle={()=>toggleField('destination')}><ChipOptions items={accounts.filter(a=>a.id!==accountId&&(!a.is_archived||a.id===toAccountId))} value={toAccountId} onChoose={v=>{choose(setToAccountId,v);setTransferPurpose(TRANSFER_PURPOSES.normal);setCategoryId('');}}/></ExpandField>
            {toAccountId&&transferPurposeOptions.length>1&&<ExpandField label="Transfer purpose" icon={ArrowLeftRight} value={transferPurposeOptions.find(o=>o.value===transferPurpose)?.label} open={expanded==='purpose'} onToggle={()=>toggleField('purpose')}><div className="flex flex-wrap gap-1.5">{transferPurposeOptions.map(o=><CompactChoiceChip key={o.value} selected={transferPurpose===o.value} onClick={()=>{choose(setTransferPurpose,o.value);setCategoryId('');}}>{o.label}</CompactChoiceChip>)}</div></ExpandField>}
            {toAccountId&&<p className="py-2 text-xs text-muted-foreground">{transferPurposeOptions.find(o=>o.value===transferPurpose)?.description}</p>}
            {requiresCategory&&<ExpandField label={transferPurpose===TRANSFER_PURPOSES.savingsAllocation?'Savings category':'Debt category'} icon={LayoutGrid} value={categories.find(c=>c.id===categoryId)?.name} open={expanded==='category'} onToggle={()=>toggleField('category')}><ChipOptions items={filteredCategories.filter(c=>!c.is_archived||c.id===categoryId)} value={categoryId} onChoose={v=>choose(setCategoryId,v)} onAdd={()=>setNewCategory(true)}/></ExpandField>}
          </>}
          <ExpandField label="Date" icon={CalendarDays} value={date?format(parseISO(date),'d MMMM yyyy'):''} open={expanded==='date'} onToggle={()=>toggleField('date')}><QuickDates value={date} onChange={v=>choose(setDate,v)}/></ExpandField>
          <div className="pt-4"><label className="mb-2 block text-xs text-muted-foreground" htmlFor="manual-note">Note (optional)</label><Textarea id="manual-note" aria-label="Note" value={note} onFocus={()=>{if(finishCalc()){setKeypad(false);setExpanded('');}}} onChange={e=>setNote(e.target.value)} placeholder="Add a note" className="min-h-12 resize-none"/></div>
        </div>
      </main>
        <div className="app-route-sheet-footer">
          <Button type="button" variant="outline" className="hidden lg:inline-flex" onClick={() => navigate(returnTo)} disabled={saving}>Cancel</Button>
        <Button
          onClick={()=>{if(operation){if(finishCalc())toast.info("Calculation complete. Tap Save to confirm.");return;}handleSubmit();}}
          disabled={saving || deleting || !(Number(amount)>0) || !date || !accountId || (type==="transfer"&&(!toAccountId||toAccountId===accountId)) || (requiresCategory&&!categoryId)}
          className="h-11 w-full text-sm font-semibold"
        >
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
        </Button>

        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            disabled={saving || deleting || !existingTransaction}
            className="mt-3 h-12 w-full text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Transaction
          </Button>
        )}
        </div>
        {keypad&&<div className="cero-entry-keypad shrink-0 border-t border-border bg-muted/40 px-3 pt-2" aria-label="Calculator keypad">
          <div className="grid grid-cols-4 gap-1">{['7','8','9','×','4','5','6','÷','1','2','3','+','.','0','back','−'].map(k=><button type="button" key={k} aria-label={k==='back'?'Backspace':k} onClick={()=>keyPress(k)} className={'grid h-10 place-items-center rounded-md text-xl '+(['×','÷','+','−'].includes(k)?'bg-muted text-muted-foreground':'hover:bg-muted')}>{k==='back'?<Delete className="size-5"/>:k}</button>)}</div>
          <div className="mt-1 flex gap-2"><Button variant="ghost" onClick={()=>{setAmount('');setOperation(null);setFresh(true);}}>Clear</Button><Button variant="secondary" onClick={()=>keyPress('=')}>=</Button><Button className="flex-1" onClick={()=>{if(finishCalc())setKeypad(false);}}>Done</Button></div>
        </div>}
        <CategoryEditorModal open={newCategory} onClose={()=>setNewCategory(false)} initialType={type==='transfer'?(transferPurpose===TRANSFER_PURPOSES.savingsAllocation?'savings':'debt'):type} parentCategories={categories.filter(c=>!c.is_archived)} onSave={async data=>{try{const expected=type==='transfer'?(transferPurpose===TRANSFER_PURPOSES.savingsAllocation?'savings':'debt'):type;if(data.type!==expected){toast.error('Choose the matching category type');throw new Error('Category type mismatch');}const created=await categoriesApi.create(data);await queryClient.invalidateQueries({queryKey:['categories']});const id=created?.id||created?.[0]?.id||(typeof created==='string'?created:null);if(id)choose(setCategoryId,id);else setExpanded('category');toast.success('Category created');}catch(error){toast.error(error.message||'Could not create category');throw error;}}}/>
        <style>{`.cero-entry-mobile,.cero-entry-keypad{display:none}.cero-entry-desktop{display:flex}.cero-entry-expand{animation:ceroEntryIn .18s ease-out}@keyframes ceroEntryIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}@media(max-width:1023px){.app-route-sheet.app-sheet-surface.cero-manual-entry{inset:0!important;height:100dvh!important;max-height:100dvh!important;width:100%!important;max-width:none!important;border-radius:0!important;transform:none!important;display:flex!important;flex-direction:column;padding-top:env(safe-area-inset-top)}.cero-manual-entry .app-route-sheet-body{flex:1;min-height:0;overflow-y:auto!important}.cero-entry-mobile{display:flex}.cero-entry-desktop{display:none}.cero-entry-keypad{display:block;padding-bottom:max(8px,env(safe-area-inset-bottom))}.cero-manual-entry .app-route-sheet-footer{padding:8px 16px!important;flex-shrink:0}.cero-manual-entry:not(:has(.cero-entry-keypad)) .app-route-sheet-footer{padding-bottom:max(12px,env(safe-area-inset-bottom))!important}}@media(prefers-reduced-motion:reduce){.cero-entry-expand{animation:none}}`}</style>
      </>
      )}

      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deletionLock.current) setDeleteOpen(open); }}>
        <DialogContent style={{ zIndex: 100 }} className="overflow-hidden rounded-3xl border border-destructive/25 app-card-surface-strong p-0 shadow-[0_24px_80px_rgba(127,29,29,0.22)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <DialogHeader className="border-b border-destructive/20 px-6 py-5">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-destructive">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Delete Transaction
            </DialogTitle>

            <DialogDescription className="pt-2 text-sm leading-6">
              This will permanently delete the transaction and reverse its account balance effects.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6 py-5">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-muted-foreground">
              {isRecurringDateCorrection
                ? 'This also removes the linked recurring payment or goal contribution and updates its schedule or progress. Account balance effects will be reversed.'
                : 'The account balance effects of this transaction will be reversed.'}
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              onClick={handleDelete}
              disabled={deleting || !existingTransaction}
            >
              {deleting ? 'Deleting...' : 'Delete Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  , document.body);
}
