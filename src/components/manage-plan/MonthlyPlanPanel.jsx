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
} from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import {
  formatGoalDate,
  getGoalProgress,
  getGoalStatus,
  getMonthlyRequiredSaving,
} from '@/lib/goals';
import { cn } from '@/lib/utils';
import { formatCurrencyNumberText } from '@/lib/currencies';

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
  const targetDate = goal?.target_date ? formatGoalDate(goal.target_date) : null;

  const statusText =
    status?.key === 'due' ? 'Target passed' : status?.label || 'Active';
  const targetText = targetDate
    ? `Target ${target} · ${targetDate}`
    : `Target ${target}`;

  return `${statusText} · ${progress}% complete · ${targetText}`;
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
        'flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/30',
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
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {row.description && (
              <span className="truncate">{row.description}</span>
            )}

            {lastMonthHint > 0 && (
              <span className="tabular-nums">
                Last month: {formatCurrency(lastMonthHint)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-28 shrink-0">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
          placeholder="0.00"
          className="h-8 text-right text-sm tabular-nums"
        />
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

  const prevMonth = format(
    subMonths(new Date(`${currentMonth}-01T00:00:00`), 1),
    'yyyy-MM'
  );
  const { data: prevAllocations = [] } = useAllocations(prevMonth);

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

    const recurringByCategory = new Map();
    const standaloneRecurring = [];

    recurringTransactions
      .filter((rule) => isRuleActive(rule))
      .forEach((rule) => {
        const ruleCategoryId = getRuleCategoryId(rule);
        const category = categories.find((item) => item.id === ruleCategoryId);
        const ruleType =
          getCategoryType(category, categories) || normalizeType(rule.type);
        const amount = Number(rule.amount || 0);

        if (ruleCategoryId && leafCategoryIds.has(ruleCategoryId)) {
          const current = recurringByCategory.get(ruleCategoryId) || {
            amount: 0,
            names: [],
            descriptions: [],
          };

          current.amount += amount;
          current.names.push(rule.name);
          current.descriptions.push(getRecurringPlanDescription(rule));
          recurringByCategory.set(ruleCategoryId, current);
          return;
        }

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
            const recurring = recurringByCategory.get(sub.id);

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
              sourceType: recurring ? 'recurring' : null,
              suggestedAmount: recurring?.amount || 0,
              description: recurring
                ? [...new Set(recurring.descriptions)].join(' · ')
                : '',
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

        const recurring = recurringByCategory.get(parent.id);

        result[type].push({
          key: `category:${parent.id}`,
          id: parent.id,
          categoryId: parent.id,
          name: parent.name,
          type,
          icon: parent.icon,
          color: parent.color,
          sourceType: recurring ? 'recurring' : null,
          suggestedAmount: recurring?.amount || 0,
          description: recurring
            ? [...new Set(recurring.descriptions)].join(' · ')
            : '',
        });
      });
    });

    standaloneRecurring.forEach((row) => {
      result[row.type]?.push(row);
    });

    savingsGoals
      .filter((goal) => !goal.is_archived)
      .forEach((goal) => {
        const monthlyRequired = getMonthlyRequiredSaving(goal);

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
          description: getGoalPlanDescription(goal),
        });
      });

    return result;
  }, [categories, leafCategoryIds, recurringTransactions, savingsGoals]);

  const allRows = useMemo(() => {
    return Object.values(rowsByType)
      .flat()
      .filter((row) => !row.isSectionHeader);
  }, [rowsByType]);

  useEffect(() => {
    const initial = {};

    allRows.forEach((row) => {
      const allocation = allocationByRowKey[row.key];

      initial[row.key] = allocation
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

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalDebt,
      leftToAllocate: totalIncome - totalExpenses - totalSavings - totalDebt,
    };
  }, [rowsByType, values]);

  const getHint = (rowKey) => {
    return Number(prevAllocationByRowKey[rowKey]?.planned_amount || 0);
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
        allRows.map((row) => {
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
              'shrink-0 text-right text-sm font-semibold tabular-nums',
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
                    className="flex items-center gap-3 app-card-surface-soft px-4 py-3"
                  >
                    <CategoryIcon icon={row.icon} color={row.color} size="sm" />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {row.name}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-sm font-bold tabular-nums">
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
                  lastMonthHint={getHint(row.key)}
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

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Planned amounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Recurring and Goal badges show source amounts. Editing any row only
            changes this month’s plan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
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