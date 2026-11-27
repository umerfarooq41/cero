import { useEffect, useMemo, useRef, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ChevronDown, Copy, Save, LockKeyhole, Plus, Pencil, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import ManageCategoriesPanel from './ManageCategoriesPanel';
import ManageGoalsPanel from './ManageGoalsPanel';
import ManageRecurringPanel from './ManageRecurringPanel';
import CategoryIcon from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';
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
  getVerifiedRecurringTransactionsForRule,
} from '@/lib/planData';
import { cn } from '@/lib/utils';
import { formatCurrencyNumberText } from '@/lib/currencies';
import { calculateDueDateAfterOccurrences } from '@/lib/recurringTransactions';
import { getFixedGoalContributionAmount, addGoalOccurrence } from '@/lib/goals';

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

function normalizeType(value) {
  const type = String(value || '').toLowerCase();

  if (type === 'transfer' || type === 'debt_payment' || type === 'debt') {
    return 'debt';
  }

  if (type === 'income') return 'income';
  if (type === 'savings') return 'savings';

  return 'expense';
}

function getCategoryType(category, categories = []) {
  if (!category) return null;
  if (category.type) return normalizeType(category.type);

  const parent = categories.find((item) => item.id === category.parent_id);
  return parent ? normalizeType(parent.type) : null;
}

function getRuleCategoryId(rule) {
  return (
    rule?.category_id ||
    rule?.categoryId ||
    rule?.budget_category_id ||
    rule?.budgetCategoryId ||
    rule?.category?.id ||
    null
  );
}

function isLeafCategory(category, categories = []) {
  return !categories.some((item) => item.parent_id === category.id);
}

function getFrequencyKey(value) {
  return String(value || 'monthly').toLowerCase().replace(/[\s-]+/g, '_');
}

function formatFrequency(value) {
  const frequency = String(value || 'monthly').replace(/[_-]+/g, ' ').trim();

  if (!frequency) return 'Monthly';

  return frequency
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isRuleActive(rule) {
  if (!rule || rule.is_archived) return false;
  if (rule.is_active === false) return false;

  const status = String(rule.status || '').toLowerCase();

  return status !== 'paused' && status !== 'archived' && status !== 'inactive';
}

function formatDateText(value) {
  if (!value) return 'date not set';

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return 'date not set';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getRecurringPlanDescription(rule) {
  const isCompletedDebt =
    normalizeType(rule?.type) === 'debt' && Boolean(rule?.completed_at);

  if (isCompletedDebt) {
    return `${formatFrequency(rule?.frequency)} · Completed`;
  }

  return `${formatFrequency(rule?.frequency)} · Next ${formatDateText(
    rule?.next_due_date
  )}`;
}

function formatMoneyText(amount) {
  return formatCurrencyNumberText(amount, { smart: true });
}

function getGoalPlanDescription(goal) {
  const frequency = formatFrequency(goal?.frequency);
  const nextDate = goal?.next_due_date || goal?.start_date;
  return `${frequency} · Next ${formatDateText(nextDate)}`;
}

function getAllocationSourceType(allocation) {
  return (
    allocation?.source_type ||
    allocation?.item_type ||
    allocation?.plan_item_type ||
    'category'
  );
}

function getAllocationSourceId(allocation) {
  return allocation?.source_id || allocation?.item_id || allocation?.plan_item_id || null;
}

function getAllocationRowKey(allocation) {
  const sourceType = getAllocationSourceType(allocation);
  const sourceId = getAllocationSourceId(allocation);

  if (sourceType && sourceType !== 'category' && sourceId) {
    return `${sourceType}:${sourceId}`;
  }

  return allocation?.category_id ? `category:${allocation.category_id}` : null;
}


function getMonthOccurrenceAmount({ startDate, frequency, amount, countLimit, month }) {
  if (!startDate || !month || Number(amount || 0) <= 0) return 0;
  const limit = countLimit ? Math.max(0, Number(countLimit)) : 240;
  let total = 0;
  for (let index = 0; index < limit; index += 1) {
    const dueDate = calculateDueDateAfterOccurrences(startDate, frequency || 'monthly', index);
    const dueMonth = String(dueDate || '').slice(0, 7);
    if (dueMonth === month) total += Number(amount || 0);
    if (dueMonth > month) break;
  }
  return total;
}

function getRecurringAmountForMonth(rule, month, allTransactions = []) {
  const type = normalizeType(rule?.type);
  const isFlexibleDebt = type === 'debt' && (rule?.payment_mode || 'fixed') === 'flexible';
  if (isFlexibleDebt) return null;
  const amount = Number(rule?.amount || 0);

  if (type === 'debt' && (rule?.payment_mode || 'fixed') === 'fixed') {
    const linkedTransactions = getVerifiedRecurringTransactionsForRule(
      rule,
      allTransactions
    );
    const postedDates = [...new Set(
      linkedTransactions
        .map((transaction) => transaction.recurring_posted_for_date)
        .filter(Boolean)
        .map((date) => String(date).slice(0, 10))
    )].sort();

    // Historical debt plan values come from the posted occurrence itself.
    // This keeps Manage Plan aligned with Plan after a rule advances/completes.
    const historicalPlanned = linkedTransactions.reduce((sum, transaction) => {
      const postedFor = String(transaction.recurring_posted_for_date || '').slice(0, 10);
      if (!postedFor || postedFor.slice(0, 7) !== month) return sum;
      return sum + Math.max(0, Number(transaction.amount || 0));
    }, 0);

    if (!isRuleActive(rule)) return historicalPlanned;

    const totalOccurrences = Math.max(0, Number(rule?.duration_count || 0));
    const remaining = Math.max(0, totalOccurrences - postedDates.length);
    let futureInMonth = 0;
    if (remaining > 0 && rule?.next_due_date) {
      for (let index = 0; index < remaining; index += 1) {
        const due = calculateDueDateAfterOccurrences(rule.next_due_date, rule.frequency || 'monthly', index);
        const dueMonth = String(due || '').slice(0, 7);
        if (dueMonth === month) futureInMonth += 1;
        if (dueMonth > month) break;
      }
    }
    if (postedDates.length > 0 || rule?.next_due_date) {
      return historicalPlanned + futureInMonth * amount;
    }
  }

  if (!isRuleActive(rule)) return 0;

  return getMonthOccurrenceAmount({
    startDate: rule?.start_date || rule?.next_due_date,
    frequency: rule?.frequency || 'monthly',
    amount,
    countLimit: type === 'debt' ? rule?.duration_count : null,
    month,
  });
}

function getGoalAmountForMonth(goal, month) {
  if ((goal?.contribution_mode || 'flexible') !== 'fixed') return null;
  const amount = getFixedGoalContributionAmount(goal);
  const count = Math.max(0, Number(goal?.duration_count || 0));
  if (!amount || !count) return 0;
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    const dueDate = addGoalOccurrence(goal.start_date || goal.next_due_date, goal.frequency || 'monthly', index);
    if (String(dueDate || '').slice(0, 7) === month) total += amount;
  }
  return total;
}

function isProtectedPlanRow(row) {
  return row.sourceType === 'recurring' || row.sourceType === 'goal';
}

function PlanAmountRow({
  row,
  value,
  lastMonthHint,
  onChange,
  formatCurrency,
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-accent/30 lg:grid lg:grid-cols-[2rem_minmax(0,1fr)_minmax(7rem,0.5fr)_minmax(8rem,0.5fr)] lg:gap-3 lg:min-h-12',
        row.isSubcategory && 'pl-14 lg:pl-3'
      )}
    >
      {!row.isSubcategory && (
        <CategoryIcon icon={row.icon} color={row.color} size="sm" />
      )}

      {row.isSubcategory && (
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor:
              row.parentColor || row.color || 'hsl(var(--border))',
          }}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'block truncate text-sm',
              row.isSubcategory
                ? 'text-muted-foreground'
                : 'font-medium text-foreground'
            )}
          >
            {row.name}
          </span>

          <SourceBadge
            type={row.sourceType}
            tone={row.sourceType === 'goal' ? 'savings' : row.type}
          />
        </div>

        {(row.description || lastMonthHint > 0) && (
          <div className="mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] leading-3.5 text-muted-foreground">
            {row.description && (
              <span className="min-w-0 truncate">{row.description}</span>
            )}

            {lastMonthHint > 0 && (
              <span className="min-w-0 truncate tabular-nums lg:hidden">
                Last month: {formatCurrency(lastMonthHint)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="hidden text-right text-sm text-muted-foreground tabular-nums lg:block">{lastMonthHint > 0 ? formatCurrency(lastMonthHint) : "—"}</div>
      <div className="w-[84px] shrink-0 lg:w-full">
        {isProtectedPlanRow(row) ? (
          <button
            type="button"
            aria-label={`${row.name} is managed in the ${row.sourceType === 'goal' ? 'Goals' : 'Recurring'} tab`}
            onClick={() => toast.info(`Edit in ${row.sourceType === 'goal' ? 'Goals' : 'Recurring'} tab`)}
            className="flex h-8 w-full items-center justify-end gap-1 rounded-lg border border-border/40 bg-muted/25 px-2 text-sm font-medium tabular-nums text-muted-foreground transition-colors hover:bg-muted/45"
          >
            <LockKeyhole className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{formatMoneyText(value || 0)}</span>
          </button>
        ) : row.isGenerated ? (
          <div className="h-8 rounded-lg border border-border/40 bg-muted/25 px-2 text-right text-sm font-medium leading-8 tabular-nums text-muted-foreground">
            {formatMoneyText(value || 0)}
          </div>
        ) : (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value || ''}
            onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
            placeholder="0.00"
            aria-label={`${row.name} allocation`} className="h-8 rounded-lg px-2 text-right text-sm tabular-nums lg:h-9 lg:rounded-md"
          />
        )}
      </div>
    </div>
  );
}

export default function MonthlyPlanPanel({ currentMonth, onMonthChange, unified = false, transactions = [], goalContributions = [] }) {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();

  const categoriesQuery = useCategories();
  const allocationsQuery = useAllocations(currentMonth);
  const recurringQuery = useRecurringTransactions();
  const goalsQuery = useSavingsGoals();
  const transactionsQuery = useAllTransactions();
  const categories = categoriesQuery.data || [];
  const allocations = allocationsQuery.data || [];
  const recurringTransactions = recurringQuery.data || [];
  const savingsGoals = goalsQuery.data || [];
  const allTransactions = transactionsQuery.data || [];

  const prevMonth = format(
    subMonths(new Date(`${currentMonth}-01T00:00:00`), 1),
    'yyyy-MM'
  );
  const prevAllocationsQuery = useAllocations(prevMonth);
  const prevAllocations = prevAllocationsQuery.data || [];
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
  const draft = useRef({});
  const [activeType, setActiveType] = useState('expense');
  const [selectedKey, setSelectedKey] = useState(null);
  const [editorRequest, setEditorRequest] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
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
  }, [allocationByRowKey, allRows, unified]);

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
  const draftAllocations = allocations.map(a=>editable(allRows.find(row=>row.key===getAllocationRowKey(a))) ? {...a,planned_amount:Number(values[getAllocationRowKey(a)]||0)} : a);
  allRows.filter(row=>editable(row)&&!allocationByRowKey[row.key]).forEach(row=>draftAllocations.push({category_id:row.categoryId,source_type:'category',source_id:row.id,budget_type:row.type,planned_amount:Number(values[row.key]||0)}));
  const unifiedTotals = unified ? buildPlanTotals({allocations:draftAllocations,categories,savingsGoals,recurringTransactions,allTransactions,transactions,currentMonth}) : null;
  const requestEditor = (kind,row=null) => setEditorRequest({kind,type:activeType,row,nonce:Date.now()});
  const changeUnifiedMonth = month => { if (!dirty || window.confirm('Discard unsaved allocation changes?')) onMonthChange?.(month); };
  if (unified) {
    const summaryPlanned = selected ? plannedFor(selected) : sumType(activeType);
    const summaryTracked = selected ? trackedFor(selected) : visibleRows.reduce((sum,row)=>sum+trackedFor(row),0);
    const canWrite = navigator.onLine && !saving && !isPlanLoading;
    return <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-4 bg-background py-3">
        <MonthSelector currentMonth={currentMonth} onChange={changeUnifiedMonth} bare className="min-w-0 flex-1"/>
        <div className="mr-auto"><p className="text-sm text-muted-foreground">Left to allocate</p><p className={cn("text-2xl font-semibold tabular-nums",unifiedTotals.leftToAllocate<0?"text-destructive":"text-primary")}>{formatCurrency(unifiedTotals.leftToAllocate)}</p></div>
        <Button variant="outline" disabled={!canWrite} onClick={copyFromPreviousMonth}><Copy className="mr-2 size-4"/>Copy previous month</Button>
        <Button disabled={!canWrite||!dirty} onClick={handleSave}><Save className="mr-2 size-4"/>{saving?'Saving…':'Save plan'}</Button>
      </div>
      <nav aria-label="Budget types" className="flex items-center gap-5 border-b border-border">
        {Object.entries(sectionConfig).map(([type,config])=><button key={type} type="button" aria-pressed={activeType===type} onClick={()=>{setActiveType(type);setSelectedKey(null);}} className={cn("border-b-2 px-2 py-3 text-sm font-medium",activeType===type?"border-primary text-primary":"border-transparent text-muted-foreground")}>{config.title}</button>)}
        <Button size="sm" variant="ghost" disabled={!canWrite} onClick={()=>requestEditor(activeType==='savings'?'goal':activeType==='debt'?'recurring':'category')} aria-label={'Add '+sectionConfig[activeType].title}><Plus className="size-4"/></Button>
      </nav>
      {isPlanLoading ? <Skeleton className="h-80 w-full"/> : <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(260px,30%)]">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full min-w-[480px] table-fixed text-sm"><colgroup><col style={{width:'40%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/></colgroup>
          <thead className="sticky top-0 z-10 bg-card text-muted-foreground"><tr>{['Category','Planned','Tracked','Remaining'].map((label,i)=><th key={label} className={cn("px-3 py-3 font-medium",i?'text-right':'text-left')}>{label}</th>)}</tr></thead>
          <tbody>{rowsByType[activeType].map(row=>{const planned=plannedFor(row),tracked=trackedFor(row);return <tr key={row.key} className={cn("border-b border-border/60 hover:bg-muted/30",selectedKey===row.key&&"bg-primary/10",row.isSectionHeader&&"bg-muted/30 font-semibold")} onClick={()=>setSelectedKey(row.key)}>
            <th scope="row" className="px-3 py-2 text-left font-medium"><button type="button" onClick={()=>setSelectedKey(row.key)} className={cn("flex w-full items-center gap-2 text-left",row.isSubcategory&&"pl-4")}><CategoryIcon icon={row.icon} color={row.color} size="sm"/><span className="min-w-0 break-words">{row.name}</span></button></th>
            <td className="px-2 py-2 text-right">{editable(row)?<Input aria-label={row.name+' allocation'} type="number" min="0" step="0.01" disabled={!canWrite} value={values[row.key]??0} onFocus={()=>setSelectedKey(row.key)} onChange={e=>setValue(row.key,Math.max(0,Number(e.target.value)||0))} className="h-8 rounded-sm border-transparent bg-transparent px-1 text-right tabular-nums hover:border-border focus:border-primary"/>:<span className="inline-flex items-center gap-1">{!row.isSectionHeader&&<LockKeyhole className="size-3"/>}{formatCurrency(planned)}</span>}</td>
            <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(tracked)}</td><td className={cn("px-2 py-2 text-right tabular-nums",planned<tracked&&activeType==='expense'?"text-destructive":"")}>{formatCurrency(planned-tracked)}</td>
          </tr>})}</tbody>
          <tfoot className="sticky bottom-0 bg-card font-semibold"><tr><th className="px-3 py-3 text-left">Total</th><td className="px-2 text-right">{formatCurrency(sumType(activeType))}</td><td className="px-2 text-right">{formatCurrency(visibleRows.reduce((sum,row)=>sum+trackedFor(row),0))}</td><td className="px-2 text-right">{formatCurrency(sumType(activeType)-visibleRows.reduce((sum,row)=>sum+trackedFor(row),0))}</td></tr></tfoot></table>
        </div>
        <aside className="max-h-[65vh] space-y-5 overflow-y-auto border-l border-border px-5 py-3">
          <div className="flex items-center gap-2"><h2 className="flex-1 text-lg font-semibold">{selected?.name||'Monthly summary'}</h2>{selected&&<><Button variant="ghost" size="icon" disabled={!canWrite} aria-label="Edit selected item" onClick={()=>requestEditor(selected.sourceType==='goal'?'goal':selected.sourceType==='recurring'?'recurring':'category',selected)}><Pencil className="size-4"/></Button><Button variant="ghost" size="icon" aria-label="Clear selection" onClick={()=>setSelectedKey(null)}><X className="size-4"/></Button></>}</div>
          <section className="space-y-3"><h3 className="font-semibold">Budget balance</h3>{[['Planned',summaryPlanned],['Tracked',summaryTracked],['Remaining',summaryPlanned-summaryTracked],...(!selected?[['Budget funding',unifiedTotals.budgetFunding],['Left to allocate',unifiedTotals.leftToAllocate]]:[])].map(([label,value])=><div key={label} className="flex justify-between gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{formatCurrency(value)}</span></div>)}</section>
          {selected&&<section className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">{editable(selected)?'Quick allocation':'Details'}</h3>{editable(selected)?[['Planned last month',getHint(selected)],['Cover tracked amount',summaryTracked],['Reset allocation',0]].map(([label,value])=><button key={label} disabled={!canWrite} className="flex w-full justify-between gap-2 py-1 text-left text-sm text-primary" onClick={()=>setValue(selected.key,value)}><span>{label}</span><span>{formatCurrency(value)}</span></button>):<p className="text-sm text-muted-foreground">{selected.description||'Select an individual category to edit its allocation.'}</p>}{selected.isSectionHeader&&<Button variant="outline" disabled={!canWrite} onClick={()=>requestEditor('subcategory',selected)}>Add subcategory</Button>}</section>}
        </aside>
      </div>}
      {editorRequest&&<div key={editorRequest.nonce} className="contents">{editorRequest.kind==='goal'?<ManageGoalsPanel embedded request={editorRequest}/>:editorRequest.kind==='recurring'?<ManageRecurringPanel embedded request={editorRequest}/>:<ManageCategoriesPanel embedded request={editorRequest}/>}</div>}
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