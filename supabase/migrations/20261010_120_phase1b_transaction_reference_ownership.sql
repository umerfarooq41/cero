-- Cero Phase 1B: enforce transaction reference ownership at database boundary.
-- Safe to apply before the client-to-RPC migration. Existing preflight counts were 0.
BEGIN;

CREATE OR REPLACE FUNCTION public.cero_validate_transaction_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction owner is required' USING ERRCODE = '23514';
  END IF;

  IF NEW.account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = NEW.account_id AND a.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Source account does not belong to transaction owner'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.to_account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = NEW.to_account_id AND a.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Destination account does not belong to transaction owner'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = NEW.category_id AND c.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Category does not belong to transaction owner'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.cero_validate_transaction_references()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cero_validate_transaction_references_trigger
ON public.transactions;

CREATE TRIGGER cero_validate_transaction_references_trigger
BEFORE INSERT OR UPDATE OF user_id, account_id, to_account_id, category_id
ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.cero_validate_transaction_references();

COMMIT;

-- Verification (read-only): trigger should be enabled.
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.transactions'::regclass
  AND tgname = 'cero_validate_transaction_references_trigger';
