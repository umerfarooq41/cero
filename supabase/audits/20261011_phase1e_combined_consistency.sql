-- Phase 1E combined read-only audit: one result table in Supabase.
WITH recurring AS (
 SELECT r.id,r.user_id,r.type,r.payment_mode,r.amount,r.total_amount,r.start_date,
 r.next_due_date,r.is_active,r.completed_at,coalesce(sum(t.amount),0) posted_total
 FROM public.recurring_transactions r
 LEFT JOIN public.transactions t ON t.recurring_transaction_id=r.id AND t.user_id=r.user_id
 GROUP BY r.id
), goals AS (
 SELECT g.id,g.user_id,g.target_amount,g.starting_amount,g.current_amount,
 g.completed_at,coalesce(sum(c.amount),0) contributed
 FROM public.savings_goals g
 LEFT JOIN public.goal_contributions c ON c.goal_id=g.id AND c.user_id=g.user_id
 GROUP BY g.id
), movements AS (
 SELECT a.id,a.user_id,
 coalesce(sum(CASE WHEN t.account_id=a.id THEN
 CASE WHEN t.type='income' THEN CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END
 ELSE CASE WHEN a.category='liability' THEN t.amount ELSE -t.amount END END ELSE 0 END),0)
 +coalesce(sum(CASE WHEN t.to_account_id=a.id AND t.type='transfer'
 THEN CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END ELSE 0 END),0) movement
 FROM public.accounts a LEFT JOIN public.transactions t ON t.user_id=a.user_id
 AND (t.account_id=a.id OR (t.to_account_id=a.id AND t.type='transfer'))
 GROUP BY a.id
)
SELECT 'Recurring rules' AS check_name,count(*)::bigint AS result FROM recurring
UNION ALL SELECT 'Missing recurring start dates',count(*) FROM recurring WHERE start_date IS NULL
UNION ALL SELECT 'Next due before start',count(*) FROM recurring WHERE next_due_date<start_date
UNION ALL SELECT 'Overpaid debts',count(*) FROM recurring WHERE type='transfer' AND total_amount>0 AND posted_total>total_amount+0.005
UNION ALL SELECT 'Completed recurring still active',count(*) FROM recurring WHERE completed_at IS NOT NULL AND is_active
UNION ALL SELECT 'Fully paid debts still active',count(*) FROM recurring WHERE type='transfer' AND total_amount>0 AND posted_total>=total_amount-0.005 AND is_active
UNION ALL SELECT 'Duplicate fixed recurring installments',count(*) FROM (
 SELECT t.user_id,t.recurring_transaction_id,t.recurring_posted_for_date FROM public.transactions t
 JOIN public.recurring_transactions r ON r.id=t.recurring_transaction_id AND r.user_id=t.user_id
 WHERE coalesce(r.payment_mode,'fixed')='fixed' AND r.type<>'income' AND t.recurring_posted_for_date IS NOT NULL
 GROUP BY 1,2,3 HAVING count(*)>1
) x
UNION ALL SELECT 'Recurring payments missing installment date',count(*) FROM public.transactions WHERE recurring_transaction_id IS NOT NULL AND recurring_posted_for_date IS NULL
UNION ALL SELECT 'Goals checked',count(*) FROM goals
UNION ALL SELECT 'Goal progress mismatches',count(*) FROM goals WHERE abs(current_amount-least(target_amount,greatest(0,coalesce(starting_amount,0)+contributed)))>0.01
UNION ALL SELECT 'Overfunded goals',count(*) FROM goals WHERE current_amount>target_amount+0.005
UNION ALL SELECT 'Completed goals underfunded',count(*) FROM goals WHERE completed_at IS NOT NULL AND current_amount<target_amount-0.005
UNION ALL SELECT 'Contribution transaction mismatches',count(*) FROM public.goal_contributions c JOIN public.transactions t ON t.id=c.transaction_id AND t.user_id=c.user_id WHERE abs(c.amount-t.amount)>0.005 OR c.contribution_date IS DISTINCT FROM t.date
UNION ALL SELECT 'Duplicate fixed goal installments',count(*) FROM (
 SELECT c.user_id,c.goal_id,c.occurrence_key FROM public.goal_contributions c
 JOIN public.savings_goals g ON g.id=c.goal_id AND g.user_id=c.user_id
 WHERE coalesce(g.contribution_mode,'flexible')='fixed' AND c.occurrence_key IS NOT NULL
 GROUP BY 1,2,3 HAVING count(*)>1
) x
UNION ALL SELECT 'Nonpositive linked payment amounts',count(*) FROM public.transactions WHERE (recurring_transaction_id IS NOT NULL OR savings_goal_id IS NOT NULL) AND amount<=0
UNION ALL SELECT 'Accounts checked',count(*) FROM public.accounts a JOIN public.account_reconciliation_baselines b ON b.account_id=a.id AND b.user_id=a.user_id JOIN movements m ON m.id=a.id AND m.user_id=a.user_id
UNION ALL SELECT 'Account balance discrepancies',count(*) FROM public.accounts a JOIN public.account_reconciliation_baselines b ON b.account_id=a.id AND b.user_id=a.user_id JOIN movements m ON m.id=a.id AND m.user_id=a.user_id WHERE abs(a.balance-(b.baseline_balance+(m.movement-b.baseline_ledger_movement)))>0.01;