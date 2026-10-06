-- Phase 19.1: Deferred late-month income
-- The 25th Rule applies only to income availability, never to transaction history,
-- expenses, transfers, debt payments, savings contributions, or account balances.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS budget_month text,
  ADD COLUMN IF NOT EXISTS budget_month_override boolean NOT NULL DEFAULT false;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_budget_month_format;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_budget_month_format
  CHECK (budget_month IS NULL OR budget_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

CREATE INDEX IF NOT EXISTS idx_transactions_user_budget_month
  ON public.transactions(user_id, budget_month) WHERE budget_month IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cero_income_budget_month(
  p_transaction_date date, p_type text, p_requested_budget_month text DEFAULT NULL,
  p_override boolean DEFAULT false
) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); s public.user_settings%ROWTYPE; actual_month text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_transaction_date IS NULL THEN RAISE EXCEPTION 'Transaction date is required'; END IF;
  actual_month := to_char(p_transaction_date, 'YYYY-MM');
  IF p_type <> 'income' THEN RETURN NULL; END IF;
  IF coalesce(p_override, false) THEN
    IF p_requested_budget_month IS NULL OR p_requested_budget_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
      RAISE EXCEPTION 'A valid budget month is required for an income override';
    END IF;
    RETURN p_requested_budget_month;
  END IF;
  SELECT * INTO s FROM public.user_settings WHERE user_id = uid;
  IF coalesce(s.shift25th, false) AND extract(day FROM p_transaction_date) >= 25 THEN
    RETURN to_char(p_transaction_date + interval '1 month', 'YYYY-MM');
  END IF;
  RETURN actual_month;
END;
$function$;

REVOKE ALL ON FUNCTION public.cero_income_budget_month(date,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_income_budget_month(date,text,text,boolean) TO authenticated;

UPDATE public.transactions t
SET budget_month = CASE
  WHEN coalesce(s.shift25th, false) AND extract(day FROM t.date) >= 25
    THEN to_char(t.date + interval '1 month', 'YYYY-MM')
  ELSE to_char(t.date, 'YYYY-MM')
END,
budget_month_override = false
FROM (
  SELECT
    u.id AS user_id,
    coalesce(us.shift25th, false) AS shift25th
  FROM auth.users u
  LEFT JOIN public.user_settings us ON us.user_id = u.id
) s
WHERE t.user_id = s.user_id
  AND t.type = 'income'
  AND t.budget_month IS NULL;

UPDATE public.transactions
SET budget_month = NULL, budget_month_override = false
WHERE type <> 'income' AND (budget_month IS NOT NULL OR budget_month_override = true);

COMMENT ON COLUMN public.transactions.budget_month IS
  'Income-only budget availability month (YYYY-MM). Transaction date/account balance remain actual.';
COMMENT ON COLUMN public.transactions.budget_month_override IS
  'True when the user manually chose the income budget month instead of automatic 25th-rule assignment.';
