-- Read-only preflight for cross-user category references.
SELECT 'budget_plans.category_id' AS check_name, COUNT(*) AS invalid_rows
FROM public.budget_plans b
JOIN public.categories c ON c.id=b.category_id
WHERE b.user_id IS DISTINCT FROM c.user_id
UNION ALL
SELECT 'categories.parent_id', COUNT(*)
FROM public.categories child
JOIN public.categories parent ON parent.id=child.parent_id
WHERE child.user_id IS DISTINCT FROM parent.user_id
UNION ALL
SELECT 'budget_plans.source_id(category)', COUNT(*)
FROM public.budget_plans b
JOIN public.categories c ON c.id=b.source_id
WHERE b.source_type='category'
  AND b.user_id IS DISTINCT FROM c.user_id;
