-- Optional payee metadata; historical rows stay NULL. Existing RPCs remain intact.
begin;
alter table public.transactions add column if not exists payee_name text;
alter table public.transactions add constraint transactions_payee_name_length check (payee_name is null or char_length(payee_name) between 1 and 120);
create or replace function public.cero_create_transaction_with_payee(p_amount numeric,p_type text,p_date date,p_account_id uuid,p_to_account_id uuid,p_category_id uuid,p_note text,p_payee_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 v_id := public.cero_create_transaction(p_amount,p_type,p_date,p_account_id,p_to_account_id,p_category_id,p_note);
 update public.transactions set payee_name=case when p_type='transfer' then null else nullif(btrim(p_payee_name),'') end where id=v_id and user_id=v_uid;
 if not found then raise exception 'Transaction not found'; end if;
 return v_id;
end; $$;
create or replace function public.cero_update_transaction_with_payee(p_transaction_id uuid,p_amount numeric,p_type text,p_date date,p_account_id uuid,p_to_account_id uuid,p_category_id uuid,p_note text,p_payee_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 v_id := public.cero_update_transaction(p_transaction_id,p_amount,p_type,p_date,p_account_id,p_to_account_id,p_category_id,p_note);
 update public.transactions set payee_name=case when p_type='transfer' then null else nullif(btrim(p_payee_name),'') end where id=v_id and user_id=v_uid;
 if not found then raise exception 'Transaction not found'; end if;
 return v_id;
end; $$;
revoke all on function public.cero_create_transaction_with_payee(numeric,text,date,uuid,uuid,uuid,text,text) from public,anon;
revoke all on function public.cero_update_transaction_with_payee(uuid,numeric,text,date,uuid,uuid,uuid,text,text) from public,anon;
grant execute on function public.cero_create_transaction_with_payee(numeric,text,date,uuid,uuid,uuid,text,text) to authenticated;
grant execute on function public.cero_update_transaction_with_payee(uuid,numeric,text,date,uuid,uuid,uuid,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
