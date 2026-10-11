-- Repair eight remaining category-source mismatches, then prevent future cross-user references.
BEGIN;
DO $$
DECLARE n integer;
BEGIN
 LOCK TABLE public.budget_plans IN SHARE ROW EXCLUSIVE MODE;
 LOCK TABLE public.categories IN SHARE MODE;
 CREATE TEMP TABLE _cero_mobile_fix ON COMMIT DROP AS
 SELECT b.id,b.category_id AS new_source_id
 FROM public.budget_plans b
 JOIN public.categories foreign_c ON foreign_c.id=b.source_id
 JOIN public.categories own ON own.id=b.category_id AND own.user_id=b.user_id
 WHERE b.source_type='category'
   AND b.user_id IS DISTINCT FROM foreign_c.user_id
   AND b.budget_type='expense'
   AND b.label='Mobile Data'
   AND foreign_c.name='Mobile Data'
   AND own.name='Mobile Balance'
   AND b.month BETWEEN '2026-03' AND '2026-10';
 SELECT count(*) INTO n FROM _cero_mobile_fix;
 IF n<>8 OR (SELECT count(*) FROM public.budget_plans b JOIN public.categories c ON c.id=b.source_id WHERE b.source_type='category' AND b.user_id IS DISTINCT FROM c.user_id)<>8
 THEN RAISE EXCEPTION 'Expected exactly eight Mobile Data mismatches; aborting'; END IF;
 IF EXISTS (
   SELECT 1 FROM _cero_mobile_fix f JOIN public.budget_plans b ON b.id=f.id
   JOIN public.budget_plans other ON other.user_id=b.user_id AND other.month=b.month
     AND other.source_type='category' AND other.source_id=f.new_source_id AND other.id<>b.id
 ) THEN RAISE EXCEPTION 'Source uniqueness collision; aborting'; END IF;
 UPDATE public.budget_plans b SET source_id=f.new_source_id
 FROM _cero_mobile_fix f WHERE b.id=f.id;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>8 THEN RAISE EXCEPTION 'Unexpected updated count %',n; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.cero_validate_budget_category_references()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.category_id IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.categories c WHERE c.id=NEW.category_id AND c.user_id=NEW.user_id
 ) THEN RAISE EXCEPTION 'Budget category must belong to the budget owner'; END IF;
 IF NEW.source_type='category' AND (
   NEW.source_id IS NULL OR NOT EXISTS (
     SELECT 1 FROM public.categories c WHERE c.id=NEW.source_id AND c.user_id=NEW.user_id
   )
 ) THEN RAISE EXCEPTION 'Budget category source must belong to the budget owner'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cero_budget_category_owner_guard ON public.budget_plans;
CREATE TRIGGER cero_budget_category_owner_guard
BEFORE INSERT OR UPDATE OF user_id,category_id,source_type,source_id
ON public.budget_plans FOR EACH ROW
EXECUTE FUNCTION public.cero_validate_budget_category_references();
COMMIT;
SELECT count(*) AS remaining_cross_user_category_sources
FROM public.budget_plans b JOIN public.categories c ON c.id=b.source_id
WHERE b.source_type='category' AND b.user_id IS DISTINCT FROM c.user_id;
