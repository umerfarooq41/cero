import { todayIsoDate } from '@/lib/goals';

export const COLORS = [
  '#276FE4',
  '#16AAFE',
  '#5FCEF3',
  '#18D1C8',
  '#1B8989',
  '#2898BB',
  '#8CBC95',
  '#9CB3C7',
  '#6F979F',
  '#54887C',
  '#72AA00',
  '#38C17D',
  '#3BA40E',
  '#634E4A',
  '#A85539',
  '#A58F85',
  '#EEB82D',
  '#FFB800',
  '#FF8B00',
  '#FF6D10',
  '#F84C00',
  '#FB2C2C',
  '#E40335',
  '#B1003B',
  '#E98ABE',
  '#F39AB5',
  '#FA5C8C',
  '#E33BA3',
  '#B393EA',
  '#8C7EF0',
  '#6970ED',
  '#8845F5',
];

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const emptyGoalForm = () => ({
  name: '',
  target_amount: '',
  current_amount: '',
  target_date: '',
  duration_count: '',
  frequency: 'monthly',
  start_date: todayIsoDate(),
  contribution_mode: 'flexible',
  from_account_id: 'none',
  to_account_id: 'none',
  icon_key: 'target',
  color_key: randomColor(),
  note: '',
});

function normalizeAccountType(value) {
  return String(value || '').toLowerCase();
}

function normalizeAccountCategory(value) {
  return String(value || '').toLowerCase();
}

export function isCheckingAccount(account) {
  return (
    normalizeAccountCategory(account?.category) === 'asset' &&
    normalizeAccountType(account?.type) === 'checking'
  );
}

export function isSavingsAccount(account) {
  return (
    normalizeAccountCategory(account?.category) === 'asset' &&
    normalizeAccountType(account?.type) === 'savings'
  );
}

export function getAccountLabel(account) {
  const type = String(account?.type || 'account').replace(/_/g, ' ');
  return `${account?.name || 'Account'} · ${type}`;
}

function getGoalTransactionGoalId(transaction) {
  return transaction?.savings_goal_id || transaction?.goal_id || null;
}

export function sumPostedGoalTransactionsByGoal(transactions = []) {
  return transactions.reduce((totals, transaction) => {
    const goalId = getGoalTransactionGoalId(transaction);

    if (!goalId || transaction?.type !== 'transfer') return totals;

    totals[goalId] = (totals[goalId] || 0) + Math.max(0, Number(transaction?.amount || 0));
    return totals;
  }, {});
}

export function getGoalCompletionDates(goals = [], transactions = []) {
  const transactionsByGoal = transactions.reduce((groups, transaction) => {
    const goalId = getGoalTransactionGoalId(transaction);
    if (!goalId || transaction?.type !== 'transfer') return groups;
    (groups[goalId] ||= []).push(transaction);
    return groups;
  }, {});

  return goals.reduce((dates, goal) => {
    const target = Math.max(0, Number(goal.target_amount || 0));
    if (target <= 0) return dates;

    const goalTransactions = [...(transactionsByGoal[goal.id] || [])]
      .sort((a, b) => String(a.date || a.created_at || '').localeCompare(String(b.date || b.created_at || '')));

    const postedTotal = goalTransactions.reduce(
      (sum, transaction) => sum + Math.max(0, Number(transaction.amount || 0)),
      0
    );
    const startingAmount = Math.max(
      0,
      Number(goal.starting_amount ?? (Number(goal.current_amount || 0) - postedTotal))
    );

    let funded = startingAmount;
    for (const transaction of goalTransactions) {
      funded += Math.max(0, Number(transaction.amount || 0));
      if (funded >= target) {
        dates[goal.id] = transaction.date || String(transaction.created_at || '').slice(0, 10);
        break;
      }
    }

    return dates;
  }, {});
}



