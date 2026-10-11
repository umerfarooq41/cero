BEGIN;
CREATE OR REPLACE FUNCTION public.cero_correct_scheduled_payment(
 p_transaction_id uuid, p_actual_date date, p_occurrence_date date
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 uid uuid := auth.uid();
 t public.transactions%ROWTYPE;
 r public.recurring_transactions%ROWTYPE;
 g public.savings_goals%ROWTYPE;
 gc public.goal_contributions%ROWTYPE;
 d date;
 next_due date;
 k text;
 n integer;
 paid numeric;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_actual_date IS NULL OR p_occurrence_date IS NULL THEN
   RAISE EXCEPTION 'Both dates are required';
 END IF;
 SELECT * INTO t FROM public.transactions WHERE id=p_transaction_id AND user_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
 IF t.recurring_transaction_id IS NOT NULL AND t.source_type='recurring' THEN
   SELECT * INTO r FROM public.recurring_transactions
   WHERE id=t.recurring_transaction_id AND user_id=uid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Recurring rule not found'; END IF;
   d:=r.start_date;
   IF d IS NULL THEN RAISE EXCEPTION 'Recurring start date missing'; END IF;
   IF p_occurrence_date < d THEN RAISE EXCEPTION 'Installment precedes rule start'; END IF;
   n:=0;
   WHILE d < p_occurrence_date AND n < 1200 LOOP
     d:=public.cero_next_anchored_due_date(d,r.frequency,r.schedule_anchor_day);
     n:=n+1;
   END LOOP;
   IF d IS DISTINCT FROM p_occurrence_date THEN
     RAISE EXCEPTION 'Select a scheduled installment date for this rule';
   END IF;
   IF r.duration_count IS NOT NULL AND n>=r.duration_count THEN
     RAISE EXCEPTION 'Installment exceeds the scheduled duration';
   END IF;
   IF coalesce(r.payment_mode,'fixed')='fixed' AND r.type<>'income' AND EXISTS (
     SELECT 1 FROM public.transactions x
     WHERE x.user_id=uid AND x.recurring_transaction_id=r.id
       AND x.id<>t.id AND x.recurring_posted_for_date=p_occurrence_date
   ) THEN RAISE EXCEPTION 'That installment has already been paid'; END IF;
   IF coalesce(r.payment_mode,'fixed')='flexible' OR r.type='income' THEN
     SELECT coalesce(sum(x.amount),0) INTO paid FROM public.transactions x
     WHERE x.user_id=uid AND x.recurring_transaction_id=r.id
       AND x.id<>t.id AND x.recurring_posted_for_date=p_occurrence_date;
     IF paid+t.amount > r.amount+0.005 THEN
       RAISE EXCEPTION 'Payments exceed this installment amount';
     END IF;
   END IF;
   k:=CASE WHEN coalesce(r.payment_mode,'fixed')='fixed' AND r.type<>'income'
     THEN r.id::text||':'||p_occurrence_date::text ELSE NULL END;
   UPDATE public.transactions SET date=p_actual_date,
     recurring_posted_for_date=p_occurrence_date, recurring_occurrence_key=k,
     updated_at=now() WHERE id=t.id AND user_id=uid;
   d:=r.start_date;
   n:=0;
   next_due:=NULL;
   WHILE n<1200 LOOP
     EXIT WHEN r.duration_count IS NOT NULL AND n>=r.duration_count;
     SELECT coalesce(sum(x.amount),0) INTO paid FROM public.transactions x
     WHERE x.user_id=uid AND x.recurring_transaction_id=r.id
       AND x.recurring_posted_for_date=d;
     IF (coalesce(r.payment_mode,'fixed')='fixed' AND r.type<>'income'
        AND NOT EXISTS (SELECT 1 FROM public.transactions x WHERE x.user_id=uid
        AND x.recurring_transaction_id=r.id AND x.recurring_posted_for_date=d))
        OR ((coalesce(r.payment_mode,'fixed')='flexible' OR r.type='income')
        AND paid<r.amount-0.005) THEN
       next_due:=d; EXIT;
     END IF;
     d:=public.cero_next_anchored_due_date(d,r.frequency,r.schedule_anchor_day);
     n:=n+1;
   END LOOP;
   UPDATE public.recurring_transactions SET next_due_date=next_due,
     last_posted_date=CASE WHEN last_posted_transaction_id=t.id THEN p_actual_date ELSE last_posted_date END,
     updated_at=now()
   WHERE id=r.id AND user_id=uid;
 ELSIF t.savings_goal_id IS NOT NULL THEN
   SELECT * INTO g FROM public.savings_goals WHERE id=t.savings_goal_id AND user_id=uid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Goal not found'; END IF;
   SELECT * INTO gc FROM public.goal_contributions
   WHERE user_id=uid AND (id=t.goal_contribution_id OR transaction_id=t.id)
   LIMIT 1 FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Linked contribution not found'; END IF;
   IF coalesce(g.contribution_mode,'flexible')='fixed' THEN
     d:=g.start_date; n:=0;
     WHILE d<p_occurrence_date AND n<1200 LOOP
       d:=public.cero_goal_next_due_date(d,g.frequency); n:=n+1;
     END LOOP;
     IF d IS DISTINCT FROM p_occurrence_date OR
       (g.duration_count IS NOT NULL AND n>=g.duration_count) THEN
       RAISE EXCEPTION 'Select a scheduled goal contribution date';
     END IF;
     k:=g.id::text||':'||p_occurrence_date::text;
     IF EXISTS(SELECT 1 FROM public.goal_contributions x WHERE x.user_id=uid
       AND x.id<>gc.id AND x.occurrence_key=k) THEN
       RAISE EXCEPTION 'Goal installment already contributed';
     END IF;
   ELSE
     k:=NULL;
   END IF;
   UPDATE public.transactions SET date=p_actual_date,updated_at=now()
     WHERE id=t.id AND user_id=uid;
   UPDATE public.goal_contributions SET contribution_date=p_actual_date,
     occurrence_key=k,updated_at=now() WHERE id=gc.id AND user_id=uid;
   IF coalesce(g.contribution_mode,'flexible')='fixed' THEN
     d:=g.start_date; n:=0; next_due:=NULL;
     WHILE n<coalesce(g.duration_count,1200) AND n<1200 LOOP
       IF NOT EXISTS(SELECT 1 FROM public.goal_contributions x WHERE x.user_id=uid
         AND x.goal_id=g.id AND x.occurrence_key=g.id::text||':'||d::text) THEN
         next_due:=d; EXIT;
       END IF;
       d:=public.cero_goal_next_due_date(d,g.frequency); n:=n+1;
     END LOOP;
     UPDATE public.savings_goals SET next_due_date=next_due,updated_at=now()
       WHERE id=g.id AND user_id=uid;
   END IF;
 ELSE
   RAISE EXCEPTION 'Transaction is not linked to a recurring rule or goal';
 END IF;
 RETURN t.id;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_correct_scheduled_payment(uuid,date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_correct_scheduled_payment(uuid,date,date) TO authenticated;
COMMIT;