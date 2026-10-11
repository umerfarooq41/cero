-- Allow correcting the actual payment date of a recurring transaction.
-- Never modify its scheduled occurrence, amount, accounts, or balance.
CREATE OR REPLACE FUNCTION public.cero_update_recurring_payment_date(
  p_transaction_id uuid,
  p_transaction_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tx public.transactions%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_transaction_date IS NULL THEN RAISE EXCEPTION 'Payment date is required'; END IF;

  SELECT * INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF v_tx.recurring_transaction_id IS NULL
     OR v_tx.source_type IS DISTINCT FROM 'recurring' THEN
    RAISE EXCEPTION 'Only recurring payment dates can be changed here';
  END IF;

  UPDATE public.transactions
  SET date = p_transaction_date, updated_at = now()
  WHERE id = v_tx.id AND user_id = v_uid;

  -- Keep the last-posted display date consistent, without touching the schedule.
  UPDATE public.recurring_transactions
  SET last_posted_date = p_transaction_date, updated_at = now()
  WHERE id = v_tx.recurring_transaction_id
    AND user_id = v_uid
    AND last_posted_transaction_id = v_tx.id;

  RETURN v_tx.id;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_update_recurring_payment_date(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_update_recurring_payment_date(uuid,date) TO authenticated;
