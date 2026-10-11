-- Protect debt and recurring financial history from deletion.
-- No account adjustments or transaction deletions are performed.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_delete_recurring_rule(p_rule_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rule public.recurring_transactions%ROWTYPE;
  v_paid numeric := 0;
  v_outstanding numeric := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_rule FROM public.recurring_transactions
    WHERE id = p_rule_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recurring rule not found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.transactions
    WHERE user_id = v_uid AND recurring_transaction_id = p_rule_id
  ) THEN
    RAISE EXCEPTION 'This rule has posted financial history. Archive it instead of deleting it.';
  END IF;

  IF v_rule.type = 'transfer' AND v_rule.to_account_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.transactions
    WHERE user_id = v_uid AND recurring_transaction_id = p_rule_id
      AND type = 'transfer';
    v_outstanding := GREATEST(0, COALESCE(v_rule.total_amount, 0) - v_paid);
    IF v_outstanding > 0.005 THEN
      RAISE EXCEPTION 'This debt has an outstanding balance. Archive or pause it instead of deleting it.';
    END IF;
  END IF;

  DELETE FROM public.recurring_transactions
  WHERE id = p_rule_id AND user_id = v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_delete_recurring_rule(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_delete_recurring_rule(uuid) TO authenticated;
COMMIT;