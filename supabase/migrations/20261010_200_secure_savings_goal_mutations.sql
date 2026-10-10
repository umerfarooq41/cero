-- Phase 1B: secure savings-goal metadata writes.
-- Existing contribution posting RPC remains the only way to move funds.
BEGIN;

CREATE OR REPLACE FUNCTION public.cero_save_savings_goal(
  p_goal_id uuid,
  p_values jsonb
)
RETURNS public.savings_goals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_goal public.savings_goals;
  v_data jsonb;
  v_posted numeric := 0;
  v_start numeric;
  v_target numeric;
  v_from uuid;
  v_to uuid;
  v_mode text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_values IS NULL OR jsonb_typeof(p_values) <> 'object' THEN
    RAISE EXCEPTION 'Invalid goal data';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_values) AS k(key)
    WHERE NOT (k.key = ANY(ARRAY[
      'name','target_amount','starting_amount','current_amount',
      'target_date','duration_count','duration_unit','frequency',
      'start_date','contribution_mode','from_account_id','to_account_id',
      'icon_key','color_key','note','is_archived','archived_at','next_due_date'
    ]))
  ) THEN RAISE EXCEPTION 'Unsupported goal field'; END IF;

  IF p_goal_id IS NOT NULL THEN
    SELECT * INTO v_goal FROM public.savings_goals
    WHERE id=p_goal_id AND user_id=v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Goal not found'; END IF;
    IF v_goal.contribution_mode='fixed' AND
      (p_values ? 'target_amount' AND (p_values->>'target_amount')::numeric IS DISTINCT FROM v_goal.target_amount
       OR p_values ? 'starting_amount' AND (p_values->>'starting_amount')::numeric IS DISTINCT FROM v_goal.starting_amount
       OR p_values ? 'contribution_mode' AND p_values->>'contribution_mode' IS DISTINCT FROM v_goal.contribution_mode)
    THEN RAISE EXCEPTION 'Fixed goal schedule is locked'; END IF;
    v_data := to_jsonb(v_goal) || p_values;
    SELECT COALESCE(SUM(amount),0) INTO v_posted
    FROM public.goal_contributions WHERE goal_id=p_goal_id AND user_id=v_uid;
  ELSE
    v_data := p_values;
  END IF;

  v_target := (v_data->>'target_amount')::numeric;
  v_start := COALESCE((v_data->>'starting_amount')::numeric,0);
  v_from := (v_data->>'from_account_id')::uuid;
  v_to := (v_data->>'to_account_id')::uuid;
  v_mode := COALESCE(v_data->>'contribution_mode','flexible');
  IF NULLIF(btrim(v_data->>'name'),'') IS NULL THEN RAISE EXCEPTION 'Goal name required'; END IF;
  IF v_target IS NULL OR v_target<=0 OR v_target<>round(v_target,2)
    OR v_start<0 OR v_start<>round(v_start,2) OR v_start>v_target
  THEN RAISE EXCEPTION 'Invalid goal amounts'; END IF;
  IF v_mode NOT IN ('fixed','flexible') THEN RAISE EXCEPTION 'Invalid contribution mode'; END IF;
  IF v_from IS NULL OR v_to IS NULL OR v_from=v_to THEN
    RAISE EXCEPTION 'Select different source and destination accounts';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts
    WHERE id=v_from AND user_id=v_uid AND category='asset' AND type='checking')
    OR NOT EXISTS (SELECT 1 FROM public.accounts
    WHERE id=v_to AND user_id=v_uid AND category='asset' AND type='savings')
  THEN RAISE EXCEPTION 'Goal accounts must be your checking and savings accounts'; END IF;

  IF p_goal_id IS NULL THEN
    INSERT INTO public.savings_goals (
      user_id,name,target_amount,current_amount,starting_amount,
      start_date,target_date,duration_count,duration_unit,frequency,
      contribution_mode,from_account_id,to_account_id,icon_key,color_key,note,next_due_date
    ) VALUES (
      v_uid,v_data->>'name',v_target,v_start,v_start,
      COALESCE((v_data->>'start_date')::date,CURRENT_DATE),
      (v_data->>'target_date')::date,
      (v_data->>'duration_count')::integer,v_data->>'duration_unit',
      v_data->>'frequency',v_mode,v_from,v_to,
      v_data->>'icon_key',v_data->>'color_key',v_data->>'note',
      (v_data->>'next_due_date')::date
    ) RETURNING * INTO v_goal;
  ELSE
    UPDATE public.savings_goals SET
      name=v_data->>'name',
      target_amount=v_target,
      starting_amount=v_start,
      current_amount=LEAST(v_target,v_start+v_posted),
      target_date=(v_data->>'target_date')::date,
      duration_count=(v_data->>'duration_count')::integer,
      duration_unit=v_data->>'duration_unit',
      frequency=v_data->>'frequency',
      start_date=COALESCE((v_data->>'start_date')::date,start_date),
      contribution_mode=v_mode,
      from_account_id=v_from,to_account_id=v_to,
      icon_key=v_data->>'icon_key',color_key=v_data->>'color_key',
      note=v_data->>'note',
      next_due_date=(v_data->>'next_due_date')::date,
      is_archived=COALESCE((v_data->>'is_archived')::boolean,is_archived),
      archived_at=(v_data->>'archived_at')::timestamptz,
      updated_at=now()
    WHERE id=p_goal_id AND user_id=v_uid
    RETURNING * INTO v_goal;
  END IF;
  RETURN v_goal;
END;
$$;

REVOKE ALL ON FUNCTION public.cero_save_savings_goal(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_save_savings_goal(uuid,jsonb) TO authenticated;
COMMIT;
