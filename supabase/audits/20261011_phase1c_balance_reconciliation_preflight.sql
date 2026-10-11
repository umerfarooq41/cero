-- Phase 1C: read-only balance reconciliation preflight.
-- Group transaction types and provenance before calculating account balances.
SELECT
  coalesce(type,'<null>') AS transaction_type,
  coalesce(source_type,'<null>') AS source_type,
  count(*) AS rows,
  count(*) FILTER (WHERE amount<=0) AS non_positive,
  count(*) FILTER (WHERE account_id IS NULL) AS missing_source_account,
  count(*) FILTER (WHERE to_account_id IS NOT NULL) AS has_destination_account,
  count(*) FILTER (WHERE account_id=to_account_id AND account_id IS NOT NULL) AS same_account_transfer,
  sum(amount) AS total_amount
FROM public.transactions
GROUP BY type,source_type
ORDER BY type,source_type;

-- Account categories and balances, without disclosing account names.
SELECT
  coalesce(category,'<null>') AS account_category,
  coalesce(type,'<null>') AS account_type,
  count(*) AS account_count,
  count(*) FILTER (WHERE balance IS NULL) AS null_balances,
  count(*) FILTER (WHERE balance<0) AS negative_balances
FROM public.accounts
GROUP BY category,type
ORDER BY category,type;

-- Duplicate recurring occurrence keys (should normally be none).
SELECT count(*) AS duplicate_recurring_occurrence_groups
FROM (
 SELECT user_id, recurring_transaction_id, recurring_occurrence_key
 FROM public.transactions
 WHERE recurring_transaction_id IS NOT NULL AND recurring_occurrence_key IS NOT NULL
 GROUP BY user_id,recurring_transaction_id,recurring_occurrence_key
 HAVING count(*)>1
) d;
