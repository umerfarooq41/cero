BEGIN;

-- Learn only when a payee is first registered by a transaction.
-- Existing registry rows, including explicitly cleared defaults, stay untouched.
CREATE OR REPLACE FUNCTION public.cero_register_transaction_payee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  canonical text;
  learned_category uuid;
BEGIN
  IF NEW.type = 'transfer' THEN
    NEW.payee_name := NULL;
  END IF;

  NEW.payee_name := nullif(btrim(NEW.payee_name), '');

  IF NEW.payee_name IS NOT NULL THEN
    IF NEW.type IN ('income', 'expense') THEN
      SELECT c.id INTO learned_category
      FROM public.categories c
      WHERE c.id = NEW.category_id
        AND c.user_id = NEW.user_id
        AND c.type = NEW.type
        AND NOT coalesce(c.is_archived, false);
    END IF;

    INSERT INTO public.payees (user_id, name, default_category_id)
    VALUES (NEW.user_id, NEW.payee_name, learned_category)
    ON CONFLICT DO NOTHING;

    SELECT name INTO canonical
    FROM public.payees
    WHERE user_id = NEW.user_id
      AND lower(btrim(name)) = lower(NEW.payee_name);

    NEW.payee_name := coalesce(canonical, NEW.payee_name);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.cero_register_transaction_payee()
FROM PUBLIC, anon, authenticated;

COMMIT;
