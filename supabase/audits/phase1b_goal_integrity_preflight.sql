-- Phase 1B goal integrity preflight (READ ONLY).
-- Run before changing savings-goal write permissions.
SELECT
  g.id, g.name, g.user_id,
  g.starting_amount, g.current_amount,
  COALESCE(SUM(gc.amount),0) AS recorded_contributions,
  g.starting_amount + COALESCE(SUM(gc.amount),0) AS naive_total,
  g.current_amount - (g.starting_amount + COALESCE(SUM(gc.amount),0)) AS difference
FROM public.savings_goals g
LEFT JOIN public.goal_contributions gc
  ON gc.goal_id = g.id AND gc.user_id = g.user_id
GROUP BY g.id, g.name, g.user_id, g.starting_amount, g.current_amount
ORDER BY ABS(g.current_amount - (g.starting_amount + COALESCE(SUM(gc.amount),0))) DESC;
-- Differences may be legitimate (fund usage, reversals, transfers).
-- Do NOT automatically overwrite current_amount based on this diagnostic.

SELECT
  COUNT(*) FILTER (WHERE a.id IS NULL AND g.from_account_id IS NOT NULL) AS missing_source_accounts,
  COUNT(*) FILTER (WHERE b.id IS NULL AND g.to_account_id IS NOT NULL) AS missing_destination_accounts,
  COUNT(*) FILTER (WHERE a.id IS NOT NULL AND a.user_id <> g.user_id) AS cross_user_source_accounts,
  COUNT(*) FILTER (WHERE b.id IS NOT NULL AND b.user_id <> g.user_id) AS cross_user_destination_accounts
FROM public.savings_goals g
LEFT JOIN public.accounts a ON a.id=g.from_account_id
LEFT JOIN public.accounts b ON b.id=g.to_account_id;

SELECT
  COUNT(*) AS orphaned_or_cross_user_contributions
FROM public.goal_contributions gc
LEFT JOIN public.savings_goals g ON g.id=gc.goal_id
WHERE g.id IS NULL OR gc.user_id <> g.user_id;
