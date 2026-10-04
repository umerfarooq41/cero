import { useEffect, useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ChevronDown, Copy, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import CategoryIcon from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';
import MonthSelector from '@/components/shared/MonthSelector';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  formatGoalDate,
  getGoalProgress,
  getGoalStartDate,
  getGoalStatus,
  getGoalPlannedAmountForMonth,
  isGoalPlannedForMonth,
} from '@/lib/goals';
import {
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
  const progress = getGoalProgress(goal);
  const status = getGoalStatus(goal);
  const target = formatMoneyText(goal?.target_amount);
  const startDate = formatGoalDate(getGoalStartDate(goal));
  const targetDate = goal?.target_date ? formatGoalDate(goal.target_date) : null;

  const statusText =
    status?.key === 'due' ? 'Target passed' : status?.label || 'Active';
  const targetText = targetDate
    ? `Target ${target} · ${targetDate}`
    : `Target ${target}`;

  return `Starts ${startDate} · ${statusText} · ${progress}% complete · ${targetText}`;
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
        'flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-accent/30',
        row.isSubcategory && 'pl-14'
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
          <div className="mt-0.5 flex min-w-0 items-center gap-1 whitespace-nowrap text-[10px] leading-3.5 text-muted-foreground">
            {row.description && (
              <span className="shrink-0">{row.description}</span>
            )}

            {lastMonthHint > 0 && (
              <span className="shrink-0 tabular-nums">
                Last month: {formatCurrency(lastMonthHint)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-20 shrink-0">
        {row.isGenerated ? (
          <div className="h-8 rounded-md border border-border/50 bg-muted/35 px-3 text-right text-sm font-medium leading-8 tabular-nums text-muted-foreground">
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
            className="h-8 text-right text-sm tabular-nums"
          />
        )}
      </div>
    </div>
  );
}

export default function MonthlyPlanPanel({ currentMonth, onMonthChange }) {
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();

  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: allTransactions = [] } = useAllTransactions();

  const prevMonth = format(
    subMonths(new Date(`${currentMonth}-01T00:00:00`), 1),
    'yyyy-MM'
  );
  const { data: prevAllocations = [] } = useAllocations(prevMonth);

  const currentMonthTransactions = useMemo(() => {
    return allTransactions.filter((transaction) =>
      String(transaction?.date || '').startsWith(currentMonth)
    );
  }, [allTransactions, currentMonth]);

  const [values, setValues] = useState({});
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

      initial[row.key] = row.isGenerated
        ? Number(row.suggestedAmount || 0)
        : allocation
          ? Number(allocation.planned_amount || 0)
          : Number(row.suggestedAmount || 0);
    });

    setValues(initial);
  }, [allocationByRowKey, allRows]);

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
    setValues((current) => ({
      ...current,
      [rowKey]: Number(amount || 0),
    }));
  };

  const copyFromPreviousMonth = () => {
    const nextValues = { ...values };

    allRows.forEach((row) => {
      if (row.isGenerated) return;
      const previousValue = prevAllocationByRowKey[row.key]?.planned_amount;

      if (previousValue !== undefined && previousValue !== null) {
        nextValues[row.key] = Number(previousValue || 0);
      }
    });

    setValues(nextValues);
    toast.success('Copied from previous month');
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await Promise.all(
        allRows
          // Scheduled recurring items and fixed goals are derived from their
          // authoritative rules/ledger. Persist only editable plan rows.
          .filter((row) => !row.isGenerated)
          .map((row) => {
          const existingAllocation = allocationByRowKey[row.key];
          const sourceType = row.sourceType || 'category';
          const sourceId = row.sourceId || row.categoryId || row.id;

          return budgetPlansApi.upsert({
            id: existingAllocation?.id,
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

      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['all-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      toast.success('Monthly plan saved');
    } catch (error) {
      console.error('Monthly plan save failed:', error);
      toast.error(error.message || 'Could not save monthly plan');
    } finally {
      setSaving(false);
    }
  };

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

    return (
      <section className="overflow-hidden rounded-2xl app-card-surface">
        <button
          type="button"
          onClick={() => toggleSection(type)}
          className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-5 py-3.5 text-left transition-colors hover:bg-accent/30"
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

            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          </div>

          <div
            className={cn(
              'shrink-0 text-center text-sm font-medium tabular-nums',
              config.text
            )}
          >
            {formatCurrency(total)}
          </div>
        </button>

        {!isCollapsed && (
          <div className="divide-y divide-border/50">
            {items.map((row) => {
              if (row.isSectionHeader) {
                const sectionTotal = row.children.reduce(
                  (sum, child) => sum + Number(values[child.key] || 0),
                  0
                );

                return (
                  <div
                    key={row.key}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/35 dark:hover:bg-muted/20"
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
    <div className="space-y-4">
      <div className="flex justify-center">
        <MonthSelector
          currentMonth={currentMonth}
          onChange={onMonthChange || (() => {})}
          subtitle="Planning month"
        />
      </div>

      <LeftToAllocateBanner
        sticky={false}
        leftToAllocate={totals.leftToAllocate}
        totalIncome={totals.totalIncome}
        isEditMode={true}
        formatCurrency={formatCurrency}
      />

      <div className="space-y-3 lg:flex lg:items-end lg:justify-between lg:gap-6 lg:space-y-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Planned amounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Recurring and Goal badges show source amounts. Goals appear from their
            start month onward. Editing any row only changes this month’s plan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end lg:shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyFromPreviousMonth}
            className="gap-2 rounded-xl text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy previous
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {renderSection('income')}
        {renderSection('expense')}
        {renderSection('savings')}
        {renderSection('debt')}
      </div>
    </div>
  );
}