-- Phase 1C: establish a non-destructive balance reconciliation checkpoint.
-- This does NOT edit accounts or transactions.
-- Baseline captures the historical ledger residual so future changes are checked
-- against movement SINCE the checkpoint rather than assuming zero opening balance.
BEGIN;
CREATE TABLE IF NOT EXISTS public.account_reconciliation_baselines (
  account_id uuid PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baseline_balance numeric NOT NULL,
  baseline_ledger_movement numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_reconciliation_baselines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS account_reconciliation_baselines_select_own ON public.account_reconciliation_baselines;
CREATE POLICY account_reconciliation_baselines_select_own
ON public.account_reconciliation_baselines FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.account_reconciliation_baselines FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.account_reconciliation_baselines TO authenticated;

-- One-time checkpoint for existing accounts. Existing checkpoints are never reset.
-- Run during a quiet period without concurrent posting.
WITH ledger AS (
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
INSERT INTO public.account_reconciliation_baselines
 (account_id,user_id,baseline_balance,baseline_ledger_movement)
SELECT id,user_id,balance,movement FROM ledger
ON CONFLICT (account_id) DO NOTHING;
COMMIT;

-- Report current drift relative to baseline; 0 = reconciled.
-- Run separately after the migration, and after posting test transactions.
WITH ledger AS (
 SELECT a.id,a.user_id,a.name,a.category,a.type,a.balance,
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
 GROUP BY a.id,a.user_id,a.name,a.category,a.type,a.balance
)
SELECT l.name,l.category,l.type,
 round(l.balance::numeric,2) AS current_balance,
 round((l.balance-b.baseline_balance)::numeric,2) AS balance_change,
 round((l.movement-b.baseline_ledger_movement)::numeric,2) AS ledger_change,
 round(((l.balance-b.baseline_balance)-(l.movement-b.baseline_ledger_movement))::numeric,2) AS discrepancy,
 CASE WHEN abs((l.balance-b.baseline_balance)-(l.movement-b.baseline_ledger_movement))<0.005
 THEN 'OK' ELSE 'REVIEW' END AS status
FROM ledger l JOIN public.account_reconciliation_baselines b
 ON b.account_id=l.id AND b.user_id=l.user_id
ORDER BY status DESC,l.name;
