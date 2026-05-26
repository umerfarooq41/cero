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

export function getTrackedForSource({ transactions = [], sourceType, sourceId, categoryId }) {
  const normalizedSourceType = normalizeSourceType(sourceType);

  return transactions.reduce((sum, transaction) => {
    if (normalizedSourceType === 'goal') {
      return getTransactionGoalId(transaction) === sourceId
        ? sum + getTransactionAmount(transaction)
        : sum;
    }

    if (normalizedSourceType === 'recurring') {
      const matchesRule = sourceId && transaction.recurring_transaction_id === sourceId;
      const hasRecurringMarker = Boolean(
        transaction.recurring_transaction_id ||
          transaction.recurring_posted_for_date ||
          transaction.source_type === 'recurring'
      );

      const matchesCategoryGroup =
        categoryId && transaction.category_id === categoryId && hasRecurringMarker;

      return matchesRule || matchesCategoryGroup
        ? sum + getTransactionAmount(transaction)
        : sum;
    }

    return sum;
  }, 0);
}

export function getTrackedForCategory({ transactions = [], categoryId }) {
  return transactions
    .filter(
      (transaction) =>
        transaction.category_id === categoryId && !isSourceLinkedTransaction(transaction)
    )
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
}

export function buildPlanViewData({
  activeTab,
  categories = [],
  subcategories = [],
  allocations = [],
  transactions = [],
  tab,
}) {
  const sourceAllocations = dedupeSourceAllocations(allocations);

  const extraPlanRows = sourceAllocations
    .filter((allocation) => normalizePlanType(allocation.budget_type) === activeTab)
    .map((allocation, index) => {
      const planned = Number(allocation.planned_amount || 0);
      const sourceType = normalizeSourceType(getAllocationSourceType(allocation));
      const tracked = getTrackedForSource({
        transactions,
        sourceType,
        sourceId: allocation.source_id,
        categoryId: allocation.category_id,
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

export function buildPlanTotals({ allocations = [], categories = [] }) {
  const totals = {
    income: 0,
    expense: 0,
    savings: 0,
    debt: 0,
  };

  allocations.forEach((allocation) => {
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

  dedupeSourceAllocations(allocations).forEach((allocation) => {
    const type = normalizePlanType(allocation.budget_type);
    if (!Object.prototype.hasOwnProperty.call(totals, type)) return;

    totals[type] += Number(allocation.planned_amount || 0);
  });

  return totals;
}