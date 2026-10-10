-- Mark only Cero-generated balance adjustments; leave genuine income untouched.
BEGIN;
UPDATE public.transactions
SET source_type = 'adjustment'
WHERE source_type = 'manual'
  AND (
    note = 'Account balance adjustment'
    OR note LIKE 'Debt principal removed: %'
  );
CREATE OR REPLACE FUNCTION public.cero_mark_adjustment_source()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF NEW.note = 'Account balance adjustment'
     OR NEW.note LIKE 'Debt principal removed: %' THEN
    NEW.source_type := 'adjustment';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS cero_mark_adjustment_source_trigger ON public.transactions;
CREATE TRIGGER cero_mark_adjustment_source_trigger
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.cero_mark_adjustment_source();
REVOKE ALL ON FUNCTION public.cero_mark_adjustment_source()
FROM PUBLIC, anon, authenticated;
COMMIT;
