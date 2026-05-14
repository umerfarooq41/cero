export function getBudgetMonth(date, settings = {}) {
  if (!date) return null;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const use25thRule =
    settings?.budgetLogic?.twentyFifthRule === true;

  const budgetDate = new Date(parsedDate);

  // If transaction happens on/after 25th,
  // assign it to next budget month
  if (use25thRule && budgetDate.getDate() >= 25) {
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
  return (
    getBudgetMonth(transaction?.date, settings) === month
  );
}

export function filterTransactionsByBudgetMonth(
  transactions = [],
  month,
  settings = {}
) {
  return transactions.filter((transaction) =>
    isTransactionInBudgetMonth(transaction, month, settings)
  );
}

export function getNextBudgetMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);

  const date = new Date(year, monthNumber - 1);

  date.setMonth(date.getMonth() + 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

export function getPreviousBudgetMonth(month) {
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