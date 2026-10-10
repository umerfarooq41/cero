-- Cero Phase 1B preflight (READ ONLY).
-- Run before replacing direct financial writes with SECURITY DEFINER RPCs.
-- This script changes no permissions or financial data.
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public'
AND grantee='authenticated'
AND table_name IN ('accounts','transactions')
ORDER BY table_name, privilege_type;

SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_function_result(p.oid) AS return_type,
       p.prosecdef AS security_definer,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
AND p.proname IN ('cero_create_transaction','cero_update_transaction',
 'cero_delete_transaction','cero_delete_account','cero_create_account',
 'cero_update_account','cero_adjust_account_balance')
ORDER BY p.proname;

-- Report any transaction references to other users' accounts/categories.
SELECT
  count(*) FILTER (WHERE a.id IS NOT NULL AND a.user_id IS DISTINCT FROM t.user_id)
    AS foreign_source_accounts,
  count(*) FILTER (WHERE b.id IS NOT NULL AND b.user_id IS DISTINCT FROM t.user_id)
    AS foreign_destination_accounts,
  count(*) FILTER (WHERE c.id IS NOT NULL AND c.user_id IS DISTINCT FROM t.user_id)
    AS foreign_categories
FROM public.transactions t
LEFT JOIN public.accounts a ON a.id=t.account_id
LEFT JOIN public.accounts b ON b.id=t.to_account_id
LEFT JOIN public.categories c ON c.id=t.category_id;
