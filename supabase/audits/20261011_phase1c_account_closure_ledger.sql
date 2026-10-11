-- Phase 1C: account closure ledger audit (read-only).
SELECT
  type,
  source_type,
  note,
  count(*) AS records,
  count(*) FILTER (WHERE account_id IS NULL) AS missing_source,
  count(*) FILTER (WHERE to_account_id IS NULL) AS missing_destination,
  count(*) FILTER (WHERE account_name_snapshot IS NOT NULL) AS source_name_preserved,
  count(*) FILTER (WHERE to_account_name_snapshot IS NOT NULL) AS destination_name_preserved,
  sum(amount) AS total_amount
FROM public.transactions
WHERE note IN ('Account closure','Liability account closure')
GROUP BY type,source_type,note
ORDER BY note,type;

-- Review any transfer with missing account references.
SELECT
  coalesce(note,'<no note>') AS note,
  coalesce(source_type,'<null>') AS source_type,
  count(*) AS records,
  count(*) FILTER (WHERE account_id IS NULL) AS missing_source,
  count(*) FILTER (WHERE to_account_id IS NULL) AS missing_destination,
  count(*) FILTER (WHERE account_name_snapshot IS NOT NULL) AS source_name_preserved,
  count(*) FILTER (WHERE to_account_name_snapshot IS NOT NULL) AS destination_name_preserved
FROM public.transactions
WHERE type='transfer' AND (account_id IS NULL OR to_account_id IS NULL)
GROUP BY note,source_type
ORDER BY records DESC,note;
