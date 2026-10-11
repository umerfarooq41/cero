-- Phase 1F: read-only lifecycle inspection; one results table.
-- No financial data is modified.
WITH goal_amounts AS (
 SELECT g.id,g.name,g.contribution_mode,g.target_amount,g.current_amount,
        coalesce(g.starting_amount,0) AS starting_amount,
        coalesce(sum(c.amount),0) AS contributions
 FROM public.savings_goals g
 LEFT JOIN public.goal_contributions c ON c.goal_id=g.id AND c.user_id=g.user_id
 WHERE g.user_id=auth.uid()
 GROUP BY g.id
), recurring_amounts AS (
 SELECT r.id,r.name,r.type,r.payment_mode,r.amount,r.total_amount,
        r.next_due_date,r.start_date,r.is_active,r.completed_at,
        coalesce(sum(t.amount),0) AS total_posted
 FROM public.recurring_transactions r
 LEFT JOIN public.transactions t ON t.recurring_transaction_id=r.id AND t.user_id=r.user_id
 WHERE r.user_id=auth.uid()
 GROUP BY r.id
)
SELECT 'Goal: '||name AS item,
       coalesce(contribution_mode,'flexible') AS mode,
       'goal_progress' AS check_type,
       target_amount AS planned,
       starting_amount+contributions AS posted,
       current_amount AS displayed,
       least(target_amount,greatest(0,starting_amount+contributions)) AS expected,
       current_amount-least(target_amount,greatest(0,starting_amount+contributions)) AS difference,
       CASE WHEN abs(current_amount-least(target_amount,greatest(0,starting_amount+contributions)))>0.01
         THEN 'REVIEW' ELSE 'OK' END AS status
FROM goal_amounts
UNION ALL
SELECT 'Recurring: '||name,coalesce(payment_mode,'fixed'),'debt_total',
       total_amount,total_posted,NULL::numeric,NULL::numeric,
       CASE WHEN total_amount>0 AND total_posted>total_amount+0.005 THEN total_posted-total_amount ELSE 0 END,
       CASE WHEN total_amount>0 AND total_posted>total_amount+0.005 THEN 'REVIEW' ELSE 'OK' END
FROM recurring_amounts WHERE type='transfer' AND total_amount IS NOT NULL
ORDER BY status DESC,item;