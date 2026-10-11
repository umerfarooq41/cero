-- Cero: repair uniquely matched cross-user category source references.
-- Run once in Supabase SQL Editor. Transaction aborts on any changed precondition.
BEGIN;
DO $$
DECLARE
  candidate_count integer;
  mismatch_count integer;
  collision_count integer;
  updated_count integer;
BEGIN
  LOCK TABLE public.budget_plans IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE public.categories IN SHARE MODE;

  CREATE TEMP TABLE _cero_category_source_repairs ON COMMIT DROP AS
  SELECT b.id AS budget_id, b.source_id AS old_source_id,
         own.id AS new_source_id, b.user_id, b.month
  FROM public.budget_plans b
  JOIN public.categories foreign_cat ON foreign_cat.id=b.source_id
  JOIN public.categories own
    ON own.user_id=b.user_id AND own.type=b.budget_type
   AND lower(btrim(own.name))=lower(btrim(foreign_cat.name))
  WHERE b.source_type='category'
    AND b.user_id IS DISTINCT FROM foreign_cat.user_id
    AND (SELECT count(*) FROM public.categories c
         WHERE c.user_id=b.user_id AND c.type=b.budget_type
           AND lower(btrim(c.name))=lower(btrim(foreign_cat.name)))=1;

  SELECT count(*) INTO candidate_count FROM _cero_category_source_repairs;
  SELECT count(*) INTO mismatch_count
    FROM public.budget_plans b JOIN public.categories c ON c.id=b.source_id
   WHERE b.source_type='category' AND b.user_id IS DISTINCT FROM c.user_id;

  IF candidate_count<>180 OR mismatch_count<>188 THEN
    RAISE EXCEPTION 'Preflight changed: % candidates / % mismatches; expected 180 / 188. Nothing updated.',candidate_count,mismatch_count;
  END IF;

  SELECT count(*) INTO collision_count
  FROM _cero_category_source_repairs m
  WHERE EXISTS (
    SELECT 1 FROM public.budget_plans b2
    WHERE b2.id<>m.budget_id AND b2.user_id=m.user_id
      AND b2.month=m.month AND b2.source_type='category'
      AND b2.source_id=m.new_source_id
  ) OR EXISTS (
    SELECT 1 FROM _cero_category_source_repairs other
    WHERE other.budget_id<>m.budget_id AND other.user_id=m.user_id
      AND other.month=m.month AND other.new_source_id=m.new_source_id
  ) OR EXISTS (
    SELECT 1 FROM public.budget_plans b
    WHERE b.id=m.budget_id AND b.category_id IS DISTINCT FROM m.new_source_id
  );
  IF collision_count<>0 THEN
    RAISE EXCEPTION 'Detected % collisions or category_id mismatches. Nothing updated.',collision_count;
  END IF;

  UPDATE public.budget_plans b
  SET source_id=m.new_source_id
  FROM _cero_category_source_repairs m
  WHERE b.id=m.budget_id AND b.source_id=m.old_source_id;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>180 THEN
    RAISE EXCEPTION 'Updated % rows instead of 180. Rolling back.',updated_count;
  END IF;
  RAISE NOTICE 'Repaired % category source references; 8 unmatched left untouched.',updated_count;
END $$;
COMMIT;

-- Post-repair verification (read-only):
SELECT count(*) AS remaining_cross_user_category_sources
FROM public.budget_plans b
JOIN public.categories c ON c.id=b.source_id
WHERE b.source_type='category' AND b.user_id IS DISTINCT FROM c.user_id;
