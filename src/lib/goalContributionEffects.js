import {
  accountsApi,
  goalContributionsApi,
  transactionsApi,
} from '@/lib/budgetData';
import { getDefaultDebtCategory, getDefaultSavingsCategory } from '@/lib/goals';
import {
  getTransactionDeltas,
  recalculateGoalCurrentAmount,
} from '@/lib/transactionEffects';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function safeAmount(value) {
  return Math.max(0, Number(value || 0));
}

function isDebtAccount(account) {
  const category = String(account?.category || '').toLowerCase();
  const type = String(account?.type || '').toLowerCase();

  return (
    category === 'liability' ||
    category === 'debt' ||
    ['loan', 'credit_card', 'credit-card', 'creditcard', 'debt'].includes(type)
  );
}

async function applyAccountBalanceDeltas(transactionPayload, accounts = []) {
  const deltas = getTransactionDeltas(transactionPayload, accounts);

  await Promise.all(
    Object.entries(deltas).map(([accountId, delta]) => {
      const account = accounts.find((item) => item.id === accountId);

      if (!account) return Promise.resolve();

      return accountsApi.update(accountId, {
        balance: (Number(account.balance) || 0) + delta,
      });
    })
  );
}

async function createTransactionWithOptionalSourceType(payload) {
  try {
    return await transactionsApi.create(payload);
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    const shouldRetryWithoutSourceType =
      Object.prototype.hasOwnProperty.call(payload, 'source_type') &&
      (message.includes('source_type') ||
        message.includes('schema cache') ||
        message.includes('column') ||
        message.includes('could not find'));

    if (!shouldRetryWithoutSourceType) {
      throw error;
    }

    const { source_type: _sourceType, ...fallbackPayload } = payload;
    return transactionsApi.create(fallbackPayload);
  }
}

export async function postGoalContribution({
  goal,
  amount,
  date,
  note,
  accounts = [],
  categories = [],
  allocations = [],
  month,
}) {
  if (!goal?.id) {
    throw new Error('Goal not found');
  }

  const contributionAmount = safeAmount(amount);

  if (!contributionAmount) {
    throw new Error('Enter a valid contribution amount');
  }

  const fromAccount = accounts.find((account) => account.id === goal.from_account_id);
  const toAccount = accounts.find((account) => account.id === goal.to_account_id);

  if (!fromAccount || !toAccount) {
    throw new Error('This goal is missing its from/to accounts');
  }

  if (fromAccount.id === toAccount.id) {
    throw new Error('Goal from/to accounts must be different');
  }

  const contributionDate = date || todayIsoDate();
  const contributionNote = note || `Contribution to ${goal.name}`;
  const savingsCategory = getDefaultSavingsCategory(categories);

  const contribution = await goalContributionsApi.create({
    goal_id: goal.id,
    account_id: fromAccount.id,
    amount: contributionAmount,
    contribution_date: contributionDate,
    note: contributionNote,
  });

  const transactionPayload = {
    amount: contributionAmount,
    type: 'transfer',
    date: contributionDate,
    note: contributionNote,
    category_id: savingsCategory?.id || null,
    account_id: fromAccount.id,
    to_account_id: toAccount.id,
    savings_goal_id: goal.id,
    goal_contribution_id: contribution.id,
    source_type: 'goal',
  };

  const transaction = await createTransactionWithOptionalSourceType(transactionPayload);

  await applyAccountBalanceDeltas(transactionPayload, accounts);

  await goalContributionsApi.update(contribution.id, {
    transaction_id: transaction.id,
  });

  const updatedGoal = await recalculateGoalCurrentAmount(goal.id);

  return {
    contribution,
    transaction,
    updatedGoal,
  };
}

export async function postGoalFundUse({
  goal,
  amount,
  date,
  note,
  toAccountId,
  accounts = [],
  categories = [],
}) {
  if (!goal?.id) {
    throw new Error('Goal not found');
  }

  const useAmount = safeAmount(amount);

  if (!useAmount) {
    throw new Error('Enter a valid amount to use');
  }

  const availableAmount = safeAmount(goal.current_amount);

  if (useAmount > availableAmount) {
    throw new Error('Amount is higher than the saved goal balance');
  }

  const fromAccount = accounts.find((account) => account.id === goal.to_account_id);
  const toAccount = accounts.find((account) => account.id === toAccountId);

  if (!fromAccount) {
    throw new Error('This goal is missing its saved funds account');
  }

  if (!toAccount) {
    throw new Error('Select the debt account to pay');
  }

  if (!isDebtAccount(toAccount)) {
    throw new Error('Select a loan, credit card, or debt account');
  }

  if (fromAccount.id === toAccount.id) {
    throw new Error('From and to accounts must be different');
  }

  const useDate = date || todayIsoDate();
  const useNote = note || `Use ${goal.name} funds`;
  const debtCategory = getDefaultDebtCategory(categories);

  const contribution = await goalContributionsApi.create({
    goal_id: goal.id,
    account_id: fromAccount.id,
    amount: useAmount,
    contribution_date: useDate,
    note: useNote,
  });

  const transactionPayload = {
    amount: useAmount,
    type: 'transfer',
    date: useDate,
    note: useNote,
    category_id: debtCategory?.id || null,
    account_id: fromAccount.id,
    to_account_id: toAccount.id,
    savings_goal_id: goal.id,
    goal_contribution_id: contribution.id,
    source_type: 'goal_withdrawal',
  };

  const transaction = await createTransactionWithOptionalSourceType(transactionPayload);

  await applyAccountBalanceDeltas(transactionPayload, accounts);

  await goalContributionsApi.update(contribution.id, {
    transaction_id: transaction.id,
  });

  const updatedGoal = await recalculateGoalCurrentAmount(goal.id);

  return {
    contribution,
    transaction,
    updatedGoal,
  };
}

export function invalidateGoalContributionQueries(queryClient) {
  if (!queryClient) return;

  [
    ['transactions'],
    ['all-transactions'],
    ['accounts'],
    ['savings-goals'],
    ['manage-savings-goals'],
    ['goal-contributions'],
    ['allocations'],
    ['all-allocations'],
    ['budget-summary'],
  ].forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
