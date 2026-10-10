-- Explicit adjustment classification in both atomic financial RPCs.
-- Replaces note-based inference for new records.
BEGIN;
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
    'adjustment'
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

-- Phase 1B: delete a recurring rule and reconcile outstanding debt atomically.
-- Run before deploying the matching frontend commit.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_delete_recurring_rule(p_rule_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rule public.recurring_transactions%rowtype;
  v_paid numeric := 0;
  v_outstanding numeric := 0;
  v_balance numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_rule FROM public.recurring_transactions
  WHERE id=p_rule_id AND user_id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recurring rule not found'; END IF;

  IF v_rule.type = 'transfer' AND v_rule.to_account_id IS NOT NULL THEN
    SELECT coalesce(sum(t.amount),0) INTO v_paid
    FROM public.transactions t
    WHERE t.user_id=v_uid
      AND t.recurring_transaction_id=p_rule_id
      AND t.type='transfer';
    v_outstanding := greatest(0,coalesce(v_rule.total_amount,0)-v_paid);
    IF v_outstanding > 0 THEN
      SELECT balance INTO v_balance FROM public.accounts
      WHERE id=v_rule.to_account_id AND user_id=v_uid
        AND category='liability' FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Liability account not found'; END IF;
      IF coalesce(v_balance,0) < v_outstanding THEN
        RAISE EXCEPTION 'Liability balance is below the remaining debt; reconcile the account before deleting this rule';
      END IF;
      INSERT INTO public.transactions
        (user_id,account_id,amount,type,date,note,source_type)
      VALUES
        (v_uid,v_rule.to_account_id,v_outstanding,'income',current_date,
         'Debt principal removed: ' || v_rule.name,'adjustment');
      UPDATE public.accounts
      SET balance=coalesce(balance,0)-v_outstanding,updated_at=now()
      WHERE id=v_rule.to_account_id AND user_id=v_uid;
    END IF;
  END IF;
  DELETE FROM public.recurring_transactions
  WHERE id=p_rule_id AND user_id=v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_delete_recurring_rule(uuid)
FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_delete_recurring_rule(uuid)
TO authenticated;
COMMIT;
