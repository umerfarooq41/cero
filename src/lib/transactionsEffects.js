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

async function reverseGoalProgress(transaction, savingsGoals = []) {
  if (!isGoalContributionTransaction(transaction)) return;

  const goalId = getTransactionGoalId(transaction);
  const amount = Math.max(0, Number(transaction?.amount || 0));

  if (goalId && amount > 0) {
    const goal = savingsGoals.find((item) => item.id === goalId);

    if (goal) {
      const startingAmount = Math.max(0, Number(goal.starting_amount ?? 0));
      const currentAmount = Math.max(0, Number(goal.current_amount || 0));

      await savingsGoalsApi.update(goalId, {
        current_amount: Math.max(startingAmount, currentAmount - amount),
      });
    }
  }

  if (transaction?.goal_contribution_id) {
    await goalContributionsApi.delete(transaction.goal_contribution_id);
  }
}

export async function deleteTransactionWithEffects({
  transaction,
  accounts = [],
  savingsGoals = [],
}) {
  if (!transaction?.id) {
    throw new Error('Transaction not found');
  }

  await reverseAccountBalances(transaction, accounts);
  await reverseGoalProgress(transaction, savingsGoals);
  await transactionsApi.delete(transaction.id);
}