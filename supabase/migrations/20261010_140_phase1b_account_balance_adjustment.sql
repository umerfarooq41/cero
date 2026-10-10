-- Phase 1B: atomic, auditable account balance adjustment.
-- Deploy before changing the frontend. No direct write privileges are revoked here.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_adjust_account_balance(
  p_account_id uuid,
  p_target_balance numeric,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old numeric;
  v_group text;
  v_delta numeric;
  v_amount numeric;
  v_type text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_target_balance IS NULL OR p_target_balance <> round(p_target_balance, 2)
     OR abs(p_target_balance) > 999999999999.99 THEN
    RAISE EXCEPTION 'Invalid target balance (maximum two decimal places)';
  END IF;
  SELECT balance, category INTO v_old, v_group
  FROM public.accounts WHERE id=p_account_id AND user_id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF v_group = 'liability' AND p_target_balance < 0 THEN
    RAISE EXCEPTION 'Liability balance cannot be negative';
  END IF;
  v_delta := p_target_balance - coalesce(v_old, 0);
  IF v_delta = 0 THEN RETURN NULL; END IF;
  v_amount := abs(v_delta);
  v_type := CASE
    WHEN (v_delta > 0 AND v_group <> 'liability')
      OR (v_delta < 0 AND v_group = 'liability')
    THEN 'income' ELSE 'expense' END;
  INSERT INTO public.transactions (
    user_id, account_id, amount, type, date, note, source_type
  ) VALUES (
    v_uid, p_account_id, v_amount, v_type, current_date,
    coalesce(nullif(btrim(p_note), ''), 'Account balance adjustment'),
    'manual'
  ) RETURNING id INTO v_id;
  UPDATE public.accounts SET balance=p_target_balance, updated_at=now()
  WHERE id=p_account_id AND user_id=v_uid;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_adjust_account_balance(uuid,numeric,text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_adjust_account_balance(uuid,numeric,text)
TO authenticated;
COMMIT;
