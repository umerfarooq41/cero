BEGIN;
CREATE OR REPLACE FUNCTION public.cero_delete_recurring_rule(p_rule_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 v_uid uuid := auth.uid();
 v_rule public.recurring_transactions%ROWTYPE;
 v_paid numeric := 0;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO v_rule FROM public.recurring_transactions
 WHERE id=p_rule_id AND user_id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recurring rule not found'; END IF;
 IF v_rule.type='transfer' THEN
   IF EXISTS(SELECT 1 FROM public.transactions
      WHERE user_id=v_uid AND recurring_transaction_id=p_rule_id)
   THEN RAISE EXCEPTION 'Debt has payment history. Archive it instead of deleting it.'; END IF;
   SELECT COALESCE(SUM(amount),0) INTO v_paid FROM public.transactions
     WHERE user_id=v_uid AND recurring_transaction_id=p_rule_id AND type='transfer';
   IF GREATEST(0,COALESCE(v_rule.total_amount,0)-v_paid)>0.005
   THEN RAISE EXCEPTION 'Debt has an outstanding balance. Archive or pause it instead.'; END IF;
 END IF;
 -- Income and expense rules can be removed without touching their posted transactions.
 -- The historical transaction references may be nulled by the FK on deletion.
 DELETE FROM public.recurring_transactions WHERE id=p_rule_id AND user_id=v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_delete_recurring_rule(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_delete_recurring_rule(uuid) TO authenticated;
COMMIT;