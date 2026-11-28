import { format as formatRegisterDate, parseISO as parseRegisterDate } from 'date-fns';
import MobileHeaderActions from '@/components/layout/MobileHeaderActions';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Pencil, Plus, ChevronDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select } from '@/components/ui/select';
import { savingsGoalsApi } from '@/lib/budgetData';
import { getGoalRemaining, sortGoalsByPriority } from '@/lib/goals';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { useAccounts, useAllTransactions } from '@/hooks/useBudgetData';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { sumPostedGoalTransactionsByGoal, getGoalCompletionDates } from './goalPanelHelpers';

import GoalDialog from './GoalDialog';
import { GoalActionSheet, GoalSection } from './GoalSections';

export default function ManageGoalsPanel({embedded=false,request=null}) {
  const [desktopTab,setDesktopTab] = useState('active');
  const [desktopSelected,setDesktopSelected] = useState(null);
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['manage-savings-goals', userId],
    queryFn: () => savingsGoalsApi.list(),
    enabled: Boolean(userId),
  });

  const postedGoalTotals = useMemo(
    () => sumPostedGoalTransactionsByGoal(allTransactions),
    [allTransactions]
  );

  const goalCompletionDates = useMemo(
    () => getGoalCompletionDates(savingsGoals, allTransactions),
    [allTransactions, savingsGoals]
  );


  const normalizedGoals = useMemo(
    () => savingsGoals.map((goal) => {
      const postedTotal = Number(postedGoalTotals[goal.id] || 0);
      const startingAmount = Math.max(
        0,
        Number(goal.starting_amount ?? (Number(goal.current_amount || 0) - postedTotal))
      );

      return {
        ...goal,
        starting_amount: startingAmount,
        posted_occurrence_count: allTransactions.filter((tx) => tx.savings_goal_id === goal.id && Number(tx.amount) > 0).length,
      };
    }),
    [postedGoalTotals, savingsGoals, allTransactions]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [goalSaveError, setGoalSaveError] = useState('');
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const groupedGoals = useMemo(() => {
    const sortedGoals = sortGoalsByPriority(normalizedGoals);

    return {
      active: sortedGoals.filter((goal) => !goal.is_archived && getGoalRemaining(goal) > 0),
      completed: sortedGoals.filter((goal) => !goal.is_archived && getGoalRemaining(goal) <= 0),
      archived: sortedGoals.filter((goal) => goal.is_archived),
    };
  }, [normalizedGoals]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['manage-savings-goals', userId] });
    queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    queryClient.invalidateQueries({ queryKey: ['allocations'] });
    queryClient.invalidateQueries({ queryKey: ['all-allocations'] });
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    queryClient.invalidateQueries({ queryKey: ['plan-data'] });
  };

  const openNew = () => {
    setGoalSaveError('');
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const handledRequest = useRef(null);
  useEffect(()=>{if(!request||handledRequest.current===request)return;if(!request.row){handledRequest.current=request;openNew();}else {const goal=normalizedGoals.find(item=>item.id===request.row.id);if(goal){handledRequest.current=request;setEditingGoal(goal);setDialogOpen(true);}}},[request,normalizedGoals]);
  const handleSave = async (payload) => {
    setGoalSaveError('');
    setSaving(true);

    try {
      if (editingGoal?.id) {
        const postedTotal = Number(postedGoalTotals[editingGoal.id] || 0);
        const goalPayload = {
          ...payload,
          current_amount: Math.min(
            Number(payload.target_amount),
            Number(payload.starting_amount || 0) + postedTotal
          ),
        };

        await savingsGoalsApi.update(editingGoal.id, goalPayload);
        toast.success('Savings goal updated');
      } else {
        const goalPayload = {
          ...payload,
          current_amount: Number(payload.starting_amount || 0),
        };

        await savingsGoalsApi.create(goalPayload);
        toast.success('Savings goal created');
      }

      refresh();
      setDialogOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Savings goal save failed:', error);
      const details = [error?.message, error?.details, error?.hint].filter(Boolean).join(' · ');
      setGoalSaveError(details || 'Could not save savings goal');
      toast.error(details || 'Could not save savings goal');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (goal) => {
    try {
      await savingsGoalsApi.update(goal.id, {
        is_archived: !goal.is_archived,
        archived_at: goal.is_archived ? null : new Date().toISOString(),
      });
      refresh();
      toast.success(goal.is_archived ? 'Savings goal restored' : 'Savings goal archived');
    } catch (error) {
      console.error('Savings goal archive failed:', error);
      toast.error(error.message || 'Could not update savings goal');
    }
  };

  const handleDelete = async (goal) => {
    try {
      await savingsGoalsApi.delete(goal.id);
      refresh();
      setDeleteTarget(null);
      toast.success('Savings goal deleted');
    } catch (error) {
      console.error('Savings goal delete failed:', error);
      toast.error(error.message || 'Could not delete savings goal');
    }
  };

  const groups = groupedGoals;
  const labels = {active:'Active goals',completed:'Completed goals',archived:'Archived'};
  const rows = groups[desktopTab];
  const selected = rows.find(row=>row.id===desktopSelected);
  return (
    <div className="space-y-3 lg:space-y-5">
      {!embedded&&<div><MobileHeaderActions onAdd={desktopTab==='active'?()=>openNew():undefined} addLabel="Add goal"/>
<div className="cero-tab-toolbar"><nav className="cero-workplace-tabs flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border workspace:gap-5" aria-label="Goal status">{Object.entries(labels).map(([key,label])=><button key={key} type="button" aria-pressed={desktopTab===key} onClick={()=>{setDesktopTab(key);setDesktopSelected(null)}} className={cn("border-b-2 px-2 py-3 text-sm font-medium",desktopTab===key?"border-primary text-primary":"border-transparent text-muted-foreground")}>{label}</button>)}</nav>{desktopTab==='active'&&<Button size="sm" variant="outline" className="cero-add-action cero-desktop-only-action" aria-label="Add goal" onClick={()=>openNew()}><Plus className="size-4"/><span>Add</span></Button>}</div>
<div className="grid grid-cols-1 workspace:grid-cols-[minmax(0,1fr)_minmax(240px,30%)] pt-3"><div className="overflow-auto workspace:max-h-[65vh]"><table className="cero-adaptive-register cero-goal-register w-full text-sm"><thead className="sticky top-0 bg-card text-muted-foreground"><tr><th className="p-3 font-medium text-left">Goal</th><th className="p-3 font-medium text-right">Target</th><th className="p-3 font-medium text-right">Saved</th><th className="p-3 font-medium text-right">Remaining</th></tr></thead><tbody>{rows.map(row=><Fragment key={row.id}><tr onClick={()=>setDesktopSelected(current=>current===row.id?null:row.id)} className={cn("border-b border-border/60 cursor-pointer hover:bg-muted/30",desktopSelected===row.id&&"bg-primary/10")}><td className="p-3"><button type="button" aria-expanded={desktopSelected===row.id} onClick={e=>{e.stopPropagation();setDesktopSelected(current=>current===row.id?null:row.id)}} className="flex items-center gap-2 text-left"><CategoryIcon icon={row.icon} color={row.color} size="sm"/>{row.name}<ChevronDown className={cn("size-4 ml-auto workspace:hidden",desktopSelected===row.id&&"rotate-180")}/></button></td><td className="p-3 text-right tabular-nums">{formatCurrency(row.target_amount)}</td><td className="p-3 text-right tabular-nums">{formatCurrency(row.current_amount)}</td><td className="p-3 text-right tabular-nums">{formatCurrency(getGoalRemaining(row))}</td></tr>{desktopSelected===row.id&&<tr className="cero-inline-detail-row cero-workplace-inline"><td colSpan={4}><div className="cero-detail-panel"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Goal details</h3><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Edit" onClick={()=>(setEditingGoal(row),setDialogOpen(true))}><Pencil className="size-4"/></Button><Button variant="ghost" size="icon" aria-label="More actions" onClick={()=>setActionTarget(row)}><MoreHorizontal className="size-4"/></Button></div></div><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Target date</span><span>{row.target_date?formatRegisterDate(parseRegisterDate(row.target_date),'d MMM yyyy'):'—'}</span></div></div></td></tr>}</Fragment>)}</tbody></table>{!rows.length&&<p className="p-8 text-center text-sm text-muted-foreground">No items in this section</p>}</div><aside className={cn("cero-desktop-inspector cero-register-inspector border-t border-border px-3 py-3 space-y-4 workspace:border-l workspace:border-t-0 workspace:px-5",!selected&&"hidden workspace:block")}><div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{selected?.name||labels[desktopTab]}</h2>{selected&&<button type="button" className="text-xs text-primary workspace:hidden" onClick={()=>setDesktopSelected(null)}>Close details</button>}</div>{selected?<>{[['Target',formatCurrency(selected.target_amount)],['Saved',formatCurrency(selected.current_amount)],['Remaining',formatCurrency(getGoalRemaining(selected))],['Target date',selected.target_date?formatRegisterDate(parseRegisterDate(selected.target_date),'d MMM yyyy'):'—']].map(([label,value])=><div key={label} className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span>{value||'—'}</span></div>)}<div className="flex gap-2 border-t border-border pt-4"><Button variant="outline" size="sm" onClick={()=>(setEditingGoal(selected),setDialogOpen(true))}><Pencil className="mr-1 size-4"/>Edit</Button><Button variant="ghost" size="sm" onClick={()=>setActionTarget(selected)}>More</Button></div></>:<p className="text-sm text-muted-foreground">Select an item to view its details.</p>}</aside></div></div>}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        onSave={handleSave}
        saveError={goalSaveError}
        saving={saving}
        accounts={accounts}
      />

      <GoalActionSheet
        goal={actionTarget}
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onEdit={(goal) => {
          setEditingGoal(goal);
          setDialogOpen(true);
        }}
        onArchive={handleArchive}
        onDelete={setDeleteTarget}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete savings goal?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (Number(deleteTarget.current_amount || 0) > Number(deleteTarget.starting_amount || 0) + 0.005 || allTransactions.some((tx) => tx.savings_goal_id === deleteTarget.id))
                ? 'This goal has contributions and cannot be deleted. Archive it to preserve its history.'
                : 'Delete this empty savings goal? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteTarget && (Number(deleteTarget.current_amount || 0) > Number(deleteTarget.starting_amount || 0) + 0.005 || allTransactions.some((tx) => tx.savings_goal_id === deleteTarget.id))
              ? <AlertDialogAction onClick={() => { handleArchive(deleteTarget); setDeleteTarget(null); }}>Archive Goal</AlertDialogAction>
              : <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(deleteTarget)}>Delete Goal</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
