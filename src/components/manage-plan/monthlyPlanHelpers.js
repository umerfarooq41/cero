import { formatCurrencyNumberText } from '@/lib/currencies';
import { calculateDueDateAfterOccurrences } from '@/lib/recurringTransactions';
import { getFixedGoalContributionAmount, addGoalOccurrence } from '@/lib/goals';
import { getVerifiedRecurringTransactionsForRule } from '@/lib/planData';

export function normalizeType(value) {
  const type = String(value || '').toLowerCase();

  if (type === 'transfer' || type === 'debt_payment' || type === 'debt') {
    return 'debt';
  }

  if (type === 'income') return 'income';
  if (type === 'savings') return 'savings';

  return 'expense';
}

export function getCategoryType(category, categories = []) {
  if (!category) return null;
  if (category.type) return normalizeType(category.type);

  const parent = categories.find((item) => item.id === category.parent_id);
  return parent ? normalizeType(parent.type) : null;
}

export function getRuleCategoryId(rule) {
  return (
    rule?.category_id ||
    rule?.categoryId ||
    rule?.budget_category_id ||
    rule?.budgetCategoryId ||
    rule?.category?.id ||
    null
  );
}

export function isLeafCategory(category, categories = []) {
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

export function isRuleActive(rule) {
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

export function getRecurringPlanDescription(rule) {
  const isCompletedDebt =
    normalizeType(rule?.type) === 'debt' && Boolean(rule?.completed_at);

  if (isCompletedDebt) {
    return `${formatFrequency(rule?.frequency)} · Completed`;
  }

  return `${formatFrequency(rule?.frequency)} · Next ${formatDateText(
    rule?.next_due_date
  )}`;
}

export function formatMoneyText(amount) {
  return formatCurrencyNumberText(amount, { smart: true });
}

export function getGoalPlanDescription(goal) {
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

export function getAllocationRowKey(allocation) {
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

export function getRecurringAmountForMonth(rule, month, allTransactions = []) {
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

export function getGoalAmountForMonth(goal, month) {
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

export function isProtectedPlanRow(row) {
  return row.sourceType === 'recurring' || row.sourceType === 'goal';
}

