-- Phase 1A: remove unsafe API-role table and function privileges.
-- Safe compatibility stage: authenticated DML remains on tables still written
-- directly by the app. Phase 1B must migrate those calls to RPCs first.
-- Run in Supabase SQL Editor only after reviewing against the live schema.
BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;

-- The app reads these through PostgREST; row security still applies.
GRANT SELECT ON TABLE
  public.accounts,
  public.budget_plans,
  public.categories,
  public.goal_contributions,
  public.recurring_transactions,
  public.savings_goals,
  public.transactions,
  public.user_settings
TO authenticated;

-- Temporary compatibility grants. Do NOT add TRUNCATE, TRIGGER, REFERENCES.
-- Phase 1B will remove direct writes to accounts/transactions once RPCs
-- replace every direct call (including onboarding and balance edits).
GRANT INSERT, UPDATE, DELETE ON TABLE
  public.accounts,
  public.budget_plans,
  public.categories,
  public.goal_contributions,
  public.recurring_transactions,
  public.savings_goals,
  public.transactions,
  public.user_settings
TO authenticated;

-- The DDL event-trigger helper must never be executable by API clients.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

COMMIT;

-- Privilege review: expected no anon entries, no TRUNCATE/TRIGGER/REFERENCES
-- for authenticated. Run separately if desired.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
