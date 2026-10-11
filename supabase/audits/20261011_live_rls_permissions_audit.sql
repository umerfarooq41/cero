-- Read-only audit: verify live RLS, policies, and client grants.
-- Run in Supabase SQL Editor. Does not modify data or permissions.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  p.policyname,
  p.cmd AS operation,
  p.roles,
  p.qual AS using_expression,
  p.with_check AS with_check_expression,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select,
  has_table_privilege('authenticated', c.oid, 'INSERT') AS authenticated_insert,
  has_table_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_update,
  has_table_privilege('authenticated', c.oid, 'DELETE') AS authenticated_delete
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname=n.nspname AND p.tablename=c.relname
WHERE n.nspname='public'
  AND c.relkind IN ('r','p')
  AND c.relname IN ('budget_plans','categories','user_settings')
ORDER BY c.relname, p.policyname;
