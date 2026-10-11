-- Read-only: summarize the eight unresolved category references without exposing user IDs.
SELECT b.budget_type, b.label AS budget_label, c.name AS foreign_category_name,
       count(*) AS affected_months,
       min(b.month) AS earliest_month, max(b.month) AS latest_month,
       count(*) FILTER (WHERE b.category_id IS NOT NULL AND own.id IS NOT NULL) AS category_id_owned
FROM public.budget_plans b
JOIN public.categories c ON c.id=b.source_id
LEFT JOIN public.categories own ON own.id=b.category_id AND own.user_id=b.user_id
WHERE b.source_type='category' AND b.user_id IS DISTINCT FROM c.user_id
GROUP BY b.budget_type,b.label,c.name
ORDER BY b.budget_type,b.label;

-- Read-only: determine whether recurring source IDs are historical or missing.
SELECT b.budget_type, count(*) AS plan_rows,
       count(DISTINCT b.source_id) AS distinct_source_ids,
       count(*) FILTER (WHERE r.id IS NOT NULL) AS matching_any_recurring_rule,
       count(*) FILTER (WHERE r.id IS NOT NULL AND r.user_id=b.user_id) AS matching_owned_rule,
       min(b.month) AS earliest_month,max(b.month) AS latest_month
FROM public.budget_plans b
LEFT JOIN public.recurring_transactions r ON r.id=b.source_id
WHERE b.source_type='recurring'
GROUP BY b.budget_type ORDER BY b.budget_type;
