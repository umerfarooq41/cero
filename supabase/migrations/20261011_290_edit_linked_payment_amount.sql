-- Atomic amount and schedule correction for linked transactions.
-- This function extends, rather than replaces, the existing date/occurrence RPC.
CREATE OR REPLACE FUNCTION public.cero_edit_linked_payment(
 p_transaction_id uuid, p_amount numeric, p_actual_date date,
 p_occurrence_date date, p_note text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 v_uid uuid := auth.uid();
 t public.transactions%ROWTYPE;
 r public.recurring_transactions%ROWTYPE;
 g public.savings_goals%ROWTYPE;
 c public.goal_contributions%ROWTYPE;
 delta numeric;
 src_kind text;
 dst_kind text;
 paid numeric;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_amount IS NULL OR p_amount <= 0 OR p_actual_date IS NULL OR p_occurrence_date IS NULL
 THEN RAISE EXCEPTION 'Valid amount and dates are required'; END IF;
 SELECT * INTO t FROM public.transactions
 WHERE id=p_transaction_id AND user_id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
 IF t.recurring_transaction_id IS NOT NULL AND t.source_type='recurring' THEN
   SELECT * INTO r FROM public.recurring_transactions
   WHERE id=t.recurring_transaction_id AND user_id=v_uid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Recurring rule not found'; END IF;
   IF r.type='transfer' AND coalesce(r.payment_mode,'fixed')='fixed'
      AND abs(p_amount-t.amount)>0.005 THEN
      RAISE EXCEPTION 'Fixed debt installment amount cannot be edited';
   END IF;
   IF r.type='transfer' AND r.total_amount IS NOT NULL THEN
     SELECT coalesce(sum(amount),0) INTO paid FROM public.transactions
     WHERE user_id=v_uid AND recurring_transaction_id=r.id AND id<>t.id;
     IF paid+p_amount>r.total_amount+0.005 THEN
       RAISE EXCEPTION 'Payment exceeds remaining debt';
     END IF;
   END IF;
 ELSIF t.savings_goal_id IS NOT NULL THEN
   SELECT * INTO g FROM public.savings_goals
   WHERE id=t.savings_goal_id AND user_id=v_uid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Goal not found'; END IF;
   IF coalesce(g.contribution_mode,'flexible')='fixed'
     AND abs(p_amount-t.amount)>0.005 THEN
     RAISE EXCEPTION 'Fixed goal contribution amount cannot be edited';
   END IF;
   SELECT * INTO c FROM public.goal_contributions
   WHERE user_id=v_uid AND (id=t.goal_contribution_id OR transaction_id=t.id)
   LIMIT 1 FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Goal contribution not found'; END IF;
   SELECT coalesce(sum(amount),0) INTO paid FROM public.goal_contributions
   WHERE goal_id=g.id AND user_id=v_uid AND id<>c.id;
   IF coalesce(g.starting_amount,0)+paid+p_amount>g.target_amount+0.005 THEN
     RAISE EXCEPTION 'Contribution exceeds goal target';
   END IF;
 ELSE
   RAISE EXCEPTION 'Not a linked recurring or goal payment';
 END IF;
 -- Reassignment validation and schedule recalculation are performed by the existing RPC.
 PERFORM public.cero_correct_scheduled_payment(p_transaction_id,p_actual_date,p_occurrence_date);
 delta:=p_amount-t.amount;
 IF abs(delta)>0.000001 THEN
   SELECT category INTO src_kind FROM public.accounts
   WHERE id=t.account_id AND user_id=v_uid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Source account not found'; END IF;
   IF t.type='transfer' THEN
     SELECT category INTO dst_kind FROM public.accounts
     WHERE id=t.to_account_id AND user_id=v_uid FOR UPDATE;
     IF NOT FOUND THEN RAISE EXCEPTION 'Destination account not found'; END IF;
   END IF;
   UPDATE public.accounts SET balance=coalesce(balance,0)+
     CASE WHEN t.type='income' THEN
       CASE WHEN src_kind='liability' THEN -delta ELSE delta END
     ELSE CASE WHEN src_kind='liability' THEN delta ELSE -delta END END,
     updated_at=now() WHERE id=t.account_id AND user_id=v_uid;
   IF t.type='transfer' THEN
     UPDATE public.accounts SET balance=coalesce(balance,0)+
       CASE WHEN dst_kind='liability' THEN -delta ELSE delta END,
       updated_at=now() WHERE id=t.to_account_id AND user_id=v_uid;
   END IF;
 END IF;
 UPDATE public.transactions SET amount=p_amount,note=nullif(trim(p_note),''),
 updated_at=now() WHERE id=t.id AND user_id=v_uid;
 IF t.savings_goal_id IS NOT NULL THEN
   UPDATE public.goal_contributions SET amount=p_amount,
   note=nullif(trim(p_note),''),updated_at=now()
   WHERE id=c.id AND user_id=v_uid;
   UPDATE public.savings_goals SET
     completed_at=CASE WHEN current_amount>=target_amount-0.005
       THEN coalesce(completed_at,p_actual_date) ELSE NULL END,
     next_due_date=CASE WHEN current_amount>=target_amount-0.005 THEN NULL
       ELSE next_due_date END,
     updated_at=now()
   WHERE id=g.id AND user_id=v_uid;
 END IF;
 IF t.recurring_transaction_id IS NOT NULL THEN
   -- Re-evaluate occurrence coverage after the amount correction.
   SELECT coalesce(sum(amount),0) INTO paid FROM public.transactions
   WHERE user_id=v_uid AND recurring_transaction_id=r.id
   AND recurring_posted_for_date=p_occurrence_date;
   IF (r.type='income' OR coalesce(r.payment_mode,'fixed')='flexible')
     AND paid<r.amount-0.005 THEN
     UPDATE public.recurring_transactions SET next_due_date=p_occurrence_date,
       updated_at=now() WHERE id=r.id AND user_id=v_uid
       AND (next_due_date IS NULL OR next_due_date>p_occurrence_date);
   END IF;
 END IF;
 RETURN t.id;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_edit_linked_payment(uuid,numeric,date,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_edit_linked_payment(uuid,numeric,date,date,text) TO authenticated;