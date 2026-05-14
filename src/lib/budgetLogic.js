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
