-- Phase 1B: owner-scoped recurring rule mutations.
-- Existing debt creation and posting RPCs remain unchanged.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_save_recurring_rule(
  p_rule_id uuid,
  p_values jsonb
)
RETURNS public.recurring_transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rule public.recurring_transactions;
  v_data jsonb;
  v_allowed text[] := ARRAY[
    'name','amount','type','account_id','to_account_id','category_id',
    'frequency','start_date','next_due_date','end_date','note','is_active',
    'icon','color','total_amount','duration_count','duration_unit',
    'payment_mode','schedule_anchor_day','is_archived','archived_at'
  ];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_values IS NULL OR jsonb_typeof(p_values) <> 'object' THEN
    RAISE EXCEPTION 'Invalid recurring rule';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_values) AS k(key)
             WHERE NOT (k.key = ANY(v_allowed))) THEN
    RAISE EXCEPTION 'Unsupported recurring rule field';
  END IF;
  IF p_rule_id IS NULL THEN
    v_data := jsonb_build_object('user_id',v_uid) || p_values;
  ELSE
    SELECT * INTO v_rule FROM public.recurring_transactions
    WHERE id=p_rule_id AND user_id=v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Recurring rule not found'; END IF;
    IF v_rule.type='transfer' AND (
      (p_values ? 'amount' AND (p_values->>'amount')::numeric IS DISTINCT FROM v_rule.amount)
      OR (p_values ? 'total_amount' AND (p_values->>'total_amount')::numeric IS DISTINCT FROM v_rule.total_amount)
      OR (p_values ? 'account_id' AND (p_values->>'account_id')::uuid IS DISTINCT FROM v_rule.account_id)
      OR (p_values ? 'to_account_id' AND (p_values->>'to_account_id')::uuid IS DISTINCT FROM v_rule.to_account_id)
      OR (p_values ? 'type' AND p_values->>'type' IS DISTINCT FROM v_rule.type)
    ) THEN
      RAISE EXCEPTION 'Debt financial details cannot be changed using rule editor';
    END IF;
    v_data := to_jsonb(v_rule) || p_values;
    v_data := v_data - 'id' - 'created_at' - 'updated_at' - 'last_posted_date'
                     - 'last_posted_transaction_id' - 'completed_at';
  END IF;
  IF (v_data->>'amount')::numeric <= 0 OR
     (v_data->>'amount')::numeric <> round((v_data->>'amount')::numeric,2)
  THEN RAISE EXCEPTION 'Invalid recurring amount'; END IF;
  IF (v_data->>'type') NOT IN ('income','expense','transfer') THEN
    RAISE EXCEPTION 'Invalid recurring type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts
    WHERE id=(v_data->>'account_id')::uuid AND user_id=v_uid) THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;
  IF v_data->>'to_account_id' IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id=(v_data->>'to_account_id')::uuid AND user_id=v_uid
  ) THEN RAISE EXCEPTION 'Destination account not found'; END IF;
  IF v_data->>'category_id' IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE id=(v_data->>'category_id')::uuid AND user_id=v_uid
  ) THEN RAISE EXCEPTION 'Category not found'; END IF;
  IF p_rule_id IS NULL THEN
    INSERT INTO public.recurring_transactions (
      user_id,name,amount,type,account_id,to_account_id,category_id,
      frequency,start_date,next_due_date,end_date,note,is_active,
      icon,color,total_amount,duration_count,duration_unit,payment_mode,
      schedule_anchor_day,is_archived,archived_at
    ) VALUES (
      v_uid,v_data->>'name',(v_data->>'amount')::numeric,v_data->>'type',
      (v_data->>'account_id')::uuid,(v_data->>'to_account_id')::uuid,
      (v_data->>'category_id')::uuid,
      COALESCE(v_data->>'frequency','monthly'),
      COALESCE((v_data->>'start_date')::date,CURRENT_DATE),
      (v_data->>'next_due_date')::date,(v_data->>'end_date')::date,
      v_data->>'note',COALESCE((v_data->>'is_active')::boolean,true),
      COALESCE(v_data->>'icon','Receipt'),COALESCE(v_data->>'color','#64748b'),
      (v_data->>'total_amount')::numeric,(v_data->>'duration_count')::integer,
      v_data->>'duration_unit',COALESCE(v_data->>'payment_mode','fixed'),
      (v_data->>'schedule_anchor_day')::smallint,
      COALESCE((v_data->>'is_archived')::boolean,false),
      (v_data->>'archived_at')::timestamptz
    ) RETURNING * INTO v_rule;
  ELSE
    UPDATE public.recurring_transactions AS r SET
      name=COALESCE(v_data->>'name',r.name),
      amount=(v_data->>'amount')::numeric,
      type=v_data->>'type',
      account_id=(v_data->>'account_id')::uuid,
      to_account_id=(v_data->>'to_account_id')::uuid,
      category_id=(v_data->>'category_id')::uuid,
      frequency=COALESCE(v_data->>'frequency',r.frequency),
      start_date=COALESCE((v_data->>'start_date')::date,r.start_date),
      next_due_date=(v_data->>'next_due_date')::date,
      end_date=(v_data->>'end_date')::date,
      note=v_data->>'note',
      is_active=COALESCE((v_data->>'is_active')::boolean,r.is_active),
      icon=COALESCE(v_data->>'icon',r.icon),
      color=COALESCE(v_data->>'color',r.color),
      total_amount=(v_data->>'total_amount')::numeric,
      duration_count=(v_data->>'duration_count')::integer,
      duration_unit=v_data->>'duration_unit',
      payment_mode=COALESCE(v_data->>'payment_mode',r.payment_mode),
      schedule_anchor_day=(v_data->>'schedule_anchor_day')::smallint,
      is_archived=COALESCE((v_data->>'is_archived')::boolean,r.is_archived),
      archived_at=(v_data->>'archived_at')::timestamptz,
      updated_at=now()
    WHERE r.id=p_rule_id AND r.user_id=v_uid
    RETURNING * INTO v_rule;
  END IF;
  RETURN v_rule;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_save_recurring_rule(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_save_recurring_rule(uuid,jsonb) TO authenticated;
COMMIT;
