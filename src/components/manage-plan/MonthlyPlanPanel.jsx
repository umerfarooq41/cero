import { WorkspaceTab } from '@/components/shared/WorkspacePrimitives';
import MobileHeaderActions from '@/components/layout/MobileHeaderActions';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight, Copy, Save, LockKeyhole, Plus, Pencil, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import ManageCategoriesPanel from './ManageCategoriesPanel';
import ManageGoalsPanel from './ManageGoalsPanel';
import ManageRecurringPanel from './ManageRecurringPanel';
import CategoryIcon from '@/components/shared/CategoryIcon';
import MonthSelector from '@/components/shared/MonthSelector';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { budgetPlansApi } from '@/lib/budgetData';
import {
  useAllocations,
  useCategories,
  useRecurringTransactions,
  useSavingsGoals,
  useAllTransactions,
} from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import {
  attachGoalFundingProgress,
  getGoalPlannedAmountForMonth,
  isGoalPlannedForMonth,
} from '@/lib/goals';
import {
  buildPlanTotals,
  getTrackedForCategory,
  getTrackedForSource,
  calculateLeftToAllocateFromTotals,
  getAssignablePlannedDebt,
  getFundedDebtPaymentTotal,
} from '@/lib/planData';
import { cn } from '@/lib/utils';

import PlanAmountRow from './PlanAmountRow';
import { normalizeType, getCategoryType, getRuleCategoryId, isLeafCategory, isRuleActive, getRecurringPlanDescription, getGoalPlanDescription, getAllocationRowKey, getRecurringAmountForMonth, getGoalAmountForMonth, isProtectedPlanRow } from './monthlyPlanHelpers';

const EMPTY_ROWS = [];

const sectionConfig = {
  income: {
    title: 'Income',
    text: 'text-green-700 dark:text-green-400',
    badge:
      'bg-green-500/10 text-green-700 ring-green-500/15 dark:text-green-400',
  },
  expense: {
    title: 'Expenses',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-500/10 text-red-700 ring-red-500/15 dark:text-red-400',
  },
  savings: {
    title: 'Savings',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-500/10 text-blue-700 ring-blue-500/15 dark:text-blue-400',
  },
  debt: {
    title: 'Debt',
    text: 'text-purple-700 dark:text-purple-400',
    badge:
      'bg-purple-500/10 text-purple-700 ring-purple-500/15 dark:text-purple-400',
  },
};

export default function MonthlyPlanPanel({ currentMonth, onMonthChange, unified = false, draftRef, sharedSaving, onSavingChange, transactions = EMPTY_ROWS, goalContributions = EMPTY_ROWS }) {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();

  const categoriesQuery = useCategories();
  const allocationsQuery = useAllocations(currentMonth);
  const recurringQuery = useRecurringTransactions();
  const goalsQuery = useSavingsGoals();
  const transactionsQuery = useAllTransactions();
  const categories = categoriesQuery.data || EMPTY_ROWS;
  const allocations = allocationsQuery.data || EMPTY_ROWS;
  const recurringTransactions = recurringQuery.data || EMPTY_ROWS;
  const savingsGoals = goalsQuery.data || EMPTY_ROWS;
  const allTransactions = transactionsQuery.data || EMPTY_ROWS;

  const prevMonth = format(
    subMonths(new Date(`${currentMonth}-01T00:00:00`), 1),
    'yyyy-MM'
  );
  const prevAllocationsQuery = useAllocations(prevMonth);
  const prevAllocations = prevAllocationsQuery.data || EMPTY_ROWS;
  const isPlanLoading =
    categoriesQuery.isLoading ||
    allocationsQuery.isLoading ||
    recurringQuery.isLoading ||
    goalsQuery.isLoading ||
    transactionsQuery.isLoading ||
    prevAllocationsQuery.isLoading;

  const currentMonthTransactions = useMemo(() => {
    return allTransactions.filter((transaction) =>
      String(transaction?.date || '').startsWith(currentMonth)
    );
  }, [allTransactions, currentMonth]);

  const [values, setValues] = useState({});
  const localDraft = useRef({});
  const draft = draftRef || localDraft;
  const [activeType, setActiveType] = useState('expense');
  const [selectedKey, setSelectedKey] = useState(null);
  const [hideZero, setHideZero] = useState(false);
  const [editorRequest, setEditorRequest] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const saving = sharedSaving ?? localSaving;
  const setSaving = onSavingChange || setLocalSaving;
  const [collapsedSections, setCollapsedSections] = useState({});

  const leafCategoryIds = useMemo(() => {
    return new Set(
      categories
        .filter((category) => isLeafCategory(category, categories))
        .map((category) => category.id)
    );
  }, [categories]);

  const goalsWithFunding = useMemo(
    () => attachGoalFundingProgress(savingsGoals, allTransactions),
    [allTransactions, savingsGoals]
  );

  const allocationByRowKey = useMemo(() => {
    const result = {};

    allocations.forEach((allocation) => {
      const key = getAllocationRowKey(allocation);
      if (key) result[key] = allocation;
    });

    return result;
  }, [allocations]);

  const prevAllocationByRowKey = useMemo(() => {
    const result = {};

    prevAllocations.forEach((allocation) => {
      const key = getAllocationRowKey(allocation);
      if (key) result[key] = allocation;
    });

    return result;
  }, [prevAllocations]);

  const rowsByType = useMemo(() => {
    const result = {
      income: [],
      expense: [],
      savings: [],
      debt: [],
    };

    const standaloneRecurring = [];

    recurringTransactions
      .filter((rule) => {
        if (isRuleActive(rule)) return true;
        return Number(getRecurringAmountForMonth(rule, currentMonth, allTransactions) || 0) > 0;
      })
      .forEach((rule) => {
        const ruleCategoryId = getRuleCategoryId(rule);
        const category = categories.find((item) => item.id === ruleCategoryId);
        const ruleType =
          getCategoryType(category, categories) || normalizeType(rule.type);
        const scheduledAmount = getRecurringAmountForMonth(rule, currentMonth, allTransactions);
        const isGenerated = scheduledAmount !== null;
        const amount = isGenerated ? Number(scheduledAmount || 0) : Number(rule.amount || 0);

        standaloneRecurring.push({
          key: `recurring:${rule.id}`,
          id: rule.id,
          name: rule.name,
          type: ruleType,
          icon: rule.icon || 'receipt',
          color: rule.color || '#f59e0b',
          sourceType: 'recurring',
          sourceId: rule.id,
          categoryId: ruleCategoryId || null,
          suggestedAmount: amount,
          isGenerated,
          description: getRecurringPlanDescription(rule),
        });
      });

    const parentsByType = {
      income: categories.filter(
        (category) =>
          getCategoryType(category, categories) === 'income' &&
          !category.parent_id
      ),
      expense: categories.filter(
        (category) =>
          getCategoryType(category, categories) === 'expense' &&
          !category.parent_id
      ),
      savings: categories.filter(
        (category) =>
          getCategoryType(category, categories) === 'savings' &&
          !category.parent_id
      ),
      debt: categories.filter(
        (category) =>
          getCategoryType(category, categories) === 'debt' &&
          !category.parent_id
      ),
    };

    Object.entries(parentsByType).forEach(([type, parents]) => {
      parents.forEach((parent) => {
        const subs = categories.filter(
          (category) => category.parent_id === parent.id
        );

        if (subs.length > 0) {
          const childRows = subs.map((sub) => {
            return {
              key: `category:${sub.id}`,
              id: sub.id,
              categoryId: sub.id,
              name: sub.name,
              type,
              icon: sub.icon || parent.icon,
              color: sub.color || parent.color,
              isSubcategory: true,
              parentColor: parent.color,
              sourceType: 'category',
              isGenerated: false,
              suggestedAmount: 0,
              description: '',
            };
          });

          result[type].push({
            key: `section:${parent.id}`,
            id: parent.id,
            name: parent.name,
            type,
            icon: parent.icon,
            color: parent.color,
            isSectionHeader: true,
            children: childRows,
          });

          result[type].push(...childRows);
          return;
        }

        result[type].push({
          key: `category:${parent.id}`,
          id: parent.id,
          categoryId: parent.id,
          name: parent.name,
          type,
          icon: parent.icon,
          color: parent.color,
          sourceType: 'category',
          isGenerated: false,
          suggestedAmount: 0,
          description: '',
        });
      });
    });

    standaloneRecurring.forEach((row) => {
      result[row.type]?.push(row);
    });

    goalsWithFunding
      .filter((goal) => !goal.is_archived && isGoalPlannedForMonth(goal, currentMonth))
      .forEach((goal) => {
        const fixedScheduled = getGoalAmountForMonth(goal, currentMonth);
        const isGenerated = fixedScheduled !== null;
        const monthlyRequired = isGenerated
          ? fixedScheduled
          : getGoalPlannedAmountForMonth(goal, currentMonth);

        if (monthlyRequired === null || Number(monthlyRequired || 0) <= 0) {
          return;
        }

        result.savings.push({
          key: `goal:${goal.id}`,
          id: goal.id,
          name: goal.name,
          type: 'savings',
          icon: goal.icon_key || 'target',
          color: goal.color_key || '#276FE4',
          sourceType: 'goal',
          sourceId: goal.id,
          categoryId: null,
          suggestedAmount: Number(monthlyRequired || 0),
          isGenerated,
          description: getGoalPlanDescription(goal),
        });
      });

    return result;
  }, [allTransactions, categories, currentMonth, goalsWithFunding, leafCategoryIds, recurringTransactions]);

  const allRows = useMemo(() => {
    return Object.values(rowsByType)
      .flat()
      .filter((row) => !row.isSectionHeader);
  }, [rowsByType]);

  useEffect(() => {
    const initial = {};

    allRows.forEach((row) => {
      const allocation = allocationByRowKey[row.key];

      initial[row.key] = isProtectedPlanRow(row) || row.isGenerated
        ? Number(row.suggestedAmount || 0)
        : allocation
          ? Number(allocation.planned_amount || 0)
          : Number(row.suggestedAmount || 0);
    });

    setValues(unified ? { ...initial, ...draft.current } : initial);
  }, [allocationByRowKey, allRows, unified, draft]);

  const sumType = (type) => {
    return rowsByType[type]
      .filter((row) => !row.isSectionHeader)
      .reduce((sum, row) => sum + Number(values[row.key] || 0), 0);
  };

  const totals = useMemo(() => {
    const totalIncome = sumType('income');
    const totalExpenses = sumType('expense');
    const totalSavings = sumType('savings');
    const totalDebt = sumType('debt');
    const fundedDebtPayments = getFundedDebtPaymentTotal(currentMonthTransactions);
    const assignableDebt = getAssignablePlannedDebt(totalDebt, fundedDebtPayments);

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalDebt,
      fundedDebtPayments,
      assignableDebt,
      leftToAllocate: calculateLeftToAllocateFromTotals({
        totalIncome,
        totalExpenses,
        totalSavings,
        totalDebt,
        fundedDebtPayments,
      }),
    };
  }, [currentMonthTransactions, rowsByType, values]);

  const getHint = (row) => {
    if (row.isGenerated) return 0;
    return Number(prevAllocationByRowKey[row.key]?.planned_amount || 0);
  };

  const setValue = (rowKey, amount) => {
    if (unified) { draft.current[rowKey] = Number(amount || 0); setDirty(true); }
    setValues((current) => ({
      ...current,
      [rowKey]: Number(amount || 0),
    }));
  };

  const copyFromPreviousMonth = () => {
    const nextValues = { ...values };

    allRows.forEach((row) => {
      if (isProtectedPlanRow(row) || row.isGenerated) return;
      const previousValue = prevAllocationByRowKey[row.key]?.planned_amount;

      if (previousValue !== undefined && previousValue !== null) {
        nextValues[row.key] = Number(previousValue || 0);
      }
    });

    if (unified) { allRows.filter(row => !isProtectedPlanRow(row) && !row.isGenerated).forEach(row => { draft.current[row.key] = nextValues[row.key]; }); setDirty(true); }
    setValues(nextValues);
    toast.success('Copied from previous month');
  };

  const handleSave = async () => {
    if (saving || isPlanLoading || !navigator.onLine) return;
    setSaving(true);

    try {
      await Promise.all(
        allRows
          // Recurring rules and goals are managed in their own tabs.
          // Only manual category allocations may be saved here.
          .filter((row) => !isProtectedPlanRow(row) && !row.isGenerated)
          .map((row) => {
            const sourceType = row.sourceType || 'category';
            const sourceId = row.sourceId || row.categoryId || row.id;

            // Always use the natural-key upsert. A cached allocation ID can be
            // stale after copying/changing months; relying on it for UPDATE can
            // leave the copied plan unsaved. The database conflict key keeps
            // this operation idempotent for an existing month/category row.
            return budgetPlansApi.upsert({
              category_id: row.categoryId || null,
              month: currentMonth,
              planned_amount: Number(values[row.key] || 0),
              source_type: sourceType,
              source_id: sourceId,
              budget_type: row.type,
              label: row.name,
              icon: row.icon,
              color: row.color,
            });
          })
      );

      if (unified) { draft.current = {}; setDirty(false); }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allocations'] }),
        queryClient.invalidateQueries({ queryKey: ['all-allocations'] }),
        queryClient.invalidateQueries({ queryKey: ['budget-summary'] }),
      ]);
      toast.success('Monthly plan saved');
    } catch (error) {
      console.error('Monthly plan save failed:', error);
      toast.error(error.message || 'Could not save monthly plan');
    } finally {
      setSaving(false);
    }
  };

  const trackedFor = row => row.isSectionHeader ? row.children.reduce((sum, child) => sum + trackedFor(child), 0) : row.sourceType === 'category' ? getTrackedForCategory({transactions, categoryId:row.categoryId}) : getTrackedForSource({transactions,goalContributions,sourceType:row.sourceType,sourceId:row.sourceId,categoryId:row.categoryId,currentMonth,recurringRule:recurringTransactions.find(rule=>rule.id===row.sourceId)});
  const editable = row => row && !row.isSectionHeader && !isProtectedPlanRow(row) && !row.isGenerated;
  const selected = rowsByType[activeType].find(row=>row.key===selectedKey);
  const plannedFor = row => row.isSectionHeader ? row.children.reduce((sum,child)=>sum+Number(values[child.key]||0),0) : Number(values[row.key]||0);
  const visibleRows = rowsByType[activeType].filter(row=>!row.isSectionHeader);
  const hasActivity = row => row.isSectionHeader ? row.children.some(child=>plannedFor(child)!==0 || trackedFor(child)!==0) : plannedFor(row)!==0 || trackedFor(row)!==0;
  const displayedRows = hideZero ? rowsByType[activeType].filter(hasActivity) : rowsByType[activeType];
  const draftAllocations = allocations.map(a=>editable(allRows.find(row=>row.key===getAllocationRowKey(a))) ? {...a,planned_amount:Number(values[getAllocationRowKey(a)]||0)} : a);
  allRows.filter(row=>editable(row)&&!allocationByRowKey[row.key]).forEach(row=>draftAllocations.push({category_id:row.categoryId,source_type:'category',source_id:row.id,budget_type:row.type,planned_amount:Number(values[row.key]||0)}));
  const unifiedTotals = unified ? buildPlanTotals({allocations:draftAllocations,categories,savingsGoals,recurringTransactions,allTransactions,transactions,currentMonth}) : null;
  const requestEditor = (kind,row=null) => setEditorRequest({kind,type:activeType,row,nonce:Date.now()});
  const changeUnifiedMonth = month => { if (!saving && (draftRef || !dirty || window.confirm('Discard unsaved allocation changes?'))) onMonthChange?.(month); };
  if (unified) {
    const summaryPlanned = selected ? plannedFor(selected) : sumType(activeType);
    const summaryTracked = selected ? trackedFor(selected) : visibleRows.reduce((sum,row)=>sum+trackedFor(row),0);
    const details = <>
          <div className="hidden workspace:flex items-center gap-2"><h2 className="flex-1 text-lg font-semibold hidden workspace:block">{selected?.name||'Monthly summary'}</h2>{selected&&<><Button variant="ghost" size="icon" disabled={!canWrite} className="hidden workspace:inline-flex" aria-label="Edit selected item" onClick={()=>requestEditor(selected.sourceType==='goal'?'goal':selected.sourceType==='recurring'?'recurring':'category',selected)}><Pencil className="size-4"/></Button><Button variant="ghost" size="icon" className="hidden workspace:inline-flex" aria-label="Clear selection" onClick={()=>setSelectedKey(null)}><X className="size-4"/></Button></>}</div>
          <section className="hidden workspace:block space-y-3"><h3 className="font-semibold">Budget balance</h3>{[['Planned',summaryPlanned],['Tracked',summaryTracked],['Remaining',summaryPlanned-summaryTracked],...(!selected?[['Budget funding',unifiedTotals.budgetFunding],['Left to allocate',unifiedTotals.leftToAllocate]]:[])].map(([label,value])=><div key={label} className="flex justify-between gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{formatCurrency(value)}</span></div>)}</section>
          {selected&&<section className="cero-detail-section space-y-2 workspace:border-t workspace:border-border workspace:pt-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{editable(selected)?'Quick allocation':'Details'}</h3><Button variant="ghost" size="icon" disabled={!canWrite} className="workspace:hidden" aria-label="Edit selected item" onClick={()=>requestEditor(selected.sourceType==='goal'?'goal':selected.sourceType==='recurring'?'recurring':'category',selected)}><Pencil className="size-4"/></Button></div>{editable(selected)?[['Planned last month',getHint(selected)],['Cover tracked amount',summaryTracked],['Reset allocation',0]].map(([label,value])=><button key={label} disabled={!canWrite} className="cero-allocation-action flex w-full items-center justify-between gap-2 py-1 text-left text-sm text-primary" onClick={()=>{if(unified){draft.current[selected.key]=Number(value||0);setDirty(true);}setValues(current=>({...current,[selected.key]:Number(value||0)}));}}><span>{label}</span><span>{formatCurrency(value)}</span></button>):<p className="text-sm text-muted-foreground">{selected.description||'Select an individual category to edit its allocation.'}</p>}{selected.isSectionHeader&&<Button variant="outline" disabled={!canWrite} onClick={()=>requestEditor('subcategory',selected)}>Add subcategory</Button>}</section>}
        </>;
    const canWrite = navigator.onLine && !saving && !isPlanLoading;
    return <div className="cero-unified-plan space-y-2 workspace:space-y-4"><MobileHeaderActions disabled={!canWrite} addLabel={'Add '+sectionConfig[activeType].title} onAdd={()=>requestEditor(activeType==='savings'?'goal':activeType==='debt'?'recurring':'category')} items={[{label:hideZero?"Show zero categories":"Hide zero categories",onClick:()=>{setHideZero(v=>!v);setSelectedKey(null)}},{label:"Archived categories",onClick:()=>requestEditor("archived")}]}/>
      <div className="cero-plan-toolbar workspace:sticky top-0 z-20 flex flex-wrap items-center gap-2 bg-background py-2">
        <div className="cero-month-heading flex shrink-0 items-center gap-1 text-lg font-semibold"><button type="button" aria-label="Previous month" disabled={saving} className="grid size-8 place-items-center" onClick={()=>changeUnifiedMonth(format(subMonths(new Date(currentMonth+'-01T12:00:00'),1),'yyyy-MM'))}><ChevronLeft className="size-4"/></button><span>{format(new Date(currentMonth+'-01T12:00:00'),'MMMM yyyy')}</span><button type="button" aria-label="Next month" disabled={saving} className="grid size-8 place-items-center" onClick={()=>changeUnifiedMonth(format(addMonths(new Date(currentMonth+'-01T12:00:00'),1),'yyyy-MM'))}><ChevronRight className="size-4"/></button></div><div className="flex-1"/>
        <div className="mr-3 text-right"><p className="text-xs text-muted-foreground">Left to allocate</p><p className={cn("text-xl font-semibold tabular-nums",unifiedTotals.leftToAllocate<0?"text-destructive":"text-primary")}>{formatCurrency(unifiedTotals.leftToAllocate)}</p></div>
        <Button variant="outline" disabled={!canWrite} onClick={copyFromPreviousMonth}><Copy className="mr-2 size-4"/><span className="md:hidden">Copy previous</span><span className="hidden md:inline">Copy previous month</span></Button>
        <Button disabled={!canWrite||!dirty} onClick={handleSave}><Save className="mr-2 size-4"/>{saving?'Saving…':dirty?'Save plan':'Saved'}</Button>
      </div>
      {dirty&&<p role="status" className="text-xs text-primary">Unsaved allocation changes</p>}
      <div className="cero-tab-toolbar"><nav aria-label="Budget types" className="cero-workplace-tabs cero-plan-tabs flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border workspace:gap-5">
        {Object.entries(sectionConfig).map(([type,config])=><WorkspaceTab key={type} active={activeType===type} onClick={()=>{setActiveType(type);setSelectedKey(null);}}>{config.title}</WorkspaceTab>)}
        </nav><Button variant="ghost" size="sm" className="cero-desktop-only-action shrink-0" aria-pressed={hideZero} onClick={()=>{setHideZero(v=>!v);setSelectedKey(null)}}>{hideZero?"Show zero":"Hide zero"}</Button><Button size="sm" variant="outline" className="cero-add-action cero-desktop-only-action" disabled={!canWrite} onClick={()=>requestEditor(activeType==='savings'?'goal':activeType==='debt'?'recurring':'category')} aria-label={'Add '+sectionConfig[activeType].title}><Plus className="size-4"/><span>Add</span></Button><Button variant="ghost" size="sm" className="shrink-0 cero-desktop-only-action" aria-label="Archived categories" onClick={()=>requestEditor('archived')}> <span className="md:hidden" aria-hidden="true">⋯</span><span className="hidden md:inline">Archived categories</span></Button>
      </div>
      {isPlanLoading ? <Skeleton className="h-80 w-full"/> : <div className="grid min-w-0 grid-cols-1 workspace:grid-cols-[minmax(0,1fr)_minmax(260px,30%)]">
        <div className="overflow-auto workspace:max-h-[65vh]">
          <table className="cero-plan-table w-full table-fixed text-sm md:min-w-[480px]"><colgroup><col style={{width:'40%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/></colgroup>
          <thead className="sticky top-0 z-10 bg-card text-muted-foreground"><tr>{['Category','Planned','Tracked','Remaining'].map((label,i)=><th key={label} className={cn("px-3 py-3 font-medium",i?'text-right':'text-left')}>{label}</th>)}</tr></thead>
          <tbody>{displayedRows.map(row=>{const planned=plannedFor(row),tracked=trackedFor(row);return <Fragment key={row.key}><tr className={cn("border-b border-border/60 hover:bg-muted/30",selectedKey===row.key&&"bg-primary/10",row.isSectionHeader&&"bg-muted/30 font-semibold")} onClick={()=>setSelectedKey(previous=>previous===row.key?null:row.key)}>
            <th scope="row" className="px-3 py-2 text-left font-medium"><button type="button" aria-expanded={selectedKey===row.key} onClick={event=>{event.stopPropagation();setSelectedKey(previous=>previous===row.key?null:row.key);}} className={cn("flex w-full items-center gap-2 text-left",row.isSubcategory&&"pl-4")}><CategoryIcon icon={row.icon} color={row.color} size="sm"/><span className="min-w-0 break-words">{row.name}</span></button><ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground workspace:hidden",selectedKey===row.key&&"rotate-180")}/></th>
            <td className="px-2 py-2 text-right">{editable(row)?<Input aria-label={row.name+' allocation'} type="number" min="0" step="0.01" disabled={!canWrite} value={values[row.key]??0} onClick={event=>event.stopPropagation()} onFocus={event=>{if(window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches) event.target.select();}} autoComplete="off" inputMode="decimal" onChange={e=>setValue(row.key,Math.max(0,Number(e.target.value)||0))} className="cero-plan-cell h-10 workspace:h-8 px-2 text-right tabular-nums"/>:<span className="inline-flex items-center justify-end gap-1 tabular-nums" title={row.isSectionHeader?undefined:"Controlled by the linked rule or goal"}>{!row.isSectionHeader&&<LockKeyhole aria-label="Linked allocation" className="size-3"/>}{formatCurrency(planned)}</span>}</td>
            <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(tracked)}</td><td className={cn("px-2 py-2 text-right whitespace-nowrap tabular-nums",planned<tracked&&activeType==='expense'?"text-destructive":planned>tracked&&activeType==='expense'?"text-emerald-600 dark:text-emerald-400":"")}><span className="cero-amount-nowrap">{(planned<tracked?'−':'')}{formatCurrency(Math.abs(planned-tracked))}</span></td>
          </tr>{selectedKey===row.key&&<tr className="cero-inline-detail-row workspace:hidden"><td colSpan={4}><div className="cero-detail-panel">{details}</div></td></tr>}</Fragment>})}</tbody>
          <tfoot className="sticky bottom-0 bg-card font-semibold"><tr><th className="px-3 py-3 text-left">Total</th><td className="px-2 text-right">{formatCurrency(sumType(activeType))}</td><td className="px-2 text-right">{formatCurrency(visibleRows.reduce((sum,row)=>sum+trackedFor(row),0))}</td><td className="px-2 text-right">{formatCurrency(sumType(activeType)-visibleRows.reduce((sum,row)=>sum+trackedFor(row),0))}</td></tr></tfoot></table>
        </div>
        <aside className="cero-desktop-inspector hidden workspace:block cero-detail-panel workspace:border-l workspace:px-5">{details}</aside>
      </div>}
      {editorRequest?.kind==='archived'&&<div className="flex justify-end"><Button variant="ghost" onClick={()=>setEditorRequest(null)}>Close archived categories</Button></div>}{editorRequest&&<div key={editorRequest.nonce} className="contents">{editorRequest.kind==='goal'?<ManageGoalsPanel embedded request={editorRequest}/>:editorRequest.kind==='recurring'?<ManageRecurringPanel embedded request={editorRequest}/>:<ManageCategoriesPanel embedded request={editorRequest}/>}</div>}
    </div>;
  }
  const toggleSection = (type) => {
    setCollapsedSections((current) => ({
      ...current,
      [type]: !current[type],
    }));
  };

  const renderSection = (type) => {
    const config = sectionConfig[type];
    const items = rowsByType[type] || [];

    if (!items.length) return null;

    const isCollapsed = collapsedSections[type];
    const total = sumType(type);
    const count = items.filter((item) => !item.isSectionHeader).length;

    if (isPlanLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-12 w-56 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
      <section className="overflow-hidden rounded-2xl app-card-surface lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!shadow-none lg:!backdrop-blur-none">
        <button
          type="button"
          onClick={() => toggleSection(type)}
          className={cn("flex min-h-14 w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors", !isCollapsed && "border-b border-border/40")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isCollapsed && '-rotate-90'
              )}
            />

            <h3 className={cn('text-sm font-semibold', config.text)}>
              {config.title}
            </h3>

            <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          </div>

          <div
            className={cn(
              'shrink-0 text-right text-sm font-medium tabular-nums',
              config.text
            )}
          >
            {formatCurrency(total)}
          </div>
        </button>

        {!isCollapsed && (
          <div className="divide-y divide-border/50">
            <div className="hidden grid-cols-[2rem_minmax(0,1fr)_minmax(7rem,0.5fr)_minmax(8rem,0.5fr)] gap-3 bg-muted/30 px-3 py-2 text-xs text-muted-foreground lg:grid"><span className="col-span-2">Category</span><span className="text-right">Last month</span><span className="text-right">Allocation</span></div>
            {items.map((row) => {
              if (row.isSectionHeader) {
                const sectionTotal = row.children.reduce(
                  (sum, child) => sum + Number(values[child.key] || 0),
                  0
                );

                return (
                  <div
                    key={row.key}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/35 dark:hover:bg-muted/20"
                  >
                    <CategoryIcon icon={row.icon} color={row.color} size="sm" />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {row.name}
                      </div>
                    </div>

                    <div className="shrink-0 text-center text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(sectionTotal || 0)}
                    </div>
                  </div>
                );
              }

              return (
                <PlanAmountRow
                  key={row.key}
                  row={row}
                  value={values[row.key]}
                  lastMonthHint={getHint(row)}
                  onChange={(value) => setValue(row.key, value)}
                  formatCurrency={formatCurrency}
                />
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center justify-between gap-2 lg:sticky lg:top-0 lg:z-20 lg:bg-background lg:py-3">
        <MonthSelector
          currentMonth={currentMonth}
          onChange={onMonthChange || (() => {})}
          subtitle={null}
          bare
          className="min-w-0 flex-1 [&_button]:shrink-0"
        />
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={copyFromPreviousMonth}
            aria-label="Copy previous month's planned amounts" title="Copy previous month"
            className="h-9 w-9 rounded-xl lg:w-auto lg:gap-2 lg:rounded-md lg:border lg:border-border lg:px-3">
            <Copy className="h-[18px] w-[18px]" /><span className="hidden lg:inline">Copy previous month</span>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleSave}
            disabled={saving} aria-label={saving ? 'Saving plan' : 'Save plan'} title="Save plan"
            className="h-9 w-9 rounded-xl lg:w-auto lg:gap-2 lg:rounded-md lg:bg-primary lg:px-4 lg:text-primary-foreground lg:hover:bg-primary/90">
            <Save className="h-[18px] w-[18px]" /><span className="hidden lg:inline">{saving ? "Saving…" : "Save plan"}</span>
          </Button>
        </div>
      </div>

      <LeftToAllocateBanner
        sticky={false}
        leftToAllocate={totals.leftToAllocate}
        totalIncome={totals.totalIncome}
        isEditMode={true}
        formatCurrency={formatCurrency}
      />

      <div className="space-y-3">
        {renderSection('income')}
        {renderSection('expense')}
        {renderSection('savings')}
        {renderSection('debt')}
      </div>
    </div>
  );
}