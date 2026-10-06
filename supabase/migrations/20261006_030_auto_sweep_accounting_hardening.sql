-- Auto-Sweep hardening: one authoritative calculation and safe caps.
-- Apply after 20261006_auto_sweep_safe_execution.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.cero_auto_sweep_calculate(
  p_month text,
  p_source_balance numeric,
  p_minimum_balance numeric,
  p_mode text,
  p_value numeric
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_planned_expenses numeric := 0;
  v_expenses numeric := 0;
  v_income numeric := 0;
  v_savings numeric := 0;
  v_debt numeric := 0;
  v_unused_budget numeric := 0;
  v_cash_surplus numeric := 0;
  v_surplus numeric := 0;
  v_available numeric := 0;
  v_amount numeric := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_month IS NULL OR p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Invalid budget month';
  END IF;

  v_available := greatest(
    0,
    coalesce(p_source_balance,0) - greatest(0,coalesce(p_minimum_balance,0))
  );

  -- Include both normal category expense rows and source-linked expense rows.
  SELECT coalesce(sum(bp.planned_amount),0)
    INTO v_planned_expenses
  FROM public.budget_plans bp
  LEFT JOIN public.categories c
    ON c.id = bp.category_id AND c.user_id = uid
  WHERE bp.user_id = uid
    AND bp.month = p_month
    AND coalesce(bp.budget_type, c.type, '') = 'expense';

  -- Income follows budget_month (25th Rule). Outflows remain calendar dated.
  -- Savings/debt transfers are classified by their category or destination
  -- account so they cannot be mistaken for free month-end cash.
  SELECT
    coalesce(sum(CASE
      WHEN t.type='income'
       AND coalesce(t.budget_month,to_char(t.date,'YYYY-MM'))=p_month
      THEN abs(t.amount) ELSE 0 END),0),
    coalesce(sum(CASE
      WHEN t.type='expense' AND to_char(t.date,'YYYY-MM')=p_month
      THEN abs(t.amount) ELSE 0 END),0),
    coalesce(sum(CASE
      WHEN to_char(t.date,'YYYY-MM')=p_month
       AND (
         coalesce(c.type,'')='savings'
         OR (t.type='transfer' AND coalesce(dst.category,'')<>'liability'
             AND coalesce(dst.type,'') IN ('savings','investment'))
       )
      THEN abs(t.amount) ELSE 0 END),0),
    coalesce(sum(CASE
      WHEN to_char(t.date,'YYYY-MM')=p_month
       AND (
         coalesce(c.type,'')='debt'
         OR t.type='debt'
         OR (t.type='transfer' AND (
           coalesce(dst.category,'')='liability'
           OR coalesce(dst.type,'') IN ('loan','credit_card','debt')
         ))
       )
      THEN abs(t.amount) ELSE 0 END),0)
  INTO v_income,v_expenses,v_savings,v_debt
  FROM public.transactions t
  LEFT JOIN public.categories c
    ON c.id=t.category_id AND c.user_id=uid
  LEFT JOIN public.accounts dst
    ON dst.id=t.to_account_id AND dst.user_id=uid
  WHERE t.user_id=uid
    AND (
      (t.type='income' AND coalesce(t.budget_month,to_char(t.date,'YYYY-MM'))=p_month)
      OR
      (t.type<>'income' AND to_char(t.date,'YYYY-MM')=p_month)
    )
    AND coalesce(t.recurring_occurrence_key,'') NOT LIKE 'AUTO_SWEEP:%';

  v_unused_budget := greatest(0, v_planned_expenses - v_expenses);
  v_cash_surplus := greatest(0, v_income - v_expenses - v_savings - v_debt);
  v_surplus := least(v_unused_budget, v_cash_surplus);

  CASE p_mode
    WHEN 'surplus' THEN v_amount := v_surplus;
    WHEN 'fixed' THEN
      v_amount := least(greatest(0,coalesce(p_value,0)), v_surplus);
    WHEN 'percent' THEN
      v_amount := v_surplus
        * least(100,greatest(0,coalesce(p_value,0))) / 100;
    ELSE
      RAISE EXCEPTION 'Invalid Auto-Sweep amount mode';
  END CASE;

  RETURN round(least(v_amount,v_available,v_surplus),2);
END;
$function$;

REVOKE ALL ON FUNCTION public.cero_auto_sweep_calculate(text,numeric,numeric,text,numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_auto_sweep_calculate(text,numeric,numeric,text,numeric)
  TO authenticated;

COMMIT;
