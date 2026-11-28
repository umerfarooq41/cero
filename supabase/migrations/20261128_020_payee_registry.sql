BEGIN;
CREATE TABLE IF NOT EXISTS public.payees (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
 is_archived boolean NOT NULL DEFAULT false,
 default_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS payees_user_name_key ON public.payees(user_id,lower(btrim(name)));
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payees_read_own ON public.payees;
CREATE POLICY payees_read_own ON public.payees FOR SELECT TO authenticated USING (user_id=auth.uid());
REVOKE ALL ON public.payees FROM anon, authenticated;
GRANT SELECT ON public.payees TO authenticated;
INSERT INTO public.payees(user_id,name)
SELECT user_id,min(btrim(payee_name)) FROM public.transactions WHERE nullif(btrim(payee_name),'') IS NOT NULL AND type IN ('income','expense') GROUP BY user_id,lower(btrim(payee_name)) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.cero_register_transaction_payee()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE canonical text;
BEGIN
 IF NEW.type='transfer' THEN NEW.payee_name:=NULL; END IF;
 NEW.payee_name:=nullif(btrim(NEW.payee_name),'');
 IF NEW.payee_name IS NOT NULL THEN
  INSERT INTO public.payees(user_id,name) VALUES(NEW.user_id,NEW.payee_name) ON CONFLICT DO NOTHING;
  SELECT name INTO canonical FROM public.payees WHERE user_id=NEW.user_id AND lower(btrim(name))=lower(NEW.payee_name);
  NEW.payee_name:=coalesce(canonical,NEW.payee_name);
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.cero_register_transaction_payee() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS cero_register_transaction_payee ON public.transactions;
CREATE TRIGGER cero_register_transaction_payee BEFORE INSERT OR UPDATE OF payee_name ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.cero_register_transaction_payee();

CREATE OR REPLACE FUNCTION public.cero_manage_payee(p_action text,p_id uuid,p_name text,p_target_id uuid,p_category_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE uid uuid:=auth.uid(); old_name text; new_name text;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 IF p_id IS NOT NULL THEN
 SELECT name INTO old_name FROM public.payees WHERE id=p_id AND user_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payee not found'; END IF;
 ELSIF p_action IS DISTINCT FROM 'save' THEN RAISE EXCEPTION 'Payee required'; END IF;
 IF p_action='save' THEN
  new_name:=nullif(btrim(p_name),'');
  IF new_name IS NULL OR char_length(new_name)>120 THEN RAISE EXCEPTION 'Invalid name'; END IF;
  IF p_category_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.categories WHERE id=p_category_id AND user_id=uid AND type IN ('expense','income')) THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF p_id IS NULL THEN INSERT INTO public.payees(user_id,name,default_category_id) VALUES(uid,new_name,p_category_id);
  ELSE UPDATE public.payees SET name=new_name,default_category_id=p_category_id WHERE id=p_id AND user_id=uid;
   UPDATE public.transactions SET payee_name=new_name WHERE user_id=uid AND lower(btrim(payee_name))=lower(btrim(old_name));
  END IF;
 ELSIF p_action='merge' THEN
  IF p_id=p_target_id THEN RAISE EXCEPTION 'Choose another payee'; END IF;
  SELECT name INTO new_name FROM public.payees WHERE id=p_target_id AND user_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destination not found'; END IF;
  UPDATE public.transactions SET payee_name=new_name WHERE user_id=uid AND lower(btrim(payee_name))=lower(btrim(old_name));
  DELETE FROM public.payees WHERE id=p_id AND user_id=uid;
 ELSIF p_action='archive' OR p_action='restore' THEN UPDATE public.payees SET is_archived=(p_action='archive') WHERE id=p_id AND user_id=uid;
 ELSIF p_action='delete' THEN
  UPDATE public.transactions SET payee_name=NULL WHERE user_id=uid AND lower(btrim(payee_name))=lower(btrim(old_name));
  DELETE FROM public.payees WHERE id=p_id AND user_id=uid;
 ELSE RAISE EXCEPTION 'Invalid action'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.cero_manage_payee(text,uuid,text,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cero_manage_payee(text,uuid,text,uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
