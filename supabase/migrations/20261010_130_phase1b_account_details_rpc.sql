-- Phase 1B staged account metadata RPC.
-- This does not change balance or revoke any table privilege.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_update_account_details(
  p_account_id uuid,
  p_name text,
  p_type text,
  p_color text
)
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_account public.accounts;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_account_id IS NULL OR NULLIF(btrim(p_name), '') IS NULL
     OR NULLIF(btrim(p_type), '') IS NULL THEN
    RAISE EXCEPTION 'Account, name and type are required';
  END IF;
  UPDATE public.accounts
  SET name = btrim(p_name),
      type = btrim(p_type),
      color = p_color,
      updated_at = now()
  WHERE id = p_account_id AND user_id = v_uid
  RETURNING * INTO v_account;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  RETURN v_account;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_update_account_details(uuid,text,text,text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_update_account_details(uuid,text,text,text)
TO authenticated;
COMMIT;
