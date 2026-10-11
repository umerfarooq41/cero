-- Phase 1C legacy opening balance triage; read-only, no account identifiers exposed.
WITH ledger AS (
 SELECT a.id,a.user_id,a.name,a.category,a.type,a.balance,a.created_at,
  count(t.id) AS transactions,
  count(t.id) FILTER (WHERE t.source_type='adjustment') AS adjustment_count,
  coalesce(sum(
    CASE WHEN t.account_id=a.id THEN
      CASE WHEN t.type='income' THEN CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END
      ELSE CASE WHEN a.category='liability' THEN t.amount ELSE -t.amount END END
    ELSE 0 END
    + CASE WHEN t.type='transfer' AND t.to_account_id=a.id THEN
      CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END ELSE 0 END
  ),0) AS movement
 FROM public.accounts a LEFT JOIN public.transactions t
 ON t.user_id=a.user_id AND (t.account_id=a.id OR (t.type='transfer' AND t.to_account_id=a.id))
 GROUP BY a.id,a.user_id,a.name,a.category,a.type,a.balance,a.created_at
)
SELECT name,category,type,created_at::date AS created_date,transactions,adjustment_count,
 round(balance::numeric,2) AS stored_balance,
 round(movement::numeric,2) AS recorded_movement,
 round((balance-movement)::numeric,2) AS unexplained_baseline,
 CASE WHEN transactions=0 THEN 'NO TRANSACTIONS: opening balance candidate'
 WHEN adjustment_count>0 THEN 'HAS ADJUSTMENTS: review historical baseline'
 ELSE 'LEGACY BASELINE OR UNTRACKED CHANGE: investigate'
 END AS interpretation
FROM ledger
WHERE abs(balance-movement)>=0.005
ORDER BY abs(balance-movement) DESC,name;