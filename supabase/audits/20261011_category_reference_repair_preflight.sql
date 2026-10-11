-- Read-only repair preflight. Counts uniquely resolvable category references.
WITH mismatches AS (
 SELECT b.id,b.user_id,b.month,b.budget_type,b.label,b.source_id,
        c.name AS old_category_name
 FROM public.budget_plans b
 JOIN public.categories c ON c.id=b.source_id
 WHERE b.source_type='category' AND b.user_id<>c.user_id
), candidates AS (
 SELECT m.id,
   (SELECT count(*) FROM public.categories own
    WHERE own.user_id=m.user_id AND own.type=m.budget_type
      AND lower(btrim(own.name))=lower(btrim(m.old_category_name))) AS name_matches,
   (SELECT count(*) FROM public.categories own
    WHERE own.user_id=m.user_id AND own.type=m.budget_type
      AND lower(btrim(own.name))=lower(btrim(m.label))) AS label_matches
 FROM mismatches m
)
SELECT count(*) AS mismatched_total,
 count(*) FILTER (WHERE name_matches=1) AS uniquely_matched_by_category_name,
 count(*) FILTER (WHERE name_matches>1) AS ambiguous_category_name,
 count(*) FILTER (WHERE name_matches=0) AS no_category_name_match,
 count(*) FILTER (WHERE name_matches=0 AND label_matches=1) AS uniquely_matched_by_label_only
FROM candidates;
