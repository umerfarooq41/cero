-- Phase 1D: validate recurring occurrence identity at transaction insertion.
-- The payment's actual date is independent of the scheduled occurrence.
-- This trigger applies to every new recurring posting, even if a caller bypasses the UI.
-- Existing historical transactions are untouched.
BEGIN;

CREATE OR REPLACE FUNCTION public.cero_validate_recurring_post_occurrence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rule public.recurring_transactions%ROWTYPE;
  v_expected date;
BEGIN
  IF NEW.recurring_transaction_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock the rule, serializing concurrent postings for the same schedule.
  SELECT * INTO v_rule
  FROM public.recurring_transactions
  WHERE id = NEW.recurring_transaction_id
    AND user_id = NEW.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring rule not found for transaction';
  END IF;

  IF NEW.source_type IS DISTINCT FROM 'recurring' THEN
    RAISE EXCEPTION 'Recurring transactions must use recurring source type';
  END IF;

  IF NOT v_rule.is_active OR coalesce(v_rule.is_archived,false)
     OR v_rule.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Recurring rule is paused, archived or completed';
  END IF;

  v_expected := coalesce(v_rule.next_due_date, v_rule.start_date);
  IF v_expected IS NULL THEN
    RAISE EXCEPTION 'Recurring rule has no scheduled occurrence';
  END IF;

  IF NEW.recurring_posted_for_date IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION
      'Recurring schedule changed. Refresh and post the current installment (due %).',
      v_expected;
  END IF;

  IF NEW.type IS DISTINCT FROM v_rule.type
     OR NEW.account_id IS DISTINCT FROM v_rule.account_id
     OR (NEW.type = 'transfer'
         AND NEW.to_account_id IS DISTINCT FROM v_rule.to_account_id) THEN
    RAISE EXCEPTION 'Recurring transaction accounts or type do not match the rule';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cero_validate_recurring_post_occurrence_trigger
ON public.transactions;

CREATE TRIGGER cero_validate_recurring_post_occurrence_trigger
BEFORE INSERT ON public.transactions
FOR EACH ROW
WHEN (NEW.recurring_transaction_id IS NOT NULL)
EXECUTE FUNCTION public.cero_validate_recurring_post_occurrence();

REVOKE ALL ON FUNCTION public.cero_validate_recurring_post_occurrence()
FROM PUBLIC, anon, authenticated;

COMMIT;

-- Verification (run separately):
-- SELECT tgname FROM pg_trigger
-- WHERE tgrelid='public.transactions'::regclass
-- AND tgname='cero_validate_recurring_post_occurrence_trigger'
-- AND NOT tgisinternal;
