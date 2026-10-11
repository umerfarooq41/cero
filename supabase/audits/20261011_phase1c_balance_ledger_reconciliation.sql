-- Phase 1C: read-only balance ledger reconciliation.
-- Reconstructs transaction movement using the same asset/liability signs as the transaction RPC.
-- The residual is NOT automatically an error: it can include opening balances,
-- legacy adjustments, account-closure transfers, or historical migrations.
WITH movement AS (
 SELECT a.id, a.user_id, a.name, a.category, a.type, a.balance,
        t.id AS transaction_id,
        CASE
          WHEN t.account_id=a.id THEN
            CASE WHEN t.type='income' THEN
              CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END
            ELSE CASE WHEN a.category='liability' THEN t.amount ELSE -t.amount END END
          ELSE 0 END
        + CASE WHEN t.type='transfer' AND t.to_account_id=a.id THEN
          CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END
          ELSE 0 END AS ledger_delta
 FROM public.accounts a
 LEFT JOIN public.transactions t
   ON t.user_id=a.user_id
  AND (t.account_id=a.id OR (t.type='transfer' AND t.to_account_id=a.id))
), rollup AS (
 SELECT id,user_id,name,category,type,balance,
        count(transaction_id) AS transaction_count,
        coalesce(sum(ledger_delta),0) AS ledger_movement
 FROM movement
 GROUP BY id,user_id,name,category,type,balance
)
SELECT name,category,type,transaction_count,
       round(balance::numeric,2) AS stored_balance,
       round(ledger_movement::numeric,2) AS ledger_movement,
       round((balance-ledger_movement)::numeric,2) AS implied_opening_or_untracked_balance
FROM rollup
ORDER BY abs(balance-ledger_movement) DESC,name;

-- Summary only: no assumption that residual must be zero.
WITH movements AS (
 SELECT a.id,a.user_id,a.balance,
  coalesce(sum(
   CASE WHEN t.account_id=a.id THEN
     CASE WHEN t.type='income' THEN CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END
          ELSE CASE WHEN a.category='liability' THEN t.amount ELSE -t.amount END END
   ELSE 0 END
   + CASE WHEN t.type='transfer' AND t.to_account_id=a.id THEN
      CASE WHEN a.category='liability' THEN -t.amount ELSE t.amount END ELSE 0 END
  ),0) AS movement
 FROM public.accounts a
 LEFT JOIN public.transactions t ON t.user_id=a.user_id
 AND (t.account_id=a.id OR (t.type='transfer' AND t.to_account_id=a.id))
 GROUP BY a.id,a.user_id,a.balance
)
SELECT count(*) AS accounts,
 count(*) FILTER (WHERE abs(balance-movement)<0.005) AS zero_residual_accounts,
 count(*) FILTER (WHERE abs(balance-movement)>=0.005) AS nonzero_residual_accounts,
 round(sum(abs(balance-movement))::numeric,2) AS total_absolute_residual
FROM movements;