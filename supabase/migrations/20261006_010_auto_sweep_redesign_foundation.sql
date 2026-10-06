-- Auto-Sweep redesign: configuration and durable monthly decisions.
-- Safe to apply on production. Does not execute transfers.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS auto_sweep_source_account_id uuid,
  ADD COLUMN IF NOT EXISTS auto_sweep_destination_account_id uuid,
  ADD COLUMN IF NOT EXISTS auto_sweep_execution_mode text NOT NULL DEFAULT 'ask',
  ADD COLUMN IF NOT EXISTS auto_sweep_amount_mode text NOT NULL DEFAULT 'surplus',
  ADD COLUMN IF NOT EXISTS auto_sweep_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_sweep_minimum_balance numeric NOT NULL DEFAULT 0;

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_sweep_execution_valid;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_sweep_execution_valid
  CHECK (auto_sweep_execution_mode IN ('ask','automatic'));

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_sweep_amount_valid;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_sweep_amount_valid
  CHECK (auto_sweep_amount_mode IN ('surplus','fixed','percent')
    AND auto_sweep_value >= 0
    AND (auto_sweep_amount_mode <> 'percent' OR auto_sweep_value <= 100)
    AND auto_sweep_minimum_balance >= 0);

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_sweep_accounts_distinct;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_sweep_accounts_distinct
  CHECK (auto_sweep_source_account_id IS NULL
    OR auto_sweep_destination_account_id IS NULL
    OR auto_sweep_source_account_id <> auto_sweep_destination_account_id);

CREATE TABLE IF NOT EXISTS public.auto_sweep_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','skipped','completed','failed')),
  source_account_id uuid,
  destination_account_id uuid,
  proposed_amount numeric CHECK (proposed_amount IS NULL OR proposed_amount >= 0),
  posted_amount numeric CHECK (posted_amount IS NULL OR posted_amount >= 0),
  transaction_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE public.auto_sweep_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_sweep_decisions_select_own ON public.auto_sweep_decisions;
CREATE POLICY auto_sweep_decisions_select_own
ON public.auto_sweep_decisions FOR SELECT TO authenticated
USING (user_id = auth.uid());

REVOKE ALL ON public.auto_sweep_decisions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.auto_sweep_decisions TO authenticated;

-- Existing auto_sweep boolean is retained for backup compatibility,
-- but old app-open posting is disabled in the frontend until the
-- new validated preview/confirm RPC and UI are installed.
