-- Phase 1B: owner-scoped category mutations, including bulk creation.
BEGIN;
CREATE OR REPLACE FUNCTION public.cero_save_category(p_category_id uuid, p_values jsonb)
RETURNS public.categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_category public.categories;
  v_parent uuid;
  v_name text;
  v_type text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_values IS NULL OR jsonb_typeof(p_values) <> 'object' THEN
    RAISE EXCEPTION 'Invalid category data';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_values) k(key)
    WHERE k.key <> ALL(ARRAY['name','type','parent_id','icon','color','is_archived']))
  THEN RAISE EXCEPTION 'Unsupported category field'; END IF;
  IF p_category_id IS NOT NULL THEN
    SELECT * INTO v_category FROM public.categories
    WHERE id=p_category_id AND user_id=v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;
  END IF;
  v_name := COALESCE(p_values->>'name',v_category.name);
  v_type := COALESCE(p_values->>'type',v_category.type);
  v_parent := CASE WHEN p_values ? 'parent_id'
    THEN (p_values->>'parent_id')::uuid ELSE v_category.parent_id END;
  IF NULLIF(btrim(v_name),'') IS NULL THEN RAISE EXCEPTION 'Category name required'; END IF;
  IF v_type NOT IN ('income','expense') THEN RAISE EXCEPTION 'Invalid category type'; END IF;
  IF v_parent IS NOT NULL AND (
    v_parent = p_category_id OR NOT EXISTS (
      SELECT 1 FROM public.categories
      WHERE id=v_parent AND user_id=v_uid AND parent_id IS NULL AND type=v_type
    )
  ) THEN RAISE EXCEPTION 'Invalid parent category'; END IF;
  IF p_category_id IS NULL THEN
    INSERT INTO public.categories(user_id,name,type,parent_id,icon,color,is_archived)
    VALUES(v_uid,v_name,v_type,v_parent,p_values->>'icon',p_values->>'color',
      COALESCE((p_values->>'is_archived')::boolean,false))
    RETURNING * INTO v_category;
  ELSE
    UPDATE public.categories SET
      name=v_name,type=v_type,parent_id=v_parent,
      icon=CASE WHEN p_values ? 'icon' THEN p_values->>'icon' ELSE icon END,
      color=CASE WHEN p_values ? 'color' THEN p_values->>'color' ELSE color END,
      is_archived=COALESCE((p_values->>'is_archived')::boolean,is_archived),
      updated_at=now()
    WHERE id=p_category_id AND user_id=v_uid
    RETURNING * INTO v_category;
  END IF;
  RETURN v_category;
END;
$$;
CREATE OR REPLACE FUNCTION public.cero_delete_category(p_category_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  DELETE FROM public.categories WHERE id=p_category_id AND user_id=v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found or referenced by other records'; END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.cero_create_categories(p_rows jsonb)
RETURNS SETOF public.categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row jsonb;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows)<>'array' THEN
    RAISE EXCEPTION 'Expected category array';
  END IF;
  IF jsonb_array_length(p_rows)>100 THEN RAISE EXCEPTION 'Too many categories'; END IF;
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    RETURN NEXT public.cero_save_category(NULL,v_row);
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.cero_save_category(uuid,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.cero_delete_category(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.cero_create_categories(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_save_category(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cero_delete_category(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cero_create_categories(jsonb) TO authenticated;
COMMIT;
