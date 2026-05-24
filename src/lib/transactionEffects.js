import {
  accountsApi,
  goalContributionsApi,
  savingsGoalsApi,
  transactionsApi,
} from '@/lib/budgetData';

function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

export function getTransactionDeltas(transaction, accounts = []) {
  const deltas = {};
  const amount = Number(transaction?.amount) || 0;

  const source = accounts.find((account) => account.id === transaction?.account_id);
  const destination = accounts.find((account) => account.id === transaction?.to_account_id);

  if (source) {
    const sourceDelta =
      transaction?.type === 'income'
        ? source.category === 'liability'
          ? -amount
          : amount
        : source.category === 'liability'
          ? amount
          : -amount;

    addDelta(deltas, source.id, sourceDelta);
  }

  if (transaction?.type === 'transfer' && destination) {
    const destinationDelta = destination.category === 'liability' ? -amount : amount;
    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
}

export function isGoalContributionTransaction(transaction) {
  return Boolean(
    transaction?.savings_goal_id ||
      transaction?.goal_id ||
      transaction?.goal_contribution_id ||
      transaction?.source_type === 'goal' ||
      transaction?.source_type === 'savings_goal'
  );
}

function getTransactionGoalId(transaction) {
  return transaction?.savings_goal_id || transaction?.goal_id || null;
}

async function reverseAccountBalances(transaction, accounts = []) {
  const oldDeltas = getTransactionDeltas(transaction, accounts);

  await Promise.all(
    Object.entries(oldDeltas).map(([accountId, delta]) => {
      const account = accounts.find((item) => item.id === accountId);

      if (!account) return Promise.resolve();

      return accountsApi.update(accountId, {
        balance: (Number(account.balance) || 0) - delta,
      });
    })
  );
}

async function findGoalIdFromLinkedContribution(transaction) {
  if (!transaction?.goal_contribution_id && !transaction?.id) return null;

  const contributions = await goalContributionsApi.list();

  const linkedContribution = contributions.find((item) => {
    return (
      (transaction.goal_contribution_id && item.id === transaction.goal_contribution_id) ||
      (transaction.id && item.transaction_id === transaction.id)
    );
  });

  return linkedContribution?.goal_id || null;
}

async function deleteLinkedGoalContributions(transaction) {
  if (!transaction?.id && !transaction?.goal_contribution_id) return;

  const contributions = await goalContributionsApi.list();

  const linkedContributions = contributions.filter((item) => {
    return (
      (transaction.goal_contribution_id && item.id === transaction.goal_contribution_id) ||
      (transaction.id && item.transaction_id === transaction.id)
    );
  });

  await Promise.all(
    linkedContributions.map((contribution) => goalContributionsApi.delete(contribution.id))
  );
}

export async function recalculateGoalCurrentAmount(goalId, savingsGoals = []) {
  if (!goalId) return;

  const goals = savingsGoals.length ? savingsGoals : await savingsGoalsApi.list();
  const goal = goals.find((item) => item.id === goalId);

  if (!goal) return;

  const transactions = await transactionsApi.list();
  const postedTotal = transactions
    .filter((transaction) => {
      const transactionGoalId = getTransactionGoalId(transaction);
      return transactionGoalId === goalId && transaction.type === 'transfer';
    })
    .reduce((sum, transaction) => sum + Math.max(0, Number(transaction.amount || 0)), 0);

  const startingAmount = Math.max(0, Number(goal.starting_amount ?? 0));

  await savingsGoalsApi.update(goalId, {
    current_amount: startingAmount + postedTotal,
  });
}

export async function deleteTransactionWithEffects({
  transaction,
  accounts = [],
  savingsGoals = [],
}) {
  if (!transaction?.id) {
    throw new Error('Transaction not found');
  }

  const directGoalId = getTransactionGoalId(transaction);
  const linkedGoalId = directGoalId || (await findGoalIdFromLinkedContribution(transaction));

  await reverseAccountBalances(transaction, accounts);

  if (isGoalContributionTransaction(transaction) || linkedGoalId) {
    await deleteLinkedGoalContributions(transaction);
  }

  await transactionsApi.delete(transaction.id);

  if (linkedGoalId) {
    await recalculateGoalCurrentAmount(linkedGoalId, savingsGoals);
  }
}