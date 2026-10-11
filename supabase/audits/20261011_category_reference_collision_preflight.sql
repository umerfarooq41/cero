-- Read-only collision check for the 180 uniquely matched category sources.
WITH matches AS (
 SELECT b.id,b.user_id,b.month,b.category_id,b.source_id,own.id AS replacement_id
 FROM public.budget_plans b
 JOIN public.categories foreign_cat ON foreign_cat.id=b.source_id
 JOIN public.categories own ON own.user_id=b.user_id
   AND own.type=b.budget_type
   AND lower(btrim(own.name))=lower(btrim(foreign_cat.name))
 WHERE b.source_type='category' AND b.user_id<>foreign_cat.user_id
), safe_candidates AS (
 SELECT m.* FROM matches m
 WHERE (SELECT count(*) FROM public.categories c
   WHERE c.user_id=m.user_id AND c.type=(SELECT b.budget_type FROM public.budget_plans b WHERE b.id=m.id)
   AND lower(btrim(c.name))=(SELECT lower(btrim(fc.name)) FROM public.categories fc WHERE fc.id=m.source_id))=1
)
SELECT
 COUNT(*) AS candidates,
 COUNT(*) FILTER (WHERE EXISTS (
   SELECT 1 FROM public.budget_plans b2
   WHERE b2.id<>m.id AND b2.user_id=m.user_id AND b2.month=m.month
     AND b2.source_type='category' AND b2.source_id=m.replacement_id
 )) AS existing_source_collisions,
 COUNT(*) FILTER (WHERE EXISTS (
   SELECT 1 FROM public.budget_plans b2
   WHERE b2.id<>m.id AND b2.user_id=m.user_id AND b2.month=m.month
     AND b2.category_id=m.category_id AND m.category_id IS NOT NULL
 )) AS existing_category_collisions,
 COUNT(*) FILTER (WHERE m.category_id IS DISTINCT FROM m.replacement_id) AS category_id_differs
FROM safe_candidates m;
