-- Phase 17B: atomic Cero backup restore
-- Install on the target Supabase project before enabling Restore in the client.
-- The function validates backup v1, replaces only auth.uid()'s Cero data,
-- preserves backup IDs/relationships, and rolls back automatically on any error.

CREATE OR REPLACE FUNCTION public.cero_restore_backup(p_backup jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  d jsonb;
  section text;
  item jsonb;
  backup_uid uuid;
  counts jsonb := '{}'::jsonb;
  expected_sections text[] := ARRAY[
    'accounts','categories','transactions','budget_plans',
    'recurring_transactions','savings_goals','goal_contributions','user_settings'
  ];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_backup IS NULL OR jsonb_typeof(p_backup) <> 'object' THEN RAISE EXCEPTION 'Invalid backup file'; END IF;
  IF p_backup->>'format' <> 'cero-backup' THEN RAISE EXCEPTION 'Not a Cero backup'; END IF;
  IF COALESCE((p_backup->>'version')::integer, 0) <> 1 THEN RAISE EXCEPTION 'Unsupported Cero backup version'; END IF;
  d := p_backup->'data';
  IF d IS NULL OR jsonb_typeof(d) <> 'object' THEN RAISE EXCEPTION 'Backup data is missing'; END IF;

  FOREACH section IN ARRAY expected_sections LOOP
    IF NOT (d ? section) OR jsonb_typeof(d->section) <> 'array' THEN
      RAISE EXCEPTION 'Backup section % is missing or invalid', section;
    END IF;
  END LOOP;

  IF jsonb_array_length(d->'user_settings') > 1 THEN
    RAISE EXCEPTION 'Backup contains multiple user settings rows';
  END IF;

  -- Every backed-up row must belong to one source user. The source UUID may
  -- differ from auth.uid() when restoring into a fresh test account.
  FOREACH section IN ARRAY expected_sections LOOP
    FOR item IN SELECT value FROM jsonb_array_elements(d->section) LOOP
      IF NULLIF(item->>'user_id','') IS NULL THEN
        RAISE EXCEPTION 'Backup row in % is missing user_id', section;
      END IF;
      IF backup_uid IS NULL THEN backup_uid := (item->>'user_id')::uuid; END IF;
      IF (item->>'user_id')::uuid <> backup_uid THEN
        RAISE EXCEPTION 'Backup contains data from more than one user';
      END IF;
    END LOOP;
  END LOOP;

  -- Basic relationship validation before deleting anything.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(d->'transactions') t
    WHERE t->>'account_id' IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d->'accounts') a WHERE a->>'id'=t->>'account_id')
  ) THEN RAISE EXCEPTION 'Backup has a transaction with a missing account'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(d->'goal_contributions') c
    WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d->'savings_goals') g WHERE g->>'id'=c->>'goal_id')
  ) THEN RAISE EXCEPTION 'Backup has a contribution with a missing goal'; END IF;

  -- Break cyclic FKs first, then remove current user data.
  UPDATE public.transactions SET goal_contribution_id=NULL
    WHERE user_id=uid AND goal_contribution_id IS NOT NULL;
  UPDATE public.recurring_transactions SET last_posted_transaction_id=NULL
    WHERE user_id=uid AND last_posted_transaction_id IS NOT NULL;

  DELETE FROM public.goal_contributions WHERE user_id=uid;
  DELETE FROM public.budget_plans WHERE user_id=uid;
  DELETE FROM public.transactions WHERE user_id=uid;
  DELETE FROM public.recurring_transactions WHERE user_id=uid;
  DELETE FROM public.savings_goals WHERE user_id=uid;
  DELETE FROM public.accounts WHERE user_id=uid;
  DELETE FROM public.categories WHERE user_id=uid;
  DELETE FROM public.user_settings WHERE user_id=uid;

  INSERT INTO public.categories
  SELECT r.id,uid,r.parent_id,r.name,r.type,r.icon,r.color,r.is_archived,r.created_at,r.updated_at
  FROM jsonb_to_recordset(d->'categories') AS r(
    id uuid,user_id uuid,parent_id uuid,name text,type text,icon text,color text,is_archived boolean,
    created_at timestamptz,updated_at timestamptz);

  INSERT INTO public.accounts
  SELECT r.id,uid,r.name,r.type,r.category,r.balance,r.color,r.is_archived,r.created_at,r.updated_at
  FROM jsonb_to_recordset(d->'accounts') AS r(
    id uuid,user_id uuid,name text,type text,category text,balance numeric,color text,is_archived boolean,
    created_at timestamptz,updated_at timestamptz);

  INSERT INTO public.savings_goals
  SELECT r.id,uid,r.name,r.target_amount,r.current_amount,r.start_date,r.target_date,r.note,r.color_key,r.icon_key,
    r.is_archived,r.created_at,r.updated_at,r.archived_at,r.from_account_id,r.to_account_id,r.starting_amount,
    r.duration_count,r.duration_unit,r.completed_at,r.contribution_mode,r.next_due_date,r.frequency
  FROM jsonb_to_recordset(d->'savings_goals') AS r(
    id uuid,user_id uuid,name text,target_amount numeric,current_amount numeric,start_date date,target_date date,note text,
    color_key text,icon_key text,is_archived boolean,created_at timestamptz,updated_at timestamptz,archived_at timestamptz,
    from_account_id uuid,to_account_id uuid,starting_amount numeric,duration_count integer,duration_unit text,
    completed_at date,contribution_mode text,next_due_date date,frequency text);

  INSERT INTO public.recurring_transactions(
    id,user_id,name,amount,type,account_id,to_account_id,category_id,frequency,start_date,next_due_date,end_date,note,
    is_active,last_posted_date,last_posted_transaction_id,created_at,updated_at,icon,color,is_archived,archived_at,
    total_amount,duration_count,duration_unit,completed_at,payment_mode,schedule_anchor_day)
  SELECT r.id,uid,r.name,r.amount,r.type,r.account_id,r.to_account_id,r.category_id,r.frequency,r.start_date,r.next_due_date,
    r.end_date,r.note,r.is_active,r.last_posted_date,NULL,r.created_at,r.updated_at,r.icon,r.color,r.is_archived,r.archived_at,
    r.total_amount,r.duration_count,r.duration_unit,r.completed_at,r.payment_mode,r.schedule_anchor_day
  FROM jsonb_to_recordset(d->'recurring_transactions') AS r(
    id uuid,user_id uuid,name text,amount numeric,type text,account_id uuid,to_account_id uuid,category_id uuid,frequency text,
    start_date date,next_due_date date,end_date date,note text,is_active boolean,last_posted_date date,
    last_posted_transaction_id uuid,created_at timestamptz,updated_at timestamptz,icon text,color text,is_archived boolean,
    archived_at timestamptz,total_amount numeric,duration_count integer,duration_unit text,completed_at date,
    payment_mode text,schedule_anchor_day smallint);

  INSERT INTO public.transactions(
    id,user_id,account_id,to_account_id,category_id,amount,type,date,note,created_at,updated_at,recurring_transaction_id,
    recurring_posted_for_date,savings_goal_id,goal_contribution_id,source_type,recurring_occurrence_key,
    account_name_snapshot,to_account_name_snapshot)
  SELECT r.id,uid,r.account_id,r.to_account_id,r.category_id,r.amount,r.type,r.date,r.note,r.created_at,r.updated_at,
    r.recurring_transaction_id,r.recurring_posted_for_date,r.savings_goal_id,NULL,r.source_type,r.recurring_occurrence_key,
    r.account_name_snapshot,r.to_account_name_snapshot
  FROM jsonb_to_recordset(d->'transactions') AS r(
    id uuid,user_id uuid,account_id uuid,to_account_id uuid,category_id uuid,amount numeric,type text,date date,note text,
    created_at timestamptz,updated_at timestamptz,recurring_transaction_id uuid,recurring_posted_for_date date,
    savings_goal_id uuid,goal_contribution_id uuid,source_type text,recurring_occurrence_key text,
    account_name_snapshot text,to_account_name_snapshot text);

  INSERT INTO public.goal_contributions
  SELECT r.id,uid,r.goal_id,r.account_id,r.amount,r.contribution_date,r.note,r.transaction_id,r.created_at,r.updated_at,r.occurrence_key
  FROM jsonb_to_recordset(d->'goal_contributions') AS r(
    id uuid,user_id uuid,goal_id uuid,account_id uuid,amount numeric,contribution_date date,note text,transaction_id uuid,
    created_at timestamptz,updated_at timestamptz,occurrence_key text);

  -- Restore the two cyclic links after both sides exist.
  UPDATE public.transactions t SET goal_contribution_id=r.goal_contribution_id
  FROM jsonb_to_recordset(d->'transactions') AS r(id uuid,goal_contribution_id uuid)
  WHERE t.user_id=uid AND t.id=r.id AND r.goal_contribution_id IS NOT NULL;

  UPDATE public.recurring_transactions rt SET last_posted_transaction_id=r.last_posted_transaction_id
  FROM jsonb_to_recordset(d->'recurring_transactions') AS r(id uuid,last_posted_transaction_id uuid)
  WHERE rt.user_id=uid AND rt.id=r.id AND r.last_posted_transaction_id IS NOT NULL;

  INSERT INTO public.budget_plans
  SELECT r.id,uid,r.category_id,r.month,r.planned_amount,r.created_at,r.updated_at,r.source_type,r.source_id,
    r.budget_type,r.label,r.icon,r.color
  FROM jsonb_to_recordset(d->'budget_plans') AS r(
    id uuid,user_id uuid,category_id uuid,month text,planned_amount numeric,created_at timestamptz,updated_at timestamptz,
    source_type text,source_id uuid,budget_type text,label text,icon text,color text);

  INSERT INTO public.user_settings
  SELECT r.id,uid,r.onboarding_complete,r.currency,r.currency_placement,r.number_format,r.date_format,r.theme,
    r.shift25th,r.auto_sweep,r.created_at,r.updated_at
  FROM jsonb_to_recordset(d->'user_settings') AS r(
    id uuid,user_id uuid,onboarding_complete boolean,currency text,currency_placement text,number_format text,
    date_format text,theme text,shift25th boolean,auto_sweep boolean,created_at timestamptz,updated_at timestamptz);

  -- Contribution triggers intentionally recompute current_amount. It must
  -- match the backup state; otherwise the restore is rejected and rolled back.
  IF EXISTS (
    SELECT 1 FROM public.savings_goals g
    JOIN jsonb_to_recordset(d->'savings_goals') AS r(id uuid,current_amount numeric) ON r.id=g.id
    WHERE g.user_id=uid AND g.current_amount IS DISTINCT FROM r.current_amount
  ) THEN RAISE EXCEPTION 'Backup goal totals do not reconcile with contributions'; END IF;

  FOREACH section IN ARRAY expected_sections LOOP
    counts := counts || jsonb_build_object(section,jsonb_array_length(d->section));
  END LOOP;
  RETURN jsonb_build_object('ok',true,'version',1,'counts',counts);
END;
$function$;

REVOKE ALL ON FUNCTION public.cero_restore_backup(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cero_restore_backup(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.cero_restore_backup(jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.cero_restore_backup(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cero_restore_backup(jsonb) TO postgres;
