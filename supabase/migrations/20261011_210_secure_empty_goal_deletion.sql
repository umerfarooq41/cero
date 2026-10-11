-- Phase 1B: owner-scoped deletion of empty savings goals.
-- Refuse deletion when contributions or linked transactions exist.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_delete_empty_savings_goal(p_goal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  PERFORM 1 FROM public.savings_goals
    WHERE id = p_goal_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Savings goal not found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.goal_contributions
    WHERE goal_id = p_goal_id
  ) OR EXISTS (
    SELECT 1 FROM public.transactions
    WHERE savings_goal_id = p_goal_id
  ) THEN
    RAISE EXCEPTION 'This goal has financial history. Archive it instead of deleting it.';
  END IF;
  DELETE FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_delete_empty_savings_goal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_delete_empty_savings_goal(uuid) TO authenticated;
COMMIT;
