import { addGoalOccurrence, getFixedGoalContributionAmount, getGoalPlannedAmountForMonth, isGoalPlannedForMonth } from '@/lib/goals';
import { calculateDueDateAfterOccurrences } from '@/lib/recurringTransactions';

export function normalizePlanType(value) {
  const type = String(value || '').toLowerCase();

if (type === 'transfer' || type === 'debt_payment' || type === 'debt') {
    return 'debt';
  }

  if (type === 'income') return 'income';
  if (type === 'savings') return 'savings';

  return 'expense';
}

export function getPlanCategoryType(category, categories = []) {
  if (!category) return null;
  if (category.type) return normalizePlanType(category.type);

  const parent = categories.find((item) => item.id === category.parent_id);
  return parent ? normalizePlanType(parent.type) : null;
}

export function getAllocationSourceType(allocation) {
  return (
    allocation?.source_type ||
    allocation?.item_type ||
    allocation?.plan_item_type ||
    'category'
  );
}

export function normalizeSourceType(value) {
  const sourceType = String(value || 'category').toLowerCase();

  if (sourceType === 'savings_goal') return 'goal';
  if (sourceType === 'recurring_transaction') return 'recurring';

  return sourceType;
}

export function getTransactionAmount(transaction) {
  return Math.max(0, Number(transaction?.amount || 0));
}

export function getTransactionGoalId(transaction) {
  return transaction?.savings_goal_id || transaction?.goal_id || null;
}

export function getContributionGoalId(contribution) {
  return contribution?.goal_id || contribution?.savings_goal_id || null;
}

function getMonthKey(dateValue) {
  return String(dateValue || '').slice(0, 7);
}

function isLikelyGoalFundUseContribution(contribution) {
  const note = String(contribution?.note || '').trim().toLowerCase();

  return note.startsWith('use ') && note.endsWith(' funds');
}

function hasMatchingGoalTransaction(contribution, transactions = []) {
  return transactions.some((transaction) => {
    if (contribution?.transaction_id && transaction?.id === contribution.transaction_id) {
      return true;
    }

    return Boolean(
      contribution?.id && transaction?.goal_contribution_id === contribution.id
    );
  });
}

function getTrackedForGoalContributions({
  goalContributions = [],
  transactions = [],
  sourceId,
  currentMonth,
}) {
  if (!sourceId || !currentMonth) return 0;

  return goalContributions.reduce((sum, contribution) => {
    if (getContributionGoalId(contribution) !== sourceId) return sum;
    if (getMonthKey(contribution.contribution_date) !== currentMonth) return sum;
    if (isLikelyGoalFundUseContribution(contribution)) return sum;
    if (hasMatchingGoalTransaction(contribution, transactions)) return sum;

    return sum + getTransactionAmount(contribution);
  }, 0);
}

export function isGoalFundUseTransaction(transaction) {
  const note = String(transaction?.note || '').trim().toLowerCase();

  return (
    transaction?.source_type === 'goal_withdrawal' ||
    (note.startsWith('use ') && note.endsWith(' funds'))
  );
}

export function getFundedDebtPaymentTotal(transactions = []) {
  return transactions.reduce((sum, transaction) => {
    if (!isGoalFundUseTransaction(transaction)) return sum;

    return sum + getTransactionAmount(transaction);
  }, 0);
}

export function getAssignablePlannedDebt(plannedDebt = 0, fundedDebtPayments = 0) {
  return Math.max(0, Number(plannedDebt || 0) - Number(fundedDebtPayments || 0));
}

export function calculateLeftToAllocateFromTotals(totals = {}) {
  const income = Number(totals.income || totals.totalIncome || 0);
  const expense = Number(totals.expense || totals.totalExpenses || 0);
  const savings = Number(totals.savings || totals.totalSavings || 0);
  const debt = Number(totals.debt || totals.totalDebt || 0);
  const fundedDebtPayments = Number(totals.fundedDebtPayments || 0);
  const assignableDebt = getAssignablePlannedDebt(debt, fundedDebtPayments);

  return income - expense - savings - assignableDebt;
}

export function isSourceLinkedTransaction(transaction) {
  return Boolean(
    transaction?.recurring_transaction_id ||
      transaction?.recurring_posted_for_date ||
      transaction?.savings_goal_id ||
      transaction?.goal_id ||
      transaction?.goal_contribution_id
  );
}

export function getRegularPlannedForCategoryFromAllocations(allocations, categoryId) {
  return allocations
    .filter((allocation) => {
      const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
      return allocation.category_id === categoryId && sourceType === 'category';
    })
    .reduce((sum, allocation) => sum + Number(allocation.planned_amount || 0), 0);
}

function getNormalizedText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function getSourceNaturalKey(allocation) {
  const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
  const type = normalizePlanType(allocation.budget_type);
  const label = getNormalizedText(allocation.label || allocation.name);
  const amount = Number(allocation.planned_amount || 0).toFixed(2);

  return `${sourceType}:${type}:${label}:${amount}`;
}

export function getSourceRowKey(allocation) {
  const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
  const naturalKey = getSourceNaturalKey(allocation);

  return allocation.source_id
    ? `${naturalKey}:${allocation.source_id}`
    : `${naturalKey}:fallback:${allocation.category_id || allocation.id || 'no-id'}`;
}

function pickBetterSourceAllocation(current, next) {
  if (!current) return next;

  const currentHasSourceId = Boolean(current.source_id);
  const nextHasSourceId = Boolean(next.source_id);

  if (nextHasSourceId && !currentHasSourceId) return next;
  if (currentHasSourceId && !nextHasSourceId) return current;

  const currentHasCategory = Boolean(current.category_id);
  const nextHasCategory = Boolean(next.category_id);

  if (nextHasCategory && !currentHasCategory) return next;
  if (currentHasCategory && !nextHasCategory) return current;

  const currentAmount = Number(current.planned_amount || 0);
  const nextAmount = Number(next.planned_amount || 0);

  return nextAmount >= currentAmount ? next : current;
}

export function dedupeSourceAllocations(allocations = []) {
  const byNaturalKey = new Map();

  allocations.forEach((allocation) => {
    const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
    if (sourceType === 'category') return;

    const naturalKey = getSourceNaturalKey(allocation);
    const existing = byNaturalKey.get(naturalKey);

    byNaturalKey.set(naturalKey, pickBetterSourceAllocation(existing, allocation));
  });

  return Array.from(byNaturalKey.values());
}

function hasGoalSourceAllocation(sourceAllocations = [], goalId) {
  return sourceAllocations.some(
    (allocation) =>
      normalizeSourceType(getAllocationSourceType(allocation)) === 'goal' &&
      allocation.source_id === goalId
  );
}

export function buildSuggestedGoalAllocations({
  savingsGoals = [],
  sourceAllocations = [],
  currentMonth,
} = {}) {
  if (!currentMonth) return [];

  return savingsGoals
    .filter(
      (goal) =>
        goal &&
        !goal.is_archived &&
        !hasGoalSourceAllocation(sourceAllocations, goal.id) &&
        isGoalPlannedForMonth(goal, currentMonth)
    )
    .map((goal) => {
      const plannedAmount = getGoalPlannedAmountForMonth(goal, currentMonth);

      if (plannedAmount === null || Number(plannedAmount || 0) <= 0) {
        return null;
      }

      return {
        source_type: 'goal',
        source_id: goal.id,
        category_id: null,
        budget_type: 'savings',
        planned_amount: Number(plannedAmount || 0),
        label: goal.name,
        icon: goal.icon_key || 'target',
        color: goal.color_key || '#276FE4',
      };
    })
    .filter(Boolean);
}

export function getTrackedForSource({
  transactions = [],
  goalContributions = [],
  sourceType,
  sourceId,
  categoryId,
  currentMonth,
  recurringRule = null,
}) {
  const normalizedSourceType = normalizeSourceType(sourceType);

  const transactionTracked = transactions.reduce((sum, transaction) => {
    if (normalizedSourceType === 'goal') {
      return getTransactionGoalId(transaction) === sourceId && !isGoalFundUseTransaction(transaction)
        ? sum + getTransactionAmount(transaction)
        : sum;
    }

    if (normalizedSourceType === 'recurring') {
      if (recurringRule) {
        const verified = getVerifiedRecurringTransactionsForRule(
          recurringRule,
          transactions
        );
        return verified.includes(transaction)
          ? sum + getTransactionAmount(transaction)
          : sum;
      }

      // A recurring transaction must belong to exactly one source row.
      // Prefer the persisted recurring rule id. Category fallback is only for
      // legacy recurring transactions that do not have a rule id at all.
      const matchesRule =
        Boolean(sourceId) && transaction.recurring_transaction_id === sourceId;
      const hasRuleId = Boolean(transaction.recurring_transaction_id);
      const isLegacyRecurring = Boolean(
        !hasRuleId &&
          (transaction.recurring_posted_for_date ||
            transaction.source_type === 'recurring')
      );
      const matchesLegacyCategory =
        Boolean(categoryId) &&
        transaction.category_id === categoryId &&
        isLegacyRecurring;

      return matchesRule || matchesLegacyCategory
        ? sum + getTransactionAmount(transaction)
        : sum;
    }

    return sum;
  }, 0);

  if (normalizedSourceType !== 'goal') {
    return transactionTracked;
  }

  return (
    transactionTracked +
    getTrackedForGoalContributions({
      goalContributions,
      transactions,
      sourceId,
      currentMonth,
    })
  );
}


export function getTrackedForCategory({ transactions = [], categoryId }) {
  return transactions
    .filter((transaction) => {
      if (transaction.category_id !== categoryId) return false;

      // Goal-fund use is funded by money saved earlier. It should show as
      // tracked debt activity, but it should not become a new current-month
      // assignment in Left to Allocate.
      if (isGoalFundUseTransaction(transaction)) return true;

      return !isSourceLinkedTransaction(transaction);
    })
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
}


export function getVerifiedRecurringTransactionsForRule(rule, allTransactions = []) {
  if (!rule?.id) return [];

  const amount = Math.max(0, Number(rule.amount || 0));
  const startDate = rule.start_date || rule.next_due_date;
  const count = Math.max(0, Number(rule.duration_count || 0));
  const scheduledDates = new Set();

  if (startDate && count > 0) {
    for (let index = 0; index < count; index += 1) {
      scheduledDates.add(
        calculateDueDateAfterOccurrences(
          startDate,
          rule.frequency || 'monthly',
          index
        )
      );
    }
  }

  return allTransactions.filter((transaction) => {
    if (transaction.recurring_transaction_id === rule.id) return true;

    // Legacy/recreated-rule fallback: a recurring debt transaction may have
    // the old rule id. Verify it only when the immutable occurrence date,
    // amount, category and both accounts agree with this rule. This prevents
    // amount/name guessing while allowing historical Plan months to reconcile
    // against the posted transaction ledger.
    if (normalizePlanType(rule.type) !== 'debt') return false;
    if (!(transaction.recurring_transaction_id || transaction.recurring_posted_for_date || transaction.source_type === 'recurring')) return false;

    const postedFor = String(transaction.recurring_posted_for_date || transaction.date || '').slice(0, 10);
    if (!postedFor || !scheduledDates.has(postedFor)) return false;
    if (Math.abs(getTransactionAmount(transaction) - amount) > 0.005) return false;
    if ((transaction.account_id || null) !== (rule.account_id || null)) return false;
    if ((transaction.to_account_id || null) !== (rule.to_account_id || null)) return false;
    if ((transaction.category_id || null) !== (rule.category_id || null)) return false;

    return true;
  });
}

function getScheduledRecurringAmount(rule, currentMonth, allTransactions = []) {
  if (!rule || !currentMonth || rule.is_archived) return 0;
  const type = normalizePlanType(rule.type);
  if (type === 'debt' && (rule.payment_mode || 'fixed') === 'flexible') return null;
  const amount = Math.max(0, Number(rule.amount || 0));

  if (type === 'debt' && (rule.payment_mode || 'fixed') === 'fixed') {
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

    // A posted transaction is the immutable snapshot of that debt occurrence.
    // Use its persisted due date AND amount for historical Plan months so later
    // rule edits, next_due_date advances, or completion cannot rewrite history.
    const historicalPlanned = linkedTransactions.reduce((sum, transaction) => {
      const postedFor = String(transaction.recurring_posted_for_date || '').slice(0, 10);
      if (!postedFor || postedFor.slice(0, 7) !== currentMonth) return sum;
      return sum + Math.max(0, Number(transaction.amount || 0));
    }, 0);

    // Completed/paused debt rules still own their posted history, but they must
    // never generate new future occurrences.
    if (rule.is_active === false) {
      return historicalPlanned;
    }

    if (!amount) return historicalPlanned;

    const totalOccurrences = Math.max(0, Number(rule.duration_count || 0));
    const remainingOccurrences = totalOccurrences > 0
      ? Math.max(0, totalOccurrences - postedDates.length)
      : 0;

    let futureInMonth = 0;
    if (remainingOccurrences > 0 && rule.next_due_date) {
      for (let index = 0; index < remainingOccurrences; index += 1) {
        const due = calculateDueDateAfterOccurrences(
          rule.next_due_date,
          rule.frequency || 'monthly',
          index
        );
        const month = String(due || '').slice(0, 7);
        if (month === currentMonth) futureInMonth += 1;
        if (month > currentMonth) break;
      }
    }

    if (postedDates.length > 0 || rule.next_due_date) {
      return historicalPlanned + futureInMonth * amount;
    }
  }

  if (rule.is_active === false || !amount) return 0;

  const start = rule.start_date || rule.next_due_date;
  if (!start) return 0;
  const limit = type === 'debt' && Number(rule.duration_count || 0) > 0
    ? Number(rule.duration_count)
    : 240;
  let total = 0;
  for (let index = 0; index < limit; index += 1) {
    const due = calculateDueDateAfterOccurrences(start, rule.frequency || 'monthly', index);
    const month = String(due || '').slice(0, 7);
    if (month === currentMonth) total += amount;
    if (month > currentMonth) break;
  }
  return total;
}

function getScheduledGoalAmount(goal, currentMonth) {
  if (!goal || !currentMonth || goal.is_archived) return null;
  if ((goal.contribution_mode || 'flexible') !== 'fixed') return null;
  const amount = getFixedGoalContributionAmount(goal);
  const count = Math.max(0, Number(goal.duration_count || 0));
  if (!amount || !count) return 0;
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    const due = addGoalOccurrence(goal.start_date || goal.next_due_date, goal.frequency || 'monthly', index);
    if (String(due || '').slice(0, 7) === currentMonth) total += amount;
  }
  return total;
}

function buildAuthoritativeScheduledAllocations({
  recurringTransactions = [],
  savingsGoals = [],
  allocations = [],
  currentMonth,
  allTransactions = [],
} = {}) {
  const generated = [];
  recurringTransactions.forEach((rule) => {
    const amount = getScheduledRecurringAmount(rule, currentMonth, allTransactions);
    if (amount === null) return;
    generated.push({
      source_type: 'recurring',
      source_id: rule.id,
      category_id: rule.category_id || null,
      budget_type: normalizePlanType(rule.type),
      planned_amount: amount,
      label: rule.name,
      icon: rule.icon || 'receipt',
      color: rule.color,
    });
  });
  savingsGoals.forEach((goal) => {
    const amount = getScheduledGoalAmount(goal, currentMonth);
    if (amount === null) return;
    generated.push({
      source_type: 'goal',
      source_id: goal.id,
      category_id: null,
      budget_type: 'savings',
      planned_amount: amount,
      label: goal.name,
      icon: goal.icon_key || 'target',
      color: goal.color_key,
    });
  });
  const generatedKeys = new Set(generated.map((row) => `${row.source_type}:${row.source_id}`));
  const recurringById = new Map(
    recurringTransactions.filter(Boolean).map((rule) => [rule.id, rule])
  );
  const manualOrFlexible = allocations.filter((allocation) => {
    const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
    if (sourceType === 'category') return true;

    if (sourceType === 'recurring') {
      const rule = recurringById.get(allocation.source_id);

      // Recurring rows are schedule-owned. A copied/manual snapshot must never
      // survive beside the authoritative occurrence row. Only explicitly
      // flexible debt rules may keep a saved allocation as their plan amount.
      if (!rule) return false;
      const type = normalizePlanType(rule.type);
      const isFlexibleDebt =
        type === 'debt' && (rule.payment_mode || 'fixed') === 'flexible';
      if (!isFlexibleDebt) return false;
    }

    return !generatedKeys.has(`${sourceType}:${allocation.source_id}`);
  });
  return [...manualOrFlexible, ...generated];
}

export function buildPlanViewData({
  activeTab,
  categories = [],
  subcategories = [],
  allocations = [],
  transactions = [],
  goalContributions = [],
  savingsGoals = [],
  recurringTransactions = [],
  allTransactions = [],
  currentMonth,
  tab,
}) {
  const authoritativeAllocations = buildAuthoritativeScheduledAllocations({
    recurringTransactions,
    savingsGoals,
    allocations,
    currentMonth,
    allTransactions,
  });
  const savedSourceAllocations = dedupeSourceAllocations(authoritativeAllocations);
  const suggestedGoalAllocations = buildSuggestedGoalAllocations({
    savingsGoals,
    sourceAllocations: savedSourceAllocations,
    currentMonth,
  });
  const sourceAllocations = [...savedSourceAllocations, ...suggestedGoalAllocations];

  const extraPlanRows = sourceAllocations
    .filter((allocation) => normalizePlanType(allocation.budget_type) === activeTab)
    .map((allocation, index) => {
      const planned = Number(allocation.planned_amount || 0);
      const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
      const tracked = getTrackedForSource({
        transactions,
        goalContributions,
        sourceType,
        sourceId: allocation.source_id,
        categoryId: allocation.category_id,
        currentMonth,
        recurringRule:
          sourceType === 'recurring'
            ? recurringTransactions.find((rule) => rule.id === allocation.source_id) || null
            : null,
      });

      return {
        id: getSourceRowKey(allocation),
        name:
          allocation.label ||
          (sourceType === 'goal' ? 'Savings goal' : 'Recurring item'),
        planned,
        tracked,
        remaining: planned - tracked,
        color:
          allocation.color ||
          tab.shades[(index + 3) % tab.shades.length] ||
          tab.color,
        icon: allocation.icon || (sourceType === 'goal' ? 'target' : 'receipt'),
        sourceType,
        budgetType: activeTab,
      };
    })
    .filter((item) => item.planned > 0 || item.tracked > 0);

  const sectionCategories = categories.filter(
    (category) => getPlanCategoryType(category, categories) === activeTab && !category.parent_id
  );

  const categoryRows = sectionCategories
    .map((category, index) => {
      const childCategories = subcategories.filter(
        (subcategory) => subcategory.parent_id === category.id
      );

      const planned =
        childCategories.length > 0
          ? childCategories.reduce(
              (sum, child) =>
                sum + getRegularPlannedForCategoryFromAllocations(allocations, child.id),
              0
            )
          : getRegularPlannedForCategoryFromAllocations(allocations, category.id);

      const tracked =
        childCategories.length > 0
          ? childCategories.reduce(
              (sum, child) =>
                sum + getTrackedForCategory({ transactions, categoryId: child.id }),
              0
            )
          : getTrackedForCategory({ transactions, categoryId: category.id });

      return {
        id: category.id,
        name: category.name,
        category,
        planned,
        tracked,
        remaining: planned - tracked,
        color: tab.shades[index % tab.shades.length],
        categoryColor: category.color,
        icon: category.icon,
      };
    })
    .filter((item) => item.planned > 0 || item.tracked > 0);

  const chartData = [...categoryRows, ...extraPlanRows];

  const totalTracked = chartData.reduce(
    (sum, item) => sum + Number(item.tracked || 0),
    0
  );
  const totalPlanned = chartData.reduce(
    (sum, item) => sum + Number(item.planned || 0),
    0
  );
  const totalRemaining = totalPlanned - totalTracked;
  const progress =
    totalPlanned > 0 ? (totalTracked / totalPlanned) * 100 : totalTracked > 0 ? 100 : 0;

  const donutChartData = buildDonutChartData({ activeTab, chartData, tab });

  return {
    chartData,
    categoryRows,
    sourceRows: extraPlanRows,
    donutChartData,
    totalTracked,
    totalPlanned,
    totalRemaining,
    progress,
  };
}

function hexToRgba(hex, alpha = 0.28) {
  if (!hex || typeof hex !== 'string') return `rgba(148, 163, 184, ${alpha})`;

  const normalized = hex.replace('#', '').trim();

  if (![3, 6].includes(normalized.length)) {
    return hex;
  }

  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  const red = parseInt(fullHex.slice(0, 2), 16);
  const green = parseInt(fullHex.slice(2, 4), 16);
  const blue = parseInt(fullHex.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return hex;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getMutedRemainderColor(tab) {
  const shades = Array.isArray(tab?.shades) ? tab.shades : [];
  const lightestShade = shades[shades.length - 1] || tab?.color || '#94A3B8';

  return hexToRgba(lightestShade, 0.34);
}

export function buildDonutChartData({ activeTab, chartData = [], tab }) {
  const totalPlanned = chartData.reduce(
    (sum, item) => sum + Number(item.planned || 0),
    0
  );
  const totalTracked = chartData.reduce(
    (sum, item) => sum + Number(item.tracked || 0),
    0
  );

  if (totalPlanned <= 0 && totalTracked <= 0) {
    return [
      {
        id: `${activeTab}-empty`,
        name: 'No data',
        value: 1,
        tracked: 0,
        planned: 0,
        remaining: 0,
        color: '#E5E7EB',
        isEmpty: true,
      },
    ];
  }

  const trackedItems = [...chartData]
    .filter((item) => Number(item.tracked || 0) > 0)
    .sort((a, b) => Number(b.tracked || 0) - Number(a.tracked || 0));

  const trackedSlices = trackedItems.slice(0, 4).map((item, index) => ({
    ...item,
    color: tab.shades?.[index] || tab.color || item.color,
    value: Number(item.tracked || 0),
  }));

  const others = trackedItems.slice(4);
  const othersTracked = others.reduce(
    (sum, item) => sum + Number(item.tracked || 0),
    0
  );
  const othersPlanned = others.reduce(
    (sum, item) => sum + Number(item.planned || 0),
    0
  );

  if (othersTracked > 0) {
    trackedSlices.push({
      id: `${activeTab}-others`,
      name: 'Others',
      planned: othersPlanned,
      tracked: othersTracked,
      remaining: othersPlanned - othersTracked,
      color: tab.shades?.[4] || tab.color,
      value: othersTracked,
      isOthers: true,
    });
  }

  const untracked = Math.max(totalPlanned - totalTracked, 0);

  if (untracked > 0) {
    trackedSlices.push({
      id: `${activeTab}-untracked`,
      name: 'Untracked',
      planned: untracked,
      tracked: 0,
      remaining: untracked,
      color: getMutedRemainderColor(tab),
      value: untracked,
      isRemainder: true,
    });
  }

  if (trackedSlices.length > 0) return trackedSlices;

  return [
    {
      id: `${activeTab}-empty`,
      name: 'No tracked data',
      value: 1,
      tracked: 0,
      planned: totalPlanned,
      remaining: totalPlanned,
      color: getMutedRemainderColor(tab),
      isRemainder: true,
    },
  ];
}

export function buildPlanTotals({
  allocations = [],
  categories = [],
  savingsGoals = [],
  recurringTransactions = [],
  allTransactions = [],
  transactions = [],
  currentMonth,
} = {}) {
  const totals = {
    income: 0,
    expense: 0,
    savings: 0,
    debt: 0,
  };

  const authoritativeAllocations = buildAuthoritativeScheduledAllocations({
    recurringTransactions,
    savingsGoals,
    allocations,
    currentMonth,
    allTransactions,
  });

  authoritativeAllocations.forEach((allocation) => {
    const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
    if (sourceType !== 'category') return;

    let type = allocation.budget_type ? normalizePlanType(allocation.budget_type) : null;

    if (!type && allocation.category_id) {
      const category = categories.find((item) => item.id === allocation.category_id);
      type = getPlanCategoryType(category, categories);
    }

    if (!type || !Object.prototype.hasOwnProperty.call(totals, type)) return;

    totals[type] += Number(allocation.planned_amount || 0);
  });

  const savedSourceAllocations = dedupeSourceAllocations(authoritativeAllocations);
  const suggestedGoalAllocations = buildSuggestedGoalAllocations({
    savingsGoals,
    sourceAllocations: savedSourceAllocations,
    currentMonth,
  });

  [...savedSourceAllocations, ...suggestedGoalAllocations].forEach((allocation) => {
    const type = normalizePlanType(allocation.budget_type);
    if (!Object.prototype.hasOwnProperty.call(totals, type)) return;

    totals[type] += Number(allocation.planned_amount || 0);
  });

  const fundedDebtPayments = getFundedDebtPaymentTotal(transactions);
  const assignableDebt = getAssignablePlannedDebt(totals.debt, fundedDebtPayments);

  return {
    ...totals,
    fundedDebtPayments,
    assignableDebt,
    leftToAllocate: calculateLeftToAllocateFromTotals({
      ...totals,
      fundedDebtPayments,
    }),
  };
}
