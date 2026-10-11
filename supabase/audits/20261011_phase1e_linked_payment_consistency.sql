-- Phase 1E: read-only consistency audit after linked-payment editing.
-- No INSERT, UPDATE, DELETE or schema changes.
WITH recurring AS (
 SELECT r.id,r.user_id,r.name,r.type,r.payment_mode,r.amount,r.total_amount,
        r.start_date,r.next_due_date,r.is_active,r.completed_at,
        coalesce(sum(t.amount),0) AS posted_total,
        count(t.id) AS payment_count
 FROM public.recurring_transactions r
 LEFT JOIN public.transactions t ON t.recurring_transaction_id=r.id AND t.user_id=r.user_id
 GROUP BY r.id
)
SELECT
 count(*) AS recurring_rules,
 count(*) FILTER (WHERE start_date IS NULL) AS missing_start_dates,
 count(*) FILTER (WHERE next_due_date<start_date) AS next_due_before_start,
 count(*) FILTER (WHERE type='transfer' AND total_amount>0 AND posted_total>total_amount+0.005) AS overpaid_debts,
 count(*) FILTER (WHERE completed_at IS NOT NULL AND is_active) AS completed_but_active,
 count(*) FILTER (WHERE type='transfer' AND total_amount>0 AND posted_total>=total_amount-0.005 AND is_active) AS fully_paid_still_active
FROM recurring;

SELECT count(*) AS fixed_recurring_duplicate_occurrences
FROM (
 SELECT t.user_id,t.recurring_transaction_id,t.recurring_posted_for_date
 FROM public.transactions t
 JOIN public.recurring_transactions r ON r.id=t.recurring_transaction_id AND r.user_id=t.user_id
 WHERE coalesce(r.payment_mode,'fixed')='fixed' AND r.type<>'income'
   AND t.recurring_posted_for_date IS NOT NULL
 GROUP BY 1,2,3 HAVING count(*)>1
) x;

SELECT count(*) AS recurring_transactions_without_occurrence
FROM public.transactions t
WHERE t.recurring_transaction_id IS NOT NULL AND t.recurring_posted_for_date IS NULL;

WITH goal_totals AS (
 SELECT g.id,g.user_id,g.target_amount,g.starting_amount,g.current_amount,
        g.contribution_mode,g.completed_at,g.next_due_date,
        coalesce(sum(c.amount),0) AS contributed
 FROM public.savings_goals g
 LEFT JOIN public.goal_contributions c ON c.goal_id=g.id AND c.user_id=g.user_id
 GROUP BY g.id
)
SELECT count(*) AS goals_checked,
 count(*) FILTER (WHERE abs(current_amount-least(target_amount,greatest(0,coalesce(starting_amount,0)+contributed)))>0.01) AS progress_mismatches,
 count(*) FILTER (WHERE current_amount>target_amount+0.005) AS overfunded_goals,
 count(*) FILTER (WHERE completed_at IS NOT NULL AND current_amount<target_amount-0.005) AS completed_but_underfunded
FROM goal_totals;

SELECT count(*) AS contribution_transaction_amount_mismatches
FROM public.goal_contributions c
JOIN public.transactions t ON t.id=c.transaction_id AND t.user_id=c.user_id
WHERE abs(c.amount-t.amount)>0.005 OR c.contribution_date IS DISTINCT FROM t.date;

SELECT count(*) AS fixed_goal_duplicate_occurrences
FROM (
 SELECT c.user_id,c.goal_id,c.occurrence_key
 FROM public.goal_contributions c
 JOIN public.savings_goals g ON g.id=c.goal_id AND g.user_id=c.user_id
 WHERE coalesce(g.contribution_mode,'flexible')='fixed' AND c.occurrence_key IS NOT NULL
 GROUP BY 1,2,3 HAVING count(*)>1
) x;

SELECT count(*) AS linked_transaction_nonpositive_amounts
FROM public.transactions
WHERE (recurring_transaction_id IS NOT NULL OR savings_goal_id IS NOT NULL) AND amount<=0;

-- Final balance baseline audit (expected discrepancies: zero).
WITH ledger AS (
 SELECT a.id,a.user_id,
 coalesce(sum(CASE WHEN t.account_id=a.id THEN
   CASE WHEN t.type='income' THEN CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END
   ELSE CASE WHEN a.category='liability' THEN t.amount ELSE -t.amount END END
 ELSE 0 END),0)
 +coalesce(sum(CASE WHEN t.to_account_id=a.id AND t.type='transfer' THEN
   CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END ELSE 0 END),0) AS movement
 FROM public.accounts a
 LEFT JOIN public.transactions t ON t.user_id=a.user_id
  AND (t.account_id=a.id OR (t.to_account_id=a.id AND t.type='transfer'))
 GROUP BY a.id
)
SELECT count(*) AS accounts_checked,
 count(*) FILTER (WHERE abs(a.balance-(b.baseline_balance+(l.movement-b.baseline_ledger_movement)))>0.01) AS balance_discrepancies
FROM public.accounts a
JOIN public.account_reconciliation_baselines b ON b.account_id=a.id AND b.user_id=a.user_id
JOIN ledger l ON l.id=a.id AND l.user_id=a.user_id;