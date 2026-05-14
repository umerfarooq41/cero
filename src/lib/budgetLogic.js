export function isTwentyFifthRuleEnabled(settings = {}) {
  return (
    settings?.shift25th === true ||
    settings?.twentyFifthRule === true ||
    settings?.budgetLogic?.twentyFifthRule === true ||
    settings?.budget_logic?.twenty_fifth_rule === true
  );
}


export function isAutoSweepSurplusEnabled(settings = {}) {
  return (
    settings?.autoSweepSurplus === true ||
    settings?.auto_sweep === true ||
    settings?.budgetLogic?.autoSweepSurplus === true ||
    settings?.budget_logic?.auto_sweep_surplus === true
  );
}

export function getBudgetMonth(date, settings = {}) {
  if (!date) return null;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const budgetDate = new Date(parsedDate);

  // 25th Rule:
  // transactions dated on/after the 25th are assigned to next budget month.
  if (isTwentyFifthRuleEnabled(settings) && budgetDate.getDate() >= 25) {
    budgetDate.setMonth(budgetDate.getMonth() + 1);
  }

  const year = budgetDate.getFullYear();
  const month = String(budgetDate.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

export function isTransactionInBudgetMonth(
  transaction,
  month,
  settings = {}
) {
  return getBudgetMonth(transaction?.date, settings) === month;
}

export function filterTransactionsByBudgetMonth(
  transactions = [],
  month,
  settings = {}
) {
  if (!month) return transactions;

  return transactions.filter((transaction) =>
    isTransactionInBudgetMonth(transaction, month, settings)
  );
}

export function filterTransactionsByBudgetYear(
  transactions = [],
  year,
  settings = {}
) {
  if (!year) return transactions;

  return transactions.filter((transaction) =>
    getBudgetMonth(transaction?.date, settings)?.startsWith(`${year}-`)
  );
}

export function getNextBudgetMonth(month) {
  if (!month) return null;

  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1);

  date.setMonth(date.getMonth() + 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

export function getPreviousBudgetMonth(month) {
  if (!month) return null;

  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1);

  date.setMonth(date.getMonth() - 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

export function calculateMonthSurplus({
  plannedExpenses = 0,
  actualExpenses = 0,
}) {
  return Math.max(
    0,
    Number(plannedExpenses) - Number(actualExpenses)
  );
}

export function getCurrentBudgetMonth(settings = {}, date = new Date()) {
  return getBudgetMonth(date, settings);
}



export function getBudgetMonthCloseDate(month, settings = {}) {
  if (!month) return null;

  const [year, monthNumber] = month.split('-').map(Number);

  if (!year || !monthNumber) return null;

  if (isTwentyFifthRuleEnabled(settings)) {
    return `${year}-${String(monthNumber).padStart(2, '0')}-24`;
  }

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function getAutoSweepMarker(month) {
  return `[AUTO_SWEEP:${month}]`;
}

export function isAutoSweepTransaction(transaction, month) {
  return String(transaction?.note || '').includes(getAutoSweepMarker(month));
}

export function hasAutoSweepForMonth(transactions = [], month) {
  return transactions.some((transaction) => isAutoSweepTransaction(transaction, month));
}

export function getCategoryType(categoryId, categories = []) {
  const category = categories.find((item) => item.id === categoryId);

  if (!category) return null;
  if (category.type) return category.type;

  const parent = categories.find((item) => item.id === category.parent_id);
  return parent?.type || null;
}

export function sumTransactionsByCategoryType(
  transactions = [],
  categories = [],
  type
) {
  return transactions
    .filter((transaction) => getCategoryType(transaction.category_id, categories) === type)
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
}

export function sumPlannedByCategoryType(
  allocations = [],
  categories = [],
  type
) {
  return allocations
    .filter((allocation) => getCategoryType(allocation.category_id, categories) === type)
    .reduce((sum, allocation) => sum + (Number(allocation.planned_amount) || 0), 0);
}

export function calculateAutoSweepSurplus({
  transactions = [],
  allocations = [],
  categories = [],
}) {
  const trackedIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const trackedExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const trackedSavings = sumTransactionsByCategoryType(
    transactions,
    categories,
    'savings'
  );

  const trackedDebt = sumTransactionsByCategoryType(
    transactions,
    categories,
    'debt'
  );

  const plannedExpenses = sumPlannedByCategoryType(
    allocations,
    categories,
    'expense'
  );

  const unusedExpenseBudget = Math.max(0, plannedExpenses - trackedExpenses);
  const availableCashSurplus = Math.max(
    0,
    trackedIncome - trackedExpenses - trackedSavings - trackedDebt
  );

  return Math.min(unusedExpenseBudget, availableCashSurplus);
}

export function findAutoSweepTargets(accounts = [], categories = [], amount = 0) {
  const activeAccounts = accounts.filter((account) => !account.is_archived);

  const destinationAccount =
    activeAccounts.find(
      (account) =>
        account.category !== 'liability' &&
        (account.type === 'savings' || account.account_type === 'savings')
    ) ||
    activeAccounts.find(
      (account) =>
        account.category !== 'liability' &&
        (account.type === 'investment' || account.account_type === 'investment')
    );

  const sourceCandidates = activeAccounts
    .filter((account) => account.category !== 'liability')
    .filter((account) => account.id !== destinationAccount?.id)
    .filter(
      (account) =>
        account.type !== 'savings' &&
        account.account_type !== 'savings' &&
        account.type !== 'investment' &&
        account.account_type !== 'investment'
    )
    .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));

  const sourceAccount =
    sourceCandidates.find((account) => (Number(account.balance) || 0) >= amount) ||
    sourceCandidates[0];

  const savingsCategory =
    categories.find((category) => category.type === 'savings' && !category.parent_id) ||
    categories.find((category) => category.type === 'savings');

  return {
    sourceAccount,
    destinationAccount,
    savingsCategory,
  };
}

