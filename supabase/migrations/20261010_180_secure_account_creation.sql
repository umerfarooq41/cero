-- Phase 1B: create accounts atomically with auditable opening balances.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_create_account(
  p_name text,
  p_type text,
  p_category text,
  p_balance numeric DEFAULT 0,
  p_color text DEFAULT NULL
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
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF nullif(btrim(p_name),'') IS NULL OR nullif(btrim(p_type),'') IS NULL
     OR p_category NOT IN ('asset','liability') THEN
    RAISE EXCEPTION 'Invalid account details';
  END IF;
  IF p_balance IS NULL OR p_balance <> round(p_balance,2)
     OR abs(p_balance) > 999999999999.99 THEN
    RAISE EXCEPTION 'Invalid opening balance';
  END IF;
  IF p_category = 'liability' AND p_balance < 0 THEN
    RAISE EXCEPTION 'Liability opening balance cannot be negative';
  END IF;
  INSERT INTO public.accounts (user_id,name,type,category,balance,color)
  VALUES (v_uid,btrim(p_name),p_type,p_category,0,p_color)
  RETURNING * INTO v_account;
  IF p_balance <> 0 THEN
    PERFORM public.cero_adjust_account_balance(
      v_account.id,p_balance,'Account opening balance'
    );
    SELECT * INTO v_account FROM public.accounts WHERE id=v_account.id;
  END IF;
  RETURN v_account;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_create_account(text,text,text,numeric,text)
FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_create_account(text,text,text,numeric,text)
TO authenticated;
COMMIT;
