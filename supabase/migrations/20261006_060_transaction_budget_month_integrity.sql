-- Centralize income budget-month integrity for every transaction write path.
-- Safe to run after cero_income_budget_month and the budget_month columns exist.
BEGIN;

CREATE OR REPLACE FUNCTION public.cero_set_transaction_budget_month()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_shift25th boolean := false;
  v_actual_month text;
BEGIN
  IF NEW.type <> 'income' THEN
    NEW.budget_month := NULL;
    NEW.budget_month_override := false;
    RETURN NEW;
  END IF;

  IF NEW.date IS NULL THEN
    RAISE EXCEPTION 'Income transaction date is required';
  END IF;

  v_actual_month := to_char(NEW.date, 'YYYY-MM');

  -- Preserve an explicit user override when it is valid.
  IF coalesce(NEW.budget_month_override, false) THEN
    IF NEW.budget_month IS NULL
       OR NEW.budget_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
      RAISE EXCEPTION 'A valid budget month is required for an income override';
    END IF;
    RETURN NEW;
  END IF;

  SELECT coalesce(us.shift25th, false)
    INTO v_shift25th
  FROM public.user_settings us
  WHERE us.user_id = NEW.user_id;

  NEW.budget_month :=
    CASE
      WHEN coalesce(v_shift25th, false)
       AND extract(day FROM NEW.date) >= 25
      THEN to_char(NEW.date + interval '1 month', 'YYYY-MM')
      ELSE v_actual_month
    END;

  NEW.budget_month_override := false;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS transactions_budget_month_integrity
ON public.transactions;

CREATE TRIGGER transactions_budget_month_integrity
BEFORE INSERT OR UPDATE OF type, date, budget_month, budget_month_override
ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.cero_set_transaction_budget_month();

-- Repair any income rows created by RPCs that did not persist budget_month.
UPDATE public.transactions t
SET budget_month =
  CASE
    WHEN coalesce(us.shift25th, false)
     AND extract(day FROM t.date) >= 25
    THEN to_char(t.date + interval '1 month', 'YYYY-MM')
    ELSE to_char(t.date, 'YYYY-MM')
  END,
  budget_month_override = false
FROM public.user_settings us
WHERE t.user_id = us.user_id
  AND t.type = 'income'
  AND t.budget_month IS NULL;

-- Users without a settings row still get the calendar month.
UPDATE public.transactions t
SET budget_month = to_char(t.date, 'YYYY-MM'),
    budget_month_override = false
WHERE t.type = 'income'
  AND t.budget_month IS NULL;

REVOKE ALL ON FUNCTION public.cero_set_transaction_budget_month() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_set_transaction_budget_month() TO authenticated;

COMMIT;
