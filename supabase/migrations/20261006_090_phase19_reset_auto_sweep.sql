-- Phase 19: keep Reset Everything complete as new Cero user-owned tables are added.
-- Safe to run repeatedly.

CREATE OR REPLACE FUNCTION public.cero_reset_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Decision rows may reference accounts/transactions, so remove them first.
  DELETE FROM public.auto_sweep_decisions WHERE user_id = uid;
  DELETE FROM public.goal_contributions WHERE user_id = uid;
  DELETE FROM public.budget_plans WHERE user_id = uid;
  DELETE FROM public.transactions WHERE user_id = uid;
  DELETE FROM public.recurring_transactions WHERE user_id = uid;
  DELETE FROM public.savings_goals WHERE user_id = uid;
  DELETE FROM public.accounts WHERE user_id = uid;
  DELETE FROM public.categories WHERE user_id = uid;
  DELETE FROM public.user_settings WHERE user_id = uid;
END;
$function$;

REVOKE ALL ON FUNCTION public.cero_reset_user_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_reset_user_data() TO authenticated;
