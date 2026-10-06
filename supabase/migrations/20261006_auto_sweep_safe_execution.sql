-- Cero Auto-Sweep Phase 2: safe preview / confirm / skip / automatic execution
-- Run AFTER 20261006_auto_sweep_redesign_foundation.sql.

BEGIN;

-- The decision row is the durable idempotency record. A deleted transfer must
-- not silently authorize a second sweep for the same month.
ALTER TABLE public.auto_sweep_decisions
  ADD COLUMN IF NOT EXISTS amount_mode text,
  ADD COLUMN IF NOT EXISTS execution_mode text,
  ADD COLUMN IF NOT EXISTS calculated_amount numeric,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

ALTER TABLE public.auto_sweep_decisions
  DROP CONSTRAINT IF EXISTS auto_sweep_decisions_amount_mode_valid;
ALTER TABLE public.auto_sweep_decisions
  ADD CONSTRAINT auto_sweep_decisions_amount_mode_valid
  CHECK (amount_mode IS NULL OR amount_mode IN ('surplus','fixed','percent'));

ALTER TABLE public.auto_sweep_decisions
  DROP CONSTRAINT IF EXISTS auto_sweep_decisions_execution_mode_valid;
ALTER TABLE public.auto_sweep_decisions
  ADD CONSTRAINT auto_sweep_decisions_execution_mode_valid
  CHECK (execution_mode IS NULL OR execution_mode IN ('ask','automatic'));

-- One database-enforced sweep transaction key per user/month, independent of
-- recurring_transaction_id and independent of editable note text.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_auto_sweep_key_uidx
ON public.transactions (user_id, recurring_occurrence_key)
WHERE recurring_occurrence_key LIKE 'AUTO_SWEEP:%';

CREATE OR REPLACE FUNCTION public.cero_auto_sweep_calculate(
  p_month text,
  p_source_balance numeric,
  p_minimum_balance numeric,
  p_mode text,
  p_value numeric
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_planned_expenses numeric := 0;
  v_expenses numeric := 0;
  v_income numeric := 0;
  v_savings numeric := 0;
  v_debt numeric := 0;
  v_unused_budget numeric := 0;
  v_cash_surplus numeric := 0;
  v_surplus numeric := 0;
  v_available numeric := 0;
  v_amount numeric := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_month IS NULL OR p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Invalid budget month';
  END IF;

  v_available := greatest(0, coalesce(p_source_balance,0) - greatest(0,coalesce(p_minimum_balance,0)));

  SELECT coalesce(sum(bp.planned_amount),0)
    INTO v_planned_expenses
  FROM public.budget_plans bp
  JOIN public.categories c ON c.id = bp.category_id AND c.user_id = uid
  WHERE bp.user_id = uid AND bp.month = p_month
    AND coalesce(c.type,'') = 'expense';

  SELECT
    coalesce(sum(CASE WHEN t.type='income' THEN abs(t.amount) ELSE 0 END),0),
    coalesce(sum(CASE WHEN t.type='expense' THEN abs(t.amount) ELSE 0 END),0),
    coalesce(sum(CASE WHEN t.type='savings' THEN abs(t.amount) ELSE 0 END),0),
    coalesce(sum(CASE WHEN t.type='debt' THEN abs(t.amount) ELSE 0 END),0)
  INTO v_income,v_expenses,v_savings,v_debt
  FROM public.transactions t
  WHERE t.user_id = uid AND to_char(t.date,'YYYY-MM') = p_month
    AND t.type <> 'transfer';

  v_unused_budget := greatest(0, v_planned_expenses - v_expenses);
  v_cash_surplus := greatest(0, v_income - v_expenses - v_savings - v_debt);
  v_surplus := least(v_unused_budget, v_cash_surplus);

  CASE p_mode
    WHEN 'surplus' THEN v_amount := v_surplus;
    WHEN 'fixed' THEN v_amount := greatest(0,coalesce(p_value,0));
    WHEN 'percent' THEN v_amount := v_surplus * least(100,greatest(0,coalesce(p_value,0))) / 100;
    ELSE RAISE EXCEPTION 'Invalid Auto-Sweep amount mode';
  END CASE;

  RETURN round(least(v_amount,v_available),2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_auto_sweep_prepare(p_month text)
RETURNS TABLE (
  status text, proposed_amount numeric, source_account_id uuid,
  destination_account_id uuid, source_name text, destination_name text,
  execution_mode text, amount_mode text, reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  s public.user_settings%rowtype;
  src public.accounts%rowtype;
  dst public.accounts%rowtype;
  d public.auto_sweep_decisions%rowtype;
  v_amount numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_month IS NULL OR p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN RAISE EXCEPTION 'Invalid budget month'; END IF;

  SELECT * INTO s FROM public.user_settings WHERE user_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User settings not found'; END IF;
  IF NOT coalesce(s.auto_sweep,false) THEN
    RETURN QUERY SELECT 'disabled'::text,0::numeric,NULL::uuid,NULL::uuid,NULL::text,NULL::text,
      s.auto_sweep_execution_mode,s.auto_sweep_amount_mode,'Auto-Sweep is disabled'::text;
    RETURN;
  END IF;
  IF s.auto_sweep_source_account_id IS NULL OR s.auto_sweep_destination_account_id IS NULL THEN
    RETURN QUERY SELECT 'needs_configuration'::text,0::numeric,s.auto_sweep_source_account_id,s.auto_sweep_destination_account_id,
      NULL::text,NULL::text,s.auto_sweep_execution_mode,s.auto_sweep_amount_mode,'Choose source and destination accounts'::text;
    RETURN;
  END IF;

  SELECT * INTO src FROM public.accounts
    WHERE id=s.auto_sweep_source_account_id AND user_id=uid AND NOT coalesce(is_archived,false) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Configured source account is unavailable'; END IF;
  SELECT * INTO dst FROM public.accounts
    WHERE id=s.auto_sweep_destination_account_id AND user_id=uid AND NOT coalesce(is_archived,false) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Configured destination account is unavailable'; END IF;
  IF src.id=dst.id THEN RAISE EXCEPTION 'Source and destination accounts must be different'; END IF;

  SELECT * INTO d FROM public.auto_sweep_decisions WHERE user_id=uid AND month=p_month;
  IF FOUND AND d.status IN ('completed','skipped') THEN
    RETURN QUERY SELECT d.status,coalesce(d.posted_amount,d.proposed_amount,0),d.source_account_id,d.destination_account_id,
      src.name,dst.name,coalesce(d.execution_mode,s.auto_sweep_execution_mode),coalesce(d.amount_mode,s.auto_sweep_amount_mode),d.reason;
    RETURN;
  END IF;

  v_amount := public.cero_auto_sweep_calculate(p_month,src.balance,s.auto_sweep_minimum_balance,s.auto_sweep_amount_mode,s.auto_sweep_value);

  INSERT INTO public.auto_sweep_decisions(user_id,month,status,source_account_id,destination_account_id,
    proposed_amount,calculated_amount,amount_mode,execution_mode,reason,updated_at)
  VALUES(uid,p_month,'pending',src.id,dst.id,v_amount,v_amount,s.auto_sweep_amount_mode,s.auto_sweep_execution_mode,
    CASE WHEN v_amount<=0 THEN 'No eligible amount to sweep' ELSE NULL END,now())
  ON CONFLICT (user_id,month) DO UPDATE SET
    status='pending',source_account_id=excluded.source_account_id,destination_account_id=excluded.destination_account_id,
    proposed_amount=excluded.proposed_amount,calculated_amount=excluded.calculated_amount,
    amount_mode=excluded.amount_mode,execution_mode=excluded.execution_mode,reason=excluded.reason,updated_at=now();

  RETURN QUERY SELECT 'pending'::text,v_amount,src.id,dst.id,src.name,dst.name,
    s.auto_sweep_execution_mode,s.auto_sweep_amount_mode,
    CASE WHEN v_amount<=0 THEN 'No eligible amount to sweep' ELSE NULL::text END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_auto_sweep_skip(p_month text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid:=auth.uid(); d public.auto_sweep_decisions%rowtype;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO d FROM public.auto_sweep_decisions WHERE user_id=uid AND month=p_month FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prepare the sweep before skipping it'; END IF;
  IF d.status='completed' THEN RAISE EXCEPTION 'Completed sweep cannot be skipped'; END IF;
  UPDATE public.auto_sweep_decisions SET status='skipped',reason='Skipped by user',decided_at=now(),updated_at=now()
  WHERE id=d.id;
  RETURN 'skipped';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_auto_sweep_confirm(
  p_month text,
  p_amount numeric DEFAULT NULL,
  p_manual boolean DEFAULT false
)
RETURNS TABLE(status text, transaction_id uuid, posted_amount numeric, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid:=auth.uid();
  s public.user_settings%rowtype;
  d public.auto_sweep_decisions%rowtype;
  src public.accounts%rowtype;
  dst public.accounts%rowtype;
  v_amount numeric;
  v_max numeric;
  v_tx uuid;
  v_date date;
  v_key text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO s FROM public.user_settings WHERE user_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User settings not found'; END IF;

  SELECT * INTO d FROM public.auto_sweep_decisions WHERE user_id=uid AND month=p_month FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prepare the sweep before confirming it'; END IF;
  IF d.status='completed' THEN
    RETURN QUERY SELECT 'already_done'::text,d.transaction_id,d.posted_amount,d.reason; RETURN;
  END IF;
  IF d.status='skipped' AND NOT p_manual THEN
    RETURN QUERY SELECT 'skipped'::text,NULL::uuid,0::numeric,d.reason; RETURN;
  END IF;

  SELECT * INTO src FROM public.accounts WHERE id=d.source_account_id AND user_id=uid AND NOT coalesce(is_archived,false) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source account is unavailable'; END IF;
  SELECT * INTO dst FROM public.accounts WHERE id=d.destination_account_id AND user_id=uid AND NOT coalesce(is_archived,false) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destination account is unavailable'; END IF;

  -- Recalculate immediately before posting. User-edited amount may only reduce
  -- the safe current maximum; it cannot bypass the balance/minimum safeguard.
  v_max := public.cero_auto_sweep_calculate(p_month,src.balance,s.auto_sweep_minimum_balance,
    coalesce(d.amount_mode,s.auto_sweep_amount_mode),s.auto_sweep_value);
  v_amount := CASE WHEN p_amount IS NULL THEN v_max ELSE least(greatest(0,p_amount),v_max) END;

  IF v_amount<=0 THEN
    UPDATE public.auto_sweep_decisions SET status='pending',proposed_amount=0,reason='No safe amount is currently available',updated_at=now()
    WHERE id=d.id;
    RETURN QUERY SELECT 'needs_confirmation'::text,NULL::uuid,0::numeric,'No safe amount is currently available'::text; RETURN;
  END IF;

  v_key := 'AUTO_SWEEP:'||p_month;
  SELECT id INTO v_tx FROM public.transactions WHERE user_id=uid AND recurring_occurrence_key=v_key LIMIT 1;
  IF v_tx IS NOT NULL THEN
    UPDATE public.auto_sweep_decisions SET status='completed',transaction_id=v_tx,posted_amount=v_amount,decided_at=now(),updated_at=now()
    WHERE id=d.id;
    RETURN QUERY SELECT 'already_done'::text,v_tx,v_amount,NULL::text; RETURN;
  END IF;

  -- The month-close date follows Cero's 25th Rule.
  v_date := CASE WHEN coalesce(s.shift25th,false)
    THEN (to_date(p_month||'-01','YYYY-MM-DD') + interval '1 month' - interval '8 days')::date
    ELSE (to_date(p_month||'-01','YYYY-MM-DD') + interval '1 month' - interval '1 day')::date END;

  INSERT INTO public.transactions(user_id,account_id,to_account_id,amount,type,date,note,source_type,recurring_occurrence_key,
    account_name_snapshot,to_account_name_snapshot)
  VALUES(uid,src.id,dst.id,v_amount,'transfer',v_date,'[AUTO_SWEEP:'||p_month||'] Month-end sweep',
    'manual',v_key,src.name,dst.name)
  RETURNING id INTO v_tx;

  UPDATE public.accounts SET balance=coalesce(balance,0)-v_amount,updated_at=now() WHERE id=src.id AND user_id=uid;
  UPDATE public.accounts SET balance=coalesce(balance,0)+v_amount,updated_at=now() WHERE id=dst.id AND user_id=uid;

  UPDATE public.auto_sweep_decisions SET status='completed',transaction_id=v_tx,posted_amount=v_amount,
    proposed_amount=v_amount,reason=NULL,decided_at=now(),updated_at=now() WHERE id=d.id;

  RETURN QUERY SELECT 'swept'::text,v_tx,v_amount,NULL::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.cero_auto_sweep_calculate(text,numeric,numeric,text,numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cero_auto_sweep_prepare(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cero_auto_sweep_skip(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cero_auto_sweep_confirm(text,numeric,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_auto_sweep_calculate(text,numeric,numeric,text,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cero_auto_sweep_prepare(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cero_auto_sweep_skip(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cero_auto_sweep_confirm(text,numeric,boolean) TO authenticated;

COMMIT;
