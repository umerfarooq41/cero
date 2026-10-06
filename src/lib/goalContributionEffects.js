import { supabase } from '@/lib/supabase';
import { todayIsoDate } from '@/lib/goals';
import { invalidateScheduledQueries } from '@/lib/queryInvalidation';

function safeAmount(value) {
  return Math.max(0, Number(value || 0));
}

export async function postGoalContribution({
  goal,
  amount,
  date,
  note,
}) {
  if (!goal?.id) {
    throw new Error('Goal not found');
  }

  const isFixed = (goal.contribution_mode || 'flexible') === 'fixed';
  const contributionAmount = safeAmount(amount);

  if (!isFixed && !contributionAmount) {
    throw new Error('Enter a valid contribution amount');
  }

  if (!goal.from_account_id || !goal.to_account_id) {
    throw new Error('This goal is missing its from/to accounts');
  }

  if (goal.from_account_id === goal.to_account_id) {
    throw new Error('Goal from/to accounts must be different');
  }

  const contributionDate = date || todayIsoDate();
  const contributionNote = note || `Contribution to ${goal.name}`;
  const postedForDate = isFixed
    ? (goal.next_due_date || goal.start_date || null)
    : null;

  const { data: transactionId, error } = await supabase.rpc(
    'cero_post_goal_contribution',
    {
      p_goal_id: goal.id,
      p_amount: isFixed ? null : contributionAmount,
      p_contribution_date: contributionDate,
      p_posted_for_date: postedForDate,
      p_note: contributionNote,
    }
  );

  if (error) {
    throw error;
  }

  return {
    transaction: transactionId ? { id: transactionId } : null,
  };
}

export function invalidateGoalContributionQueries(queryClient) {
  if (!queryClient) return;

  invalidateScheduledQueries(queryClient);
  queryClient.invalidateQueries({ queryKey: ['manage-savings-goals'] });
}
