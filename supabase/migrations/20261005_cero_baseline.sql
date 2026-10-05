-- Cero database baseline
-- Snapshot of the verified live public schema on 2026-10-05.
-- Intended for a fresh Supabase project. Do not run this baseline against the existing production database.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public."accounts" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"name" text NOT NULL,
"type" text,
"category" text DEFAULT 'asset'::text,
"balance" numeric DEFAULT 0,
"color" text,
"is_archived" boolean DEFAULT false,
"created_at" timestamp with time zone DEFAULT now(),
"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."budget_plans" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"category_id" uuid,
"month" text NOT NULL,
"planned_amount" numeric DEFAULT 0,
"created_at" timestamp with time zone DEFAULT now(),
"updated_at" timestamp with time zone DEFAULT now(),
"source_type" text DEFAULT 'category'::text NOT NULL,
"source_id" uuid,
"budget_type" text,
"label" text,
"icon" text,
"color" text
);

CREATE TABLE public."categories" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"parent_id" uuid,
"name" text NOT NULL,
"type" text NOT NULL,
"icon" text,
"color" text,
"is_archived" boolean DEFAULT false,
"created_at" timestamp with time zone DEFAULT now(),
"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."cero_schema_migrations" (
"version" text NOT NULL,
"description" text NOT NULL,
"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."goal_contributions" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"goal_id" uuid NOT NULL,
"account_id" uuid,
"amount" numeric NOT NULL,
"contribution_date" date DEFAULT CURRENT_DATE NOT NULL,
"note" text,
"transaction_id" uuid,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
"occurrence_key" text
);

CREATE TABLE public."recurring_transactions" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"name" text NOT NULL,
"amount" numeric NOT NULL,
"type" text NOT NULL,
"account_id" uuid NOT NULL,
"to_account_id" uuid,
"category_id" uuid,
"frequency" text DEFAULT 'monthly'::text NOT NULL,
"start_date" date DEFAULT CURRENT_DATE NOT NULL,
"next_due_date" date,
"end_date" date,
"note" text,
"is_active" boolean DEFAULT true NOT NULL,
"last_posted_date" date,
"last_posted_transaction_id" uuid,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
"icon" text DEFAULT 'Receipt'::text,
"color" text DEFAULT '#64748b'::text,
"is_archived" boolean DEFAULT false NOT NULL,
"archived_at" timestamp with time zone,
"total_amount" numeric,
"duration_count" integer,
"duration_unit" text,
"completed_at" date,
"payment_mode" text DEFAULT 'fixed'::text,
"schedule_anchor_day" smallint
);

CREATE TABLE public."savings_goals" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"name" text NOT NULL,
"target_amount" numeric NOT NULL,
"current_amount" numeric DEFAULT 0 NOT NULL,
"start_date" date DEFAULT CURRENT_DATE NOT NULL,
"target_date" date,
"note" text,
"color_key" text,
"icon_key" text,
"is_archived" boolean DEFAULT false NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
"archived_at" timestamp with time zone,
"from_account_id" uuid,
"to_account_id" uuid,
"starting_amount" numeric DEFAULT 0 NOT NULL,
"duration_count" integer,
"duration_unit" text,
"completed_at" date,
"contribution_mode" text DEFAULT 'flexible'::text,
"next_due_date" date,
"frequency" text
);

CREATE TABLE public."transactions" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"account_id" uuid,
"to_account_id" uuid,
"category_id" uuid,
"amount" numeric DEFAULT 0 NOT NULL,
"type" text NOT NULL,
"date" date NOT NULL,
"note" text,
"created_at" timestamp with time zone DEFAULT now(),
"updated_at" timestamp with time zone DEFAULT now(),
"recurring_transaction_id" uuid,
"recurring_posted_for_date" date,
"savings_goal_id" uuid,
"goal_contribution_id" uuid,
"source_type" text DEFAULT 'manual'::text,
"recurring_occurrence_key" text,
"account_name_snapshot" text,
"to_account_name_snapshot" text
);

CREATE TABLE public."user_settings" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"onboarding_complete" boolean DEFAULT false,
"currency" text DEFAULT '$'::text,
"currency_placement" text DEFAULT 'before'::text,
"number_format" text DEFAULT 'comma'::text,
"date_format" text DEFAULT 'MM/DD/YYYY'::text,
"theme" text DEFAULT 'light'::text,
"shift25th" boolean DEFAULT false,
"auto_sweep" boolean DEFAULT false,
"created_at" timestamp with time zone DEFAULT now(),
"updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE public."accounts" ADD CONSTRAINT "accounts_type_category_valid" CHECK ((type = ANY (ARRAY['checking'::text, 'savings'::text, 'cash'::text, 'investment'::text])) AND category = 'asset'::text OR (type = ANY (ARRAY['credit_card'::text, 'loan'::text])) AND category = 'liability'::text OR type = 'other'::text AND (category = ANY (ARRAY['asset'::text, 'liability'::text])));
ALTER TABLE public."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY (id);
ALTER TABLE public."budget_plans" ADD CONSTRAINT "budget_plans_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE public."budget_plans" ADD CONSTRAINT "budget_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."budget_plans" ADD CONSTRAINT "budget_plans_pkey" PRIMARY KEY (id);
ALTER TABLE public."budget_plans" ADD CONSTRAINT "budget_plans_user_id_category_id_month_key" UNIQUE (user_id, category_id, month);
ALTER TABLE public."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE public."categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY (id);
ALTER TABLE public."cero_schema_migrations" ADD CONSTRAINT "cero_schema_migrations_pkey" PRIMARY KEY (version);
ALTER TABLE public."goal_contributions" ADD CONSTRAINT "goal_contributions_amount_check" CHECK (amount > 0::numeric);
ALTER TABLE public."goal_contributions" ADD CONSTRAINT "goal_contributions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE public."goal_contributions" ADD CONSTRAINT "goal_contributions_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE;
ALTER TABLE public."goal_contributions" ADD CONSTRAINT "goal_contributions_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE public."goal_contributions" ADD CONSTRAINT "goal_contributions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."goal_contributions" ADD CONSTRAINT "goal_contributions_pkey" PRIMARY KEY (id);
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_duration_count_check" CHECK (duration_count IS NULL OR duration_count > 0);
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_duration_unit_check" CHECK (duration_unit IS NULL OR (duration_unit = ANY (ARRAY['weeks'::text, 'months'::text, 'years'::text])));
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_payment_mode_check" CHECK (payment_mode IS NULL OR (payment_mode = ANY (ARRAY['fixed'::text, 'flexible'::text])));
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_amount_check" CHECK (amount > 0::numeric);
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_frequency_check" CHECK (frequency = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text]));
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_schedule_anchor_day_valid" CHECK (schedule_anchor_day IS NULL OR schedule_anchor_day >= 1 AND schedule_anchor_day <= 31);
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_type_check" CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text]));
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transfer_destination_check" CHECK (type = 'transfer'::text AND to_account_id IS NOT NULL OR type <> 'transfer'::text AND to_account_id IS NULL);
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_last_posted_transaction_id_fkey" FOREIGN KEY (last_posted_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_to_account_id_fkey" FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY (id);
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goal_contribution_mode_check" CHECK (contribution_mode IS NULL OR (contribution_mode = ANY (ARRAY['fixed'::text, 'flexible'::text])));
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goal_duration_count_check" CHECK (duration_count IS NULL OR duration_count > 0);
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goal_duration_unit_check" CHECK (duration_unit IS NULL OR (duration_unit = ANY (ARRAY['weeks'::text, 'months'::text, 'years'::text])));
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goals_current_amount_check" CHECK (current_amount >= 0::numeric);
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goals_frequency_check" CHECK (frequency IS NULL OR (frequency = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])));
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goals_target_amount_check" CHECK (target_amount > 0::numeric);
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."savings_goals" ADD CONSTRAINT "savings_goals_pkey" PRIMARY KEY (id);
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_amount_positive" CHECK (amount > 0::numeric);
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_type_valid" CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text]));
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_goal_contribution_id_fkey" FOREIGN KEY (goal_contribution_id) REFERENCES goal_contributions(id) ON DELETE SET NULL;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_recurring_transaction_id_fkey" FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_savings_goal_id_fkey" FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id) ON DELETE SET NULL;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_to_account_id_fkey" FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY (id);
ALTER TABLE public."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."user_settings" ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY (id);
ALTER TABLE public."user_settings" ADD CONSTRAINT "user_settings_user_id_key" UNIQUE (user_id);

CREATE INDEX budget_plans_user_month_budget_type_idx ON public.budget_plans USING btree (user_id, month, budget_type);
CREATE INDEX budget_plans_user_month_source_idx ON public.budget_plans USING btree (user_id, month, source_type, source_id);
CREATE UNIQUE INDEX budget_plans_user_month_source_unique ON public.budget_plans USING btree (user_id, month, source_type, source_id) WHERE (source_id IS NOT NULL);
CREATE INDEX goal_contributions_goal_date_idx ON public.goal_contributions USING btree (goal_id, contribution_date);
CREATE INDEX goal_contributions_goal_id_idx ON public.goal_contributions USING btree (goal_id);
CREATE INDEX goal_contributions_transaction_id_idx ON public.goal_contributions USING btree (transaction_id);
CREATE INDEX goal_contributions_user_goal_idx ON public.goal_contributions USING btree (user_id, goal_id);
CREATE INDEX goal_contributions_user_id_idx ON public.goal_contributions USING btree (user_id);
CREATE UNIQUE INDEX goal_contributions_user_occurrence_unique ON public.goal_contributions USING btree (user_id, occurrence_key) WHERE (occurrence_key IS NOT NULL);
CREATE INDEX recurring_transactions_active_due_idx ON public.recurring_transactions USING btree (user_id, is_active, next_due_date);
CREATE INDEX recurring_transactions_next_due_date_idx ON public.recurring_transactions USING btree (next_due_date);
CREATE INDEX recurring_transactions_user_archived_idx ON public.recurring_transactions USING btree (user_id, is_archived);
CREATE INDEX recurring_transactions_user_due_idx ON public.recurring_transactions USING btree (user_id, next_due_date);
CREATE INDEX recurring_transactions_user_id_idx ON public.recurring_transactions USING btree (user_id);
CREATE INDEX savings_goals_active_idx ON public.savings_goals USING btree (user_id, is_archived);
CREATE INDEX savings_goals_user_id_idx ON public.savings_goals USING btree (user_id);
CREATE INDEX savings_goals_user_target_date_idx ON public.savings_goals USING btree (user_id, target_date);
CREATE INDEX transactions_goal_contribution_id_idx ON public.transactions USING btree (goal_contribution_id);
CREATE INDEX transactions_recurring_transaction_id_idx ON public.transactions USING btree (recurring_transaction_id);
CREATE INDEX transactions_savings_goal_id_idx ON public.transactions USING btree (savings_goal_id);
CREATE INDEX transactions_user_date_idx ON public.transactions USING btree (user_id, date DESC);
CREATE INDEX transactions_user_goal_contribution_idx ON public.transactions USING btree (user_id, goal_contribution_id) WHERE (goal_contribution_id IS NOT NULL);
CREATE INDEX transactions_user_goal_idx ON public.transactions USING btree (user_id, savings_goal_id, goal_contribution_id);
CREATE INDEX transactions_user_recurring_idx ON public.transactions USING btree (user_id, recurring_transaction_id);
CREATE UNIQUE INDEX transactions_user_recurring_occurrence_unique ON public.transactions USING btree (user_id, recurring_occurrence_key) WHERE ((recurring_transaction_id IS NOT NULL) AND (recurring_occurrence_key IS NOT NULL));
CREATE INDEX transactions_user_source_type_idx ON public.transactions USING btree (user_id, source_type);

CREATE OR REPLACE FUNCTION public.cero_create_debt_rule(p_name text, p_amount numeric, p_total_amount numeric, p_duration_count integer, p_duration_unit text, p_payment_mode text, p_category_id uuid, p_account_id uuid, p_to_account_id uuid, p_frequency text, p_start_date date, p_next_due_date date, p_is_active boolean DEFAULT true, p_icon text DEFAULT NULL::text, p_color text DEFAULT NULL::text, p_note text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
uid uuid := auth.uid();

rule_id uuid;
tx_id uuid;

source_category text;
liability_category text;

first_payment numeric;
first_payment_date date;
next_date date;
occurrence_key text;
BEGIN
/* -------------------------------------------------------
* AUTHENTICATION
* ------------------------------------------------------- */
IF uid IS NULL THEN
RAISE EXCEPTION 'Authentication required';
END IF;


/* -------------------------------------------------------
* VALIDATE DEBT
* ------------------------------------------------------- */
IF NULLIF(TRIM(p_name), '') IS NULL THEN
RAISE EXCEPTION 'Debt name is required';
END IF;

IF p_amount IS NULL OR p_amount <= 0 THEN
RAISE EXCEPTION 'Payment amount must be greater than zero';
END IF;

IF p_total_amount IS NULL OR p_total_amount <= 0 THEN
RAISE EXCEPTION 'Total debt must be greater than zero';
END IF;

IF p_amount > p_total_amount THEN
RAISE EXCEPTION 'Payment amount cannot exceed total debt';
END IF;

IF COALESCE(p_payment_mode, 'fixed') NOT IN ('fixed', 'flexible') THEN
RAISE EXCEPTION 'Invalid payment mode';
END IF;

IF p_account_id IS NULL THEN
RAISE EXCEPTION 'Source account is required';
END IF;

IF p_to_account_id IS NULL OR p_to_account_id = p_account_id THEN
RAISE EXCEPTION 'Valid liability account is required';
END IF;

IF p_start_date IS NULL OR p_next_due_date IS NULL THEN
RAISE EXCEPTION 'Debt schedule date is required';
END IF;


/* -------------------------------------------------------
* LOCK + VERIFY SOURCE ACCOUNT
* ------------------------------------------------------- */
SELECT category
INTO source_category
FROM public.accounts
WHERE id = p_account_id
AND user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'Source account not found';
END IF;


/* -------------------------------------------------------
* LOCK + VERIFY LIABILITY ACCOUNT
* ------------------------------------------------------- */
SELECT category
INTO liability_category
FROM public.accounts
WHERE id = p_to_account_id
AND user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'Liability account not found';
END IF;

IF COALESCE(liability_category, '') <> 'liability' THEN
RAISE EXCEPTION 'Destination account must be a liability account';
END IF;


/* -------------------------------------------------------
* CREATE RECURRING DEBT RULE
* ------------------------------------------------------- */
INSERT INTO public.recurring_transactions (
user_id,
name,
amount,
total_amount,
duration_count,
duration_unit,
payment_mode,
type,
category_id,
account_id,
to_account_id,
frequency,
start_date,
next_due_date,
is_active,
icon,
color,
note
)
VALUES (
uid,
TRIM(p_name),
p_amount,
p_total_amount,
p_duration_count,
p_duration_unit,
COALESCE(p_payment_mode, 'fixed'),
'transfer',
p_category_id,
p_account_id,
p_to_account_id,
p_frequency,
p_start_date,
p_next_due_date,
COALESCE(p_is_active, true),
p_icon,
p_color,
NULLIF(TRIM(p_note), '')
)
RETURNING id INTO rule_id;


/* -------------------------------------------------------
* ADD NEW DEBT PRINCIPAL TO LIABILITY
*
* Important:
* Add to existing liability balance.
* Never replace existing debt.
* ------------------------------------------------------- */
UPDATE public.accounts
SET
balance = COALESCE(balance, 0) + p_total_amount,
updated_at = NOW()
WHERE id = p_to_account_id
AND user_id = uid;


/* -------------------------------------------------------
* FLEXIBLE DEBT
*
* Current Cero behavior:
* creating a flexible debt does NOT automatically post
* a payment.
* ------------------------------------------------------- */
IF COALESCE(p_payment_mode, 'fixed') = 'flexible' THEN
RETURN rule_id;
END IF;


/* -------------------------------------------------------
* FIXED DEBT — POST INSTALLMENT #1
* ------------------------------------------------------- */
first_payment_date := p_start_date;
first_payment := LEAST(p_amount, p_total_amount);

occurrence_key :=
rule_id::text || ':' || first_payment_date::text;


INSERT INTO public.transactions (
user_id,
account_id,
to_account_id,
category_id,
amount,
type,
date,
note,
recurring_transaction_id,
recurring_posted_for_date,
source_type,
recurring_occurrence_key
)
VALUES (
uid,
p_account_id,
p_to_account_id,
p_category_id,
first_payment,
'transfer',
first_payment_date,
COALESCE(
NULLIF(TRIM(p_note), ''),
TRIM(p_name) || ' · Recurring'
),
rule_id,
first_payment_date,
'recurring',
occurrence_key
)
RETURNING id INTO tx_id;


/* -------------------------------------------------------
* APPLY INSTALLMENT TO SOURCE ACCOUNT
*
* Same account-direction rules used by the existing
* cero_post_recurring_transaction RPC.
* ------------------------------------------------------- */
UPDATE public.accounts
SET
balance =
COALESCE(balance, 0)
+
CASE
WHEN category = 'liability'
THEN first_payment
ELSE -first_payment
END,
updated_at = NOW()
WHERE id = p_account_id
AND user_id = uid;


/* -------------------------------------------------------
* APPLY INSTALLMENT TO LIABILITY
*
* We already added the full principal above.
* Now payment #1 reduces the liability.
* ------------------------------------------------------- */
UPDATE public.accounts
SET
balance =
COALESCE(balance, 0)
+
CASE
WHEN category = 'liability'
THEN -first_payment
ELSE first_payment
END,
updated_at = NOW()
WHERE id = p_to_account_id
AND user_id = uid;


/* -------------------------------------------------------
* CALCULATE INSTALLMENT #2 DATE
*
* Matches the existing recurring posting RPC.
* ------------------------------------------------------- */
next_date :=
CASE p_frequency
WHEN 'weekly'
THEN first_payment_date + 7

WHEN 'biweekly'
THEN first_payment_date + 14

WHEN 'quarterly'
THEN (first_payment_date + INTERVAL '3 months')::date

WHEN 'yearly'
THEN (first_payment_date + INTERVAL '1 year')::date

ELSE
(first_payment_date + INTERVAL '1 month')::date
END;


/* -------------------------------------------------------
* ONE-PAYMENT DEBT
* ------------------------------------------------------- */
IF first_payment >= p_total_amount - 0.005 THEN

UPDATE public.recurring_transactions
SET
is_active = false,
completed_at = first_payment_date,
next_due_date = NULL,
last_posted_date = first_payment_date,
last_posted_transaction_id = tx_id,
updated_at = NOW()
WHERE id = rule_id
AND user_id = uid;

ELSE

/* -----------------------------------------------------
* NORMAL FIXED DEBT
* ----------------------------------------------------- */
UPDATE public.recurring_transactions
SET
next_due_date = next_date,
last_posted_date = first_payment_date,
last_posted_transaction_id = tx_id,
updated_at = NOW()
WHERE id = rule_id
AND user_id = uid;

END IF;


RETURN rule_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_create_transaction(p_amount numeric, p_type text, p_date date, p_account_id uuid, p_to_account_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
uid uuid := auth.uid();
tx_id uuid;
src_group text;
dst_group text;
begin
if uid is null then
raise exception 'Authentication required';
end if;

if p_amount is null or p_amount <= 0 then
raise exception 'Invalid amount';
end if;

if p_type not in ('income','expense','transfer') then
raise exception 'Invalid transaction type';
end if;

if p_account_id is null or p_date is null then
raise exception 'Account and date are required';
end if;

if p_type = 'transfer'
and (p_to_account_id is null or p_to_account_id = p_account_id) then
raise exception 'Valid destination account required';
end if;

if p_type <> 'transfer' and p_to_account_id is not null then
raise exception 'Destination only allowed for transfers';
end if;

select category
into src_group
from public.accounts
where id = p_account_id
and user_id = uid
for update;

if not found then
raise exception 'Account not found';
end if;

if p_type = 'transfer' then
select category
into dst_group
from public.accounts
where id = p_to_account_id
and user_id = uid
for update;

if not found then
raise exception 'Destination account not found';
end if;
end if;

if p_category_id is not null
and not exists (
select 1
from public.categories
where id = p_category_id
and user_id = uid
) then
raise exception 'Category not found';
end if;

insert into public.transactions (
user_id,
amount,
type,
date,
account_id,
to_account_id,
category_id,
note,
source_type
)
values (
uid,
p_amount,
p_type,
p_date,
p_account_id,
case when p_type = 'transfer' then p_to_account_id end,
p_category_id,
nullif(trim(p_note), ''),
'manual'
)
returning id into tx_id;

update public.accounts
set balance =
coalesce(balance, 0) +
case
when p_type = 'income' then
case when category = 'liability' then -p_amount else p_amount end
else
case when category = 'liability' then p_amount else -p_amount end
end,
updated_at = now()
where id = p_account_id
and user_id = uid;

if p_type = 'transfer' then
update public.accounts
set balance =
coalesce(balance, 0) +
case when category = 'liability' then -p_amount else p_amount end,
updated_at = now()
where id = p_to_account_id
and user_id = uid;
end if;

return tx_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cero_delete_account(p_account_id uuid, p_replacement_account_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
uid uuid := auth.uid();

old_name text;
old_balance numeric := 0;
old_category text;

replacement_name text;
replacement_category text;

has_future_references boolean := false;
needs_replacement boolean := false;
closure_note text;
BEGIN
IF uid IS NULL THEN
RAISE EXCEPTION 'Authentication required';
END IF;

IF p_account_id IS NULL THEN
RAISE EXCEPTION 'Account is required';
END IF;

-- Lock account being deleted.
SELECT
name,
COALESCE(balance, 0),
category
INTO
old_name,
old_balance,
old_category
FROM public.accounts
WHERE id = p_account_id
AND user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'Account not found';
END IF;

IF p_replacement_account_id = p_account_id THEN
RAISE EXCEPTION 'Replacement account must be different';
END IF;

-- Check whether future activity still uses this account.
SELECT
EXISTS (
SELECT 1
FROM public.recurring_transactions
WHERE user_id = uid
AND (
account_id = p_account_id
OR to_account_id = p_account_id
)
)
OR EXISTS (
SELECT 1
FROM public.savings_goals
WHERE user_id = uid
AND (
from_account_id = p_account_id
OR to_account_id = p_account_id
)
)
INTO has_future_references;

needs_replacement :=
COALESCE(old_balance, 0) <> 0
OR has_future_references;

IF needs_replacement
AND p_replacement_account_id IS NULL
THEN
RAISE EXCEPTION
'Replacement account is required before deleting this account';
END IF;

-- Validate and lock replacement.
IF p_replacement_account_id IS NOT NULL THEN
SELECT
name,
category
INTO
replacement_name,
replacement_category
FROM public.accounts
WHERE id = p_replacement_account_id
AND user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'Replacement account not found';
END IF;

-- Never mix asset and liability balances.
IF old_category IS DISTINCT FROM replacement_category THEN
RAISE EXCEPTION
'Replacement account must have the same account category';
END IF;
END IF;

-- Preserve the deleted account's identity in old history.
UPDATE public.transactions
SET
account_name_snapshot = CASE
WHEN account_id = p_account_id
THEN COALESCE(account_name_snapshot, old_name)
ELSE account_name_snapshot
END,

to_account_name_snapshot = CASE
WHEN to_account_id = p_account_id
THEN COALESCE(to_account_name_snapshot, old_name)
ELSE to_account_name_snapshot
END,

updated_at = NOW()
WHERE user_id = uid
AND (
account_id = p_account_id
OR to_account_id = p_account_id
);

-- Move any remaining balance and record one closure entry.
IF COALESCE(old_balance, 0) <> 0 THEN

UPDATE public.accounts
SET
balance = COALESCE(balance, 0) + old_balance,
updated_at = NOW()
WHERE id = p_replacement_account_id
AND user_id = uid;

closure_note :=
CASE
WHEN old_category = 'liability'
THEN 'Liability account closure'
ELSE 'Account closure'
END;

INSERT INTO public.transactions (
user_id,
amount,
type,
date,
note,
account_id,
to_account_id,
account_name_snapshot,
to_account_name_snapshot,
source_type
)
VALUES (
uid,
ABS(old_balance),
'transfer',
CURRENT_DATE,
closure_note,

-- Source account is intentionally NULL because it is
-- about to be deleted. Its identity survives in snapshot.
NULL,

p_replacement_account_id,
old_name,
replacement_name,
'manual'
);
END IF;

-- Future recurring activity follows replacement.
UPDATE public.recurring_transactions
SET
account_id = CASE
WHEN account_id = p_account_id
THEN p_replacement_account_id
ELSE account_id
END,

to_account_id = CASE
WHEN to_account_id = p_account_id
THEN p_replacement_account_id
ELSE to_account_id
END,

updated_at = NOW()
WHERE user_id = uid
AND (
account_id = p_account_id
OR to_account_id = p_account_id
);

-- Future goal account references follow replacement.
UPDATE public.savings_goals
SET
from_account_id = CASE
WHEN from_account_id = p_account_id
THEN p_replacement_account_id
ELSE from_account_id
END,

to_account_id = CASE
WHEN to_account_id = p_account_id
THEN p_replacement_account_id
ELSE to_account_id
END,

updated_at = NOW()
WHERE user_id = uid
AND (
from_account_id = p_account_id
OR to_account_id = p_account_id
);

-- FK SET NULL preserves historical rows.
DELETE FROM public.accounts
WHERE id = p_account_id
AND user_id = uid;

IF NOT FOUND THEN
RAISE EXCEPTION 'Account could not be deleted';
END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_delete_transaction(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
uid uuid := auth.uid();
t public.transactions%rowtype;
r public.recurring_transactions%rowtype;
g public.savings_goals%rowtype;
gc public.goal_contributions%rowtype;
src_group text;
dst_group text;
latest_tx_id uuid;
latest_tx_date date;
restored_next_due date;
goal_new_amount numeric := 0;
begin
if uid is null then
raise exception 'Authentication required';
end if;

/* Lock transaction */
select *
into t
from public.transactions
where id = p_transaction_id
and user_id = uid
for update;

if not found then
raise exception 'Transaction not found';
end if;

/* Lock recurring rule */
if t.recurring_transaction_id is not null then
select *
into r
from public.recurring_transactions
where id = t.recurring_transaction_id
and user_id = uid
for update;
end if;

/* Lock goal */
if t.savings_goal_id is not null then
select *
into g
from public.savings_goals
where id = t.savings_goal_id
and user_id = uid
for update;

/* Find linked goal contribution */
if t.goal_contribution_id is not null then
select *
into gc
from public.goal_contributions
where id = t.goal_contribution_id
and user_id = uid
for update;
else
select *
into gc
from public.goal_contributions
where transaction_id = t.id
and user_id = uid
limit 1
for update;
end if;
end if;

/* Lock source account */
if t.account_id is not null then
select category
into src_group
from public.accounts
where id = t.account_id
and user_id = uid
for update;

if not found then
raise exception 'Source account not found';
end if;
end if;

/* Lock destination account */
if t.type = 'transfer'
and t.to_account_id is not null then
select category
into dst_group
from public.accounts
where id = t.to_account_id
and user_id = uid
for update;

if not found then
raise exception 'Destination account not found';
end if;
end if;

/* Reverse source account effect */
if t.account_id is not null then
update public.accounts
set balance =
coalesce(balance, 0)
-
case
when t.type = 'income' then
case
when category = 'liability' then -t.amount
else t.amount
end
else
case
when category = 'liability' then t.amount
else -t.amount
end
end,
updated_at = now()
where id = t.account_id
and user_id = uid;
end if;

/* Reverse transfer destination effect */
if t.type = 'transfer'
and t.to_account_id is not null then
update public.accounts
set balance =
coalesce(balance, 0)
-
case
when category = 'liability' then -t.amount
else t.amount
end,
updated_at = now()
where id = t.to_account_id
and user_id = uid;
end if;

/* Delete linked goal contribution */
if gc.id is not null then
delete from public.goal_contributions
where id = gc.id
and user_id = uid;
end if;

/* Delete transaction */
delete from public.transactions
where id = t.id
and user_id = uid;

/* =====================================================
RESTORE SAVINGS GOAL
===================================================== */
if g.id is not null then
select least(
g.target_amount,
greatest(
0,
coalesce(g.starting_amount, 0)
+ coalesce(sum(c.amount), 0)
)
)
into goal_new_amount
from public.goal_contributions c
where c.goal_id = g.id
and c.user_id = uid;

if coalesce(g.contribution_mode, 'flexible') = 'fixed' then
/*
* Rebuild fixed schedule and find the first occurrence
* that is no longer posted.
*/
with recursive goal_schedule as (
select
1 as occurrence_number,
g.start_date as due_date

union all

select
occurrence_number + 1,
public.cero_goal_next_due_date(
due_date,
g.frequency
)
from goal_schedule
where occurrence_number < coalesce(g.duration_count, 1)
)
select s.due_date
into restored_next_due
from goal_schedule s
where not exists (
select 1
from public.goal_contributions c
where c.goal_id = g.id
and c.user_id = uid
and c.occurrence_key =
g.id::text || ':' || s.due_date::text
)
order by s.occurrence_number
limit 1;

update public.savings_goals
set current_amount = goal_new_amount,
next_due_date = restored_next_due,
completed_at =
case
when goal_new_amount >= target_amount - 0.005
then completed_at
else null
end,
updated_at = now()
where id = g.id
and user_id = uid;

else
update public.savings_goals
set current_amount = goal_new_amount,
completed_at =
case
when goal_new_amount >= target_amount - 0.005
then completed_at
else null
end,
updated_at = now()
where id = g.id
and user_id = uid;
end if;
end if;

/* =====================================================
RESTORE RECURRING RULE
===================================================== */
if t.recurring_transaction_id is not null
and r.id is not null then

select
tx.id,
tx.date
into
latest_tx_id,
latest_tx_date
from public.transactions tx
where tx.user_id = uid
and tx.recurring_transaction_id = r.id
order by
tx.recurring_posted_for_date desc nulls last,
tx.date desc,
tx.created_at desc,
tx.id desc
limit 1;

if coalesce(r.payment_mode, 'fixed') = 'fixed'
and t.recurring_posted_for_date is not null then
restored_next_due := t.recurring_posted_for_date;

elsif t.recurring_posted_for_date is not null then
restored_next_due := t.recurring_posted_for_date;

else
restored_next_due :=
coalesce(
r.next_due_date,
r.start_date
);
end if;

update public.recurring_transactions
set is_active = true,
completed_at = null,
next_due_date = restored_next_due,
last_posted_transaction_id = latest_tx_id,
last_posted_date = latest_tx_date,
updated_at = now()
where id = r.id
and user_id = uid;
end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cero_goal_next_due_date(p_date date, p_frequency text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
declare
v_year integer;
v_month integer;
v_day integer;
v_target_year integer;
v_target_month integer;
v_last_day integer;
v_month_offset integer;
v_total_months integer;
begin
if p_date is null then
return null;
end if;

if coalesce(p_frequency, 'monthly') = 'weekly' then
return p_date + 7;
end if;

if p_frequency = 'biweekly' then
return p_date + 14;
end if;

v_year := extract(year from p_date)::integer;
v_month := extract(month from p_date)::integer;
v_day := extract(day from p_date)::integer;

if p_frequency = 'yearly' then
v_target_year := v_year + 1;
v_target_month := v_month;
else
v_month_offset :=
case
when p_frequency = 'quarterly' then 3
else 1
end;

v_total_months :=
(v_year * 12) + (v_month - 1) + v_month_offset;

v_target_year := floor(v_total_months / 12.0)::integer;
v_target_month := mod(v_total_months, 12) + 1;
end if;

v_last_day :=
extract(
day from (
make_date(v_target_year, v_target_month, 1)
+ interval '1 month'
- interval '1 day'
)
)::integer;

return make_date(
v_target_year,
v_target_month,
least(v_day, v_last_day)
);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cero_next_anchored_due_date(p_occurrence_date date, p_frequency text, p_anchor_day integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
target_month date;
last_day integer;
anchor_day integer;
BEGIN
IF p_occurrence_date IS NULL THEN
RETURN NULL;
END IF;

anchor_day := LEAST(
31,
GREATEST(
1,
COALESCE(
p_anchor_day,
EXTRACT(DAY FROM p_occurrence_date)::integer
)
)
);

-- Day-based schedules do not need month anchoring.
IF p_frequency = 'weekly' THEN
RETURN p_occurrence_date + 7;
END IF;

IF p_frequency = 'biweekly' THEN
RETURN p_occurrence_date + 14;
END IF;

-- Move from the first of the month so February cannot
-- permanently change a 29th/30th/31st schedule.
IF p_frequency = 'quarterly' THEN
target_month :=
(date_trunc('month', p_occurrence_date)::date
+ interval '3 months')::date;

ELSIF p_frequency = 'yearly' THEN
target_month :=
(date_trunc('month', p_occurrence_date)::date
+ interval '1 year')::date;

ELSE
target_month :=
(date_trunc('month', p_occurrence_date)::date
+ interval '1 month')::date;
END IF;

last_day :=
EXTRACT(
DAY FROM (
date_trunc('month', target_month)
+ interval '1 month'
- interval '1 day'
)
)::integer;

RETURN make_date(
EXTRACT(YEAR FROM target_month)::integer,
EXTRACT(MONTH FROM target_month)::integer,
LEAST(anchor_day, last_day)
);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_post_auto_sweep(p_month text, p_amount numeric, p_transaction_date date, p_source_account_id uuid, p_destination_account_id uuid, p_category_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
uid uuid := auth.uid();
tx_id uuid;

source_balance numeric;
destination_balance numeric;

occurrence_key text;
sweep_note text;
BEGIN
/* Authentication */
IF uid IS NULL THEN
RAISE EXCEPTION 'Authentication required';
END IF;

/* Validate month */
IF p_month IS NULL
OR p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
THEN
RAISE EXCEPTION 'Invalid budget month';
END IF;

/* Validate amount */
IF p_amount IS NULL OR p_amount <= 0 THEN
RAISE EXCEPTION 'Auto-sweep amount must be greater than zero';
END IF;

IF p_transaction_date IS NULL THEN
RAISE EXCEPTION 'Transaction date is required';
END IF;

IF p_source_account_id IS NULL
OR p_destination_account_id IS NULL
THEN
RAISE EXCEPTION 'Source and destination accounts are required';
END IF;

IF p_source_account_id = p_destination_account_id THEN
RAISE EXCEPTION 'Source and destination accounts must be different';
END IF;

IF p_category_id IS NULL THEN
RAISE EXCEPTION 'Savings category is required';
END IF;

/*
* Stable key for exactly one Auto-Sweep per user/month.
*
* The existing partial unique index on:
* (user_id, recurring_occurrence_key)
* applies when recurring_transaction_id is NOT NULL,
* so Auto-Sweep needs its own database-level duplicate check.
*/
occurrence_key := 'AUTO_SWEEP:' || p_month;
sweep_note := '[AUTO_SWEEP:' || p_month ||
'] Month-end surplus moved to savings';

/*
* Serialize Auto-Sweep attempts for this user.
*
* Locking user_settings gives all concurrent Auto-Sweep requests
* for the same user a common lock before checking for duplicates.
*/
PERFORM 1
FROM public.user_settings
WHERE user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'User settings not found';
END IF;

/*
* Check again INSIDE the database transaction.
* This also recognizes Auto-Sweeps created by the old frontend
* because they already contain the same note marker.
*/
SELECT id
INTO tx_id
FROM public.transactions
WHERE user_id = uid
AND (
recurring_occurrence_key = occurrence_key
OR note LIKE '[AUTO_SWEEP:' || p_month || ']%'
)
LIMIT 1;

IF tx_id IS NOT NULL THEN
RETURN tx_id;
END IF;

/*
* Lock source account.
*/
SELECT balance
INTO source_balance
FROM public.accounts
WHERE id = p_source_account_id
AND user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'Source account not found';
END IF;

/*
* Lock destination account.
*/
SELECT balance
INTO destination_balance
FROM public.accounts
WHERE id = p_destination_account_id
AND user_id = uid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'Destination account not found';
END IF;

/*
* Verify category belongs to the authenticated user.
*/
PERFORM 1
FROM public.categories
WHERE id = p_category_id
AND user_id = uid;

IF NOT FOUND THEN
RAISE EXCEPTION 'Savings category not found';
END IF;

/*
* Recheck source balance after acquiring the account lock.
*/
IF COALESCE(source_balance, 0) < p_amount THEN
RAISE EXCEPTION 'Source account balance is too low';
END IF;

/*
* Create the Auto-Sweep transaction.
*/
INSERT INTO public.transactions (
user_id,
amount,
type,
date,
note,
category_id,
account_id,
to_account_id,
source_type,
recurring_occurrence_key
)
VALUES (
uid,
p_amount,
'transfer',
p_transaction_date,
sweep_note,
p_category_id,
p_source_account_id,
p_destination_account_id,
'manual',
occurrence_key
)
RETURNING id INTO tx_id;

/*
* Apply both account effects in the same PostgreSQL transaction.
*/
UPDATE public.accounts
SET
balance = COALESCE(balance, 0) - p_amount,
updated_at = NOW()
WHERE id = p_source_account_id
AND user_id = uid;

UPDATE public.accounts
SET
balance = COALESCE(balance, 0) + p_amount,
updated_at = NOW()
WHERE id = p_destination_account_id
AND user_id = uid;

RETURN tx_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_post_goal_contribution(p_goal_id uuid, p_amount numeric DEFAULT NULL::numeric, p_contribution_date date DEFAULT CURRENT_DATE, p_posted_for_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
v_uid uuid := auth.uid();
v_goal public.savings_goals%rowtype;
v_amount numeric;
v_remaining numeric;
v_fixed_amount numeric;
v_due date;
v_key text;
v_contribution_id uuid;
v_transaction_id uuid;
v_new_amount numeric;
begin
if v_uid is null then
raise exception 'Authentication required';
end if;

select *
into v_goal
from public.savings_goals
where id = p_goal_id
and user_id = v_uid
for update;

if not found then
raise exception 'Savings goal not found';
end if;

if v_goal.is_archived then
raise exception 'Savings goal is archived';
end if;

if v_goal.from_account_id is null
or v_goal.to_account_id is null
or v_goal.from_account_id = v_goal.to_account_id then
raise exception 'Invalid goal accounts';
end if;

-- Lock both accounts.
perform 1
from public.accounts
where user_id = v_uid
and id in (v_goal.from_account_id, v_goal.to_account_id)
order by id
for update;

if (
select count(*)
from public.accounts
where user_id = v_uid
and id in (v_goal.from_account_id, v_goal.to_account_id)
) <> 2 then
raise exception 'Goal account not found';
end if;

v_remaining :=
greatest(
0,
v_goal.target_amount - v_goal.current_amount
);

if v_remaining <= 0.005 then
raise exception 'Savings goal is already fully funded';
end if;

-- FIXED GOAL
if coalesce(v_goal.contribution_mode, 'flexible') = 'fixed' then

if coalesce(v_goal.duration_count, 0) <= 0 then
raise exception 'Invalid fixed goal schedule';
end if;

v_fixed_amount :=
(v_goal.target_amount - v_goal.starting_amount)
/ v_goal.duration_count;

if v_fixed_amount <= 0 then
raise exception 'Invalid fixed contribution amount';
end if;

v_due := coalesce(
v_goal.next_due_date,
v_goal.start_date
);

if p_posted_for_date is not null
and p_posted_for_date <> v_due then
raise exception 'Wrong scheduled goal occurrence';
end if;

v_key := v_goal.id::text || ':' || v_due::text;

if exists (
select 1
from public.goal_contributions
where user_id = v_uid
and occurrence_key = v_key
) then
raise exception 'Goal occurrence already posted';
end if;

v_amount := least(v_fixed_amount, v_remaining);

-- FLEXIBLE GOAL
else
if p_amount is null or p_amount <= 0 then
raise exception 'Enter a valid contribution amount';
end if;

v_amount := least(p_amount, v_remaining);
v_key := null;
v_due := null;
end if;

-- Create contribution.
insert into public.goal_contributions (
user_id,
goal_id,
account_id,
amount,
contribution_date,
note,
occurrence_key
)
values (
v_uid,
v_goal.id,
v_goal.from_account_id,
v_amount,
coalesce(p_contribution_date, current_date),
coalesce(
nullif(trim(p_note), ''),
'Contribution to ' || v_goal.name
),
v_key
)
returning id into v_contribution_id;

-- Create transaction.
insert into public.transactions (
user_id,
account_id,
to_account_id,
amount,
type,
date,
note,
savings_goal_id,
goal_contribution_id,
source_type
)
values (
v_uid,
v_goal.from_account_id,
v_goal.to_account_id,
v_amount,
'transfer',
coalesce(p_contribution_date, current_date),
coalesce(
nullif(trim(p_note), ''),
'Contribution to ' || v_goal.name
),
v_goal.id,
v_contribution_id,
'goal'
)
returning id into v_transaction_id;

-- Link contribution to transaction.
update public.goal_contributions
set transaction_id = v_transaction_id,
updated_at = now()
where id = v_contribution_id;

-- Source account.
update public.accounts
set balance =
coalesce(balance, 0) +
case
when category = 'liability' then v_amount
else -v_amount
end,
updated_at = now()
where id = v_goal.from_account_id
and user_id = v_uid;

-- Destination account.
update public.accounts
set balance =
coalesce(balance, 0) +
case
when category = 'liability' then -v_amount
else v_amount
end,
updated_at = now()
where id = v_goal.to_account_id
and user_id = v_uid;

v_new_amount :=
least(
v_goal.target_amount,
v_goal.current_amount + v_amount
);

-- Completed goal.
if v_new_amount >= v_goal.target_amount - 0.005 then
update public.savings_goals
set current_amount = v_new_amount,
completed_at = coalesce(
completed_at,
coalesce(p_contribution_date, current_date)
),
next_due_date = null,
updated_at = now()
where id = v_goal.id;

-- Advance fixed schedule.
elsif coalesce(v_goal.contribution_mode, 'flexible') = 'fixed' then
update public.savings_goals
set current_amount = v_new_amount,
next_due_date =
public.cero_goal_next_due_date(
v_due,
v_goal.frequency
),
updated_at = now()
where id = v_goal.id;

-- Flexible goal.
else
update public.savings_goals
set current_amount = v_new_amount,
updated_at = now()
where id = v_goal.id;
end if;

return v_transaction_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cero_post_recurring_transaction(p_recurring_transaction_id uuid, p_amount numeric DEFAULT NULL::numeric, p_transaction_date date DEFAULT CURRENT_DATE, p_posted_for_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
uid uuid := auth.uid();

r public.recurring_transactions%rowtype;

tx_id uuid;
src_group text;
dst_group text;

tx_amount numeric;
tx_date date;
occurrence_date date;
occurrence_key text;

paid_total numeric := 0;
paid_for_occurrence numeric := 0;

remaining_debt numeric;
remaining_for_occurrence numeric;

completes_debt boolean := false;
completes_occurrence boolean := false;

next_date date;
begin
if uid is null then
raise exception 'Authentication required';
end if;

/*
* Lock recurring rule.
*/
select *
into r
from public.recurring_transactions
where id = p_recurring_transaction_id
and user_id = uid
for update;

if not found then
raise exception 'Recurring rule not found';
end if;

if r.is_archived then
raise exception 'Recurring rule is archived';
end if;

if not r.is_active then
raise exception 'Recurring rule is paused or completed';
end if;

tx_date := coalesce(
p_transaction_date,
current_date
);

occurrence_date := coalesce(
p_posted_for_date,
r.next_due_date,
tx_date
);

tx_amount := coalesce(
p_amount,
r.amount
);

if tx_amount is null or tx_amount <= 0 then
raise exception 'Invalid amount';
end if;

if r.type not in (
'income',
'expense',
'transfer'
) then
raise exception 'Invalid recurring transaction type';
end if;

if r.account_id is null then
raise exception 'Source account is required';
end if;

if r.type = 'transfer'
and (
r.to_account_id is null
or r.to_account_id = r.account_id
) then
raise exception 'Valid destination account required';
end if;


/*
* ---------------------------------------------------------
* FIXED OCCURRENCE
* ---------------------------------------------------------
*
* A fixed rule can only post once for a scheduled
* occurrence.
*/
if coalesce(r.payment_mode, 'fixed') = 'fixed' then

occurrence_key :=
r.id::text || ':' || occurrence_date::text;

if exists (
select 1
from public.transactions t
where t.user_id = uid
and t.recurring_transaction_id = r.id
and (
t.recurring_occurrence_key = occurrence_key
or t.recurring_posted_for_date = occurrence_date
)
) then
raise exception
'This recurring occurrence has already been posted';
end if;

else

/*
* Flexible payments may have multiple transactions
* against the same occurrence.
*/
occurrence_key := null;

end if;


/*
* ---------------------------------------------------------
* LOCK ACCOUNTS
* ---------------------------------------------------------
*/

select category
into src_group
from public.accounts
where id = r.account_id
and user_id = uid
for update;

if not found then
raise exception 'Source account not found';
end if;


if r.type = 'transfer' then

select category
into dst_group
from public.accounts
where id = r.to_account_id
and user_id = uid
for update;

if not found then
raise exception 'Destination account not found';
end if;

end if;


/*
* ---------------------------------------------------------
* FINITE DEBT
* ---------------------------------------------------------
*/

if r.type = 'transfer'
and r.total_amount is not null
and r.total_amount > 0 then

select coalesce(sum(t.amount), 0)
into paid_total
from public.transactions t
where t.user_id = uid
and t.recurring_transaction_id = r.id;

remaining_debt :=
greatest(
0,
r.total_amount - paid_total
);

if remaining_debt <= 0.005 then
raise exception 'Debt is already paid off';
end if;

/*
* Never allow overpayment beyond the total debt.
*/
tx_amount :=
least(
tx_amount,
remaining_debt
);

completes_debt :=
tx_amount >= remaining_debt - 0.005;

end if;


/*
* ---------------------------------------------------------
* FLEXIBLE PERIOD CALCULATION
* ---------------------------------------------------------
*
* Example:
*
* Planned = 1000
*
* payment 1 = 300
* payment 2 = 300
* payment 3 = 400
*
* All three belong to the SAME occurrence_date.
*
* next_due_date advances only after the cumulative
* amount reaches 1000.
*/

if coalesce(r.payment_mode, 'fixed') = 'flexible' then

select coalesce(sum(t.amount), 0)
into paid_for_occurrence
from public.transactions t
where t.user_id = uid
and t.recurring_transaction_id = r.id
and t.recurring_posted_for_date = occurrence_date;

remaining_for_occurrence :=
greatest(
0,
r.amount - paid_for_occurrence
);

/*
* If the period was already covered, do not silently
* attach another payment to the completed period.
*/
if remaining_for_occurrence <= 0.005 then
raise exception
'This recurring period has already been fully paid';
end if;

/*
* A flexible payment may finish the current period.
*
* We intentionally allow a payment larger than the
* remaining period amount because the overall debt
* balance is still the hard upper limit.
*/
completes_occurrence :=
paid_for_occurrence + tx_amount
>= r.amount - 0.005;

else

/*
* One fixed payment consumes one occurrence.
*/
completes_occurrence := true;

end if;


/*
* ---------------------------------------------------------
* CREATE TRANSACTION
* ---------------------------------------------------------
*/

insert into public.transactions (
user_id,
account_id,
to_account_id,
category_id,
amount,
type,
date,
note,

recurring_transaction_id,
recurring_posted_for_date,

source_type,
recurring_occurrence_key
)
values (
uid,

r.account_id,

case
when r.type = 'transfer'
then r.to_account_id
else null
end,

r.category_id,

tx_amount,

r.type,

tx_date,

coalesce(
nullif(trim(p_note), ''),
nullif(trim(r.note), ''),
r.name || ' · Recurring'
),

r.id,

occurrence_date,

'recurring',

occurrence_key
)
returning id into tx_id;


/*
* ---------------------------------------------------------
* SOURCE ACCOUNT BALANCE
* ---------------------------------------------------------
*/

update public.accounts
set
balance =
coalesce(balance, 0)
+
case

when r.type = 'income' then

case
when category = 'liability'
then -tx_amount
else tx_amount
end

else

case
when category = 'liability'
then tx_amount
else -tx_amount
end

end,

updated_at = now()

where id = r.account_id
and user_id = uid;


/*
* ---------------------------------------------------------
* DESTINATION ACCOUNT
* ---------------------------------------------------------
*/

if r.type = 'transfer' then

update public.accounts
set
balance =
coalesce(balance, 0)
+
case
when category = 'liability'
then -tx_amount
else tx_amount
end,

updated_at = now()

where id = r.to_account_id
and user_id = uid;

end if;


/*
* ---------------------------------------------------------
* CALCULATE NEXT OCCURRENCE
* ---------------------------------------------------------
*/

next_date := public.cero_next_anchored_due_date(occurrence_date, r.frequency, r.schedule_anchor_day);


/*
* ---------------------------------------------------------
* COMPLETE ENTIRE DEBT
* ---------------------------------------------------------
*/

if completes_debt then

update public.recurring_transactions
set
is_active = false,
completed_at = tx_date,
next_due_date = null,

last_posted_date = tx_date,
last_posted_transaction_id = tx_id,

updated_at = now()

where id = r.id
and user_id = uid;


/*
* ---------------------------------------------------------
* PERIOD COMPLETED
* ---------------------------------------------------------
*/

elsif completes_occurrence then

update public.recurring_transactions
set
next_due_date = next_date,

last_posted_date = tx_date,
last_posted_transaction_id = tx_id,

updated_at = now()

where id = r.id
and user_id = uid;


/*
* ---------------------------------------------------------
* FLEXIBLE PARTIAL PAYMENT
* ---------------------------------------------------------
*
* Keep next_due_date unchanged.
*/

else

update public.recurring_transactions
set
last_posted_date = tx_date,
last_posted_transaction_id = tx_id,
updated_at = now()

where id = r.id
and user_id = uid;

end if;


return tx_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cero_reset_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
uid uuid := auth.uid();
BEGIN
IF uid IS NULL THEN
RAISE EXCEPTION 'Authentication required';
END IF;

DELETE FROM public.goal_contributions
WHERE user_id = uid;

DELETE FROM public.budget_plans
WHERE user_id = uid;

DELETE FROM public.transactions
WHERE user_id = uid;

DELETE FROM public.recurring_transactions
WHERE user_id = uid;

DELETE FROM public.savings_goals
WHERE user_id = uid;

DELETE FROM public.accounts
WHERE user_id = uid;

DELETE FROM public.categories
WHERE user_id = uid;

DELETE FROM public.user_settings
WHERE user_id = uid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_set_recurring_schedule_anchor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
-- New rule:
-- establish its permanent calendar-day anchor from the scheduled due date.
IF TG_OP = 'INSERT' THEN
IF NEW.schedule_anchor_day IS NULL THEN
NEW.schedule_anchor_day :=
EXTRACT(
DAY FROM COALESCE(NEW.next_due_date, NEW.start_date)
)::smallint;
END IF;

RETURN NEW;
END IF;

RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cero_update_transaction(p_transaction_id uuid, p_amount numeric, p_type text, p_date date, p_account_id uuid, p_to_account_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
uid uuid := auth.uid();
old_tx public.transactions%rowtype;
old_src text;
old_dst text;
new_src text;
new_dst text;
begin
if uid is null then
raise exception 'Authentication required';
end if;

if p_amount is null or p_amount <= 0 then
raise exception 'Invalid amount';
end if;

if p_type not in ('income', 'expense', 'transfer') then
raise exception 'Invalid transaction type';
end if;

if p_account_id is null or p_date is null then
raise exception 'Account and date are required';
end if;

if p_type = 'transfer' then
if p_to_account_id is null or p_to_account_id = p_account_id then
raise exception 'Valid destination account required';
end if;
else
if p_to_account_id is not null then
raise exception 'Destination only allowed for transfers';
end if;
end if;

select *
into old_tx
from public.transactions
where id = p_transaction_id
and user_id = uid
for update;

if not found then
raise exception 'Transaction not found';
end if;

if coalesce(old_tx.source_type, 'manual') <> 'manual'
or old_tx.recurring_transaction_id is not null
or old_tx.savings_goal_id is not null
or old_tx.goal_contribution_id is not null then
raise exception 'Linked transaction cannot be edited here';
end if;

if p_category_id is not null then
if not exists (
select 1
from public.categories
where id = p_category_id
and user_id = uid
) then
raise exception 'Category not found';
end if;
end if;

select category
into old_src
from public.accounts
where id = old_tx.account_id
and user_id = uid
for update;

if not found then
raise exception 'Original account not found';
end if;

if old_tx.type = 'transfer' then
select category
into old_dst
from public.accounts
where id = old_tx.to_account_id
and user_id = uid
for update;

if not found then
raise exception 'Original destination not found';
end if;
end if;

select category
into new_src
from public.accounts
where id = p_account_id
and user_id = uid
for update;

if not found then
raise exception 'Account not found';
end if;

if p_type = 'transfer' then
select category
into new_dst
from public.accounts
where id = p_to_account_id
and user_id = uid
for update;

if not found then
raise exception 'Destination account not found';
end if;
end if;

-- Reverse old source balance effect
update public.accounts
set balance = coalesce(balance, 0) -
case
when old_tx.type = 'income' then
case when old_src = 'liability'
then -old_tx.amount
else old_tx.amount
end
else
case when old_src = 'liability'
then old_tx.amount
else -old_tx.amount
end
end,
updated_at = now()
where id = old_tx.account_id
and user_id = uid;

-- Reverse old transfer destination
if old_tx.type = 'transfer' then
update public.accounts
set balance = coalesce(balance, 0) -
case when old_dst = 'liability'
then -old_tx.amount
else old_tx.amount
end,
updated_at = now()
where id = old_tx.to_account_id
and user_id = uid;
end if;

-- Apply new source balance effect
update public.accounts
set balance = coalesce(balance, 0) +
case
when p_type = 'income' then
case when new_src = 'liability'
then -p_amount
else p_amount
end
else
case when new_src = 'liability'
then p_amount
else -p_amount
end
end,
updated_at = now()
where id = p_account_id
and user_id = uid;

-- Apply new transfer destination
if p_type = 'transfer' then
update public.accounts
set balance = coalesce(balance, 0) +
case when new_dst = 'liability'
then -p_amount
else p_amount
end,
updated_at = now()
where id = p_to_account_id
and user_id = uid;
end if;

update public.transactions
set
amount = p_amount,
type = p_type,
date = p_date,
account_id = p_account_id,
to_account_id = case
when p_type = 'transfer' then p_to_account_id
else null
end,
category_id = p_category_id,
note = nullif(trim(p_note), ''),
updated_at = now()
where id = p_transaction_id
and user_id = uid;

return p_transaction_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_savings_goal_current_amount(goal_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
UPDATE public.savings_goals g
SET current_amount = LEAST(
g.target_amount,
GREATEST(
0,
COALESCE(g.starting_amount, 0)
+ COALESCE((
SELECT SUM(c.amount)
FROM public.goal_contributions c
WHERE c.goal_id = g.id
), 0)
)
),
updated_at = NOW()
WHERE g.id = goal_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
cmd record;
BEGIN
FOR cmd IN
SELECT *
FROM pg_event_trigger_ddl_commands()
WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
AND object_type IN ('table','partitioned table')
LOOP
IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
BEGIN
EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
END;
ELSE
RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
END IF;
END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
new.updated_at = now();
return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_savings_goal_current_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
IF TG_OP = 'INSERT' THEN
PERFORM public.recalculate_savings_goal_current_amount(NEW.goal_id);
RETURN NEW;

ELSIF TG_OP = 'UPDATE' THEN
PERFORM public.recalculate_savings_goal_current_amount(NEW.goal_id);

IF OLD.goal_id IS DISTINCT FROM NEW.goal_id THEN
PERFORM public.recalculate_savings_goal_current_amount(OLD.goal_id);
END IF;

RETURN NEW;

ELSIF TG_OP = 'DELETE' THEN
PERFORM public.recalculate_savings_goal_current_amount(OLD.goal_id);
RETURN OLD;
END IF;

RETURN NULL;
END;
$function$;

CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_budget_plans_updated_at BEFORE UPDATE ON budget_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_goal_contributions_updated_at BEFORE UPDATE ON goal_contributions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sync_goal_amount_after_delete AFTER DELETE ON goal_contributions FOR EACH ROW EXECUTE FUNCTION sync_savings_goal_current_amount();
CREATE TRIGGER sync_goal_amount_after_insert AFTER INSERT ON goal_contributions FOR EACH ROW EXECUTE FUNCTION sync_savings_goal_current_amount();
CREATE TRIGGER sync_goal_amount_after_update AFTER UPDATE ON goal_contributions FOR EACH ROW EXECUTE FUNCTION sync_savings_goal_current_amount();
CREATE TRIGGER set_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cero_set_recurring_schedule_anchor BEFORE INSERT ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION cero_set_recurring_schedule_anchor();
CREATE TRIGGER set_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."budget_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cero_schema_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."goal_contributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."recurring_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."savings_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_delete_own" ON public."accounts" FOR DELETE USING ((user_id = auth.uid()));
CREATE POLICY "accounts_insert_own" ON public."accounts" FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "accounts_select_own" ON public."accounts" FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "accounts_update_own" ON public."accounts" FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "budget_plans_delete_own" ON public."budget_plans" FOR DELETE USING ((user_id = auth.uid()));
CREATE POLICY "budget_plans_insert_own" ON public."budget_plans" FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "budget_plans_select_own" ON public."budget_plans" FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "budget_plans_update_own" ON public."budget_plans" FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "categories_delete_own" ON public."categories" FOR DELETE USING ((user_id = auth.uid()));
CREATE POLICY "categories_insert_own" ON public."categories" FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "categories_select_own" ON public."categories" FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "categories_update_own" ON public."categories" FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can create own goal contributions" ON public."goal_contributions" FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own goal contributions" ON public."goal_contributions" FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can read own goal contributions" ON public."goal_contributions" FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own goal contributions" ON public."goal_contributions" FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can create own recurring transactions" ON public."recurring_transactions" FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own recurring transactions" ON public."recurring_transactions" FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can read own recurring transactions" ON public."recurring_transactions" FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own recurring transactions" ON public."recurring_transactions" FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can create own savings goals" ON public."savings_goals" FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own savings goals" ON public."savings_goals" FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can read own savings goals" ON public."savings_goals" FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own savings goals" ON public."savings_goals" FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "transactions_delete_own" ON public."transactions" FOR DELETE USING ((user_id = auth.uid()));
CREATE POLICY "transactions_insert_own" ON public."transactions" FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "transactions_select_own" ON public."transactions" FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "transactions_update_own" ON public."transactions" FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "user_settings_delete_own" ON public."user_settings" FOR DELETE USING ((user_id = auth.uid()));
CREATE POLICY "user_settings_insert_own" ON public."user_settings" FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "user_settings_select_own" ON public."user_settings" FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "user_settings_update_own" ON public."user_settings" FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

REVOKE ALL ON FUNCTION public."cero_create_debt_rule"(p_name text, p_amount numeric, p_total_amount numeric, p_duration_count integer, p_duration_unit text, p_payment_mode text, p_category_id uuid, p_account_id uuid, p_to_account_id uuid, p_frequency text, p_start_date date, p_next_due_date date, p_is_active boolean, p_icon text, p_color text, p_note text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_create_debt_rule"(p_name text, p_amount numeric, p_total_amount numeric, p_duration_count integer, p_duration_unit text, p_payment_mode text, p_category_id uuid, p_account_id uuid, p_to_account_id uuid, p_frequency text, p_start_date date, p_next_due_date date, p_is_active boolean, p_icon text, p_color text, p_note text) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_create_transaction"(p_amount numeric, p_type text, p_date date, p_account_id uuid, p_to_account_id uuid, p_category_id uuid, p_note text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_create_transaction"(p_amount numeric, p_type text, p_date date, p_account_id uuid, p_to_account_id uuid, p_category_id uuid, p_note text) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_delete_account"(p_account_id uuid, p_replacement_account_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_delete_account"(p_account_id uuid, p_replacement_account_id uuid) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_delete_transaction"(p_transaction_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_delete_transaction"(p_transaction_id uuid) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_goal_next_due_date"(p_date date, p_frequency text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_goal_next_due_date"(p_date date, p_frequency text) TO PUBLIC;
REVOKE ALL ON FUNCTION public."cero_next_anchored_due_date"(p_occurrence_date date, p_frequency text, p_anchor_day integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public."cero_post_auto_sweep"(p_month text, p_amount numeric, p_transaction_date date, p_source_account_id uuid, p_destination_account_id uuid, p_category_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_post_auto_sweep"(p_month text, p_amount numeric, p_transaction_date date, p_source_account_id uuid, p_destination_account_id uuid, p_category_id uuid) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_post_goal_contribution"(p_goal_id uuid, p_amount numeric, p_contribution_date date, p_posted_for_date date, p_note text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_post_goal_contribution"(p_goal_id uuid, p_amount numeric, p_contribution_date date, p_posted_for_date date, p_note text) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_post_recurring_transaction"(p_recurring_transaction_id uuid, p_amount numeric, p_transaction_date date, p_posted_for_date date, p_note text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_post_recurring_transaction"(p_recurring_transaction_id uuid, p_amount numeric, p_transaction_date date, p_posted_for_date date, p_note text) TO authenticated;
REVOKE ALL ON FUNCTION public."cero_reset_user_data"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_reset_user_data"() TO authenticated;
REVOKE ALL ON FUNCTION public."cero_set_recurring_schedule_anchor"() FROM PUBLIC;
REVOKE ALL ON FUNCTION public."cero_update_transaction"(p_transaction_id uuid, p_amount numeric, p_type text, p_date date, p_account_id uuid, p_to_account_id uuid, p_category_id uuid, p_note text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."cero_update_transaction"(p_transaction_id uuid, p_amount numeric, p_type text, p_date date, p_account_id uuid, p_to_account_id uuid, p_category_id uuid, p_note text) TO authenticated;
REVOKE ALL ON FUNCTION public."recalculate_savings_goal_current_amount"(goal_uuid uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public."rls_auto_enable"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."rls_auto_enable"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public."rls_auto_enable"() TO anon;
GRANT EXECUTE ON FUNCTION public."rls_auto_enable"() TO authenticated;
GRANT EXECUTE ON FUNCTION public."rls_auto_enable"() TO service_role;
REVOKE ALL ON FUNCTION public."set_updated_at"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."set_updated_at"() TO PUBLIC;
REVOKE ALL ON FUNCTION public."sync_savings_goal_current_amount"() FROM PUBLIC;

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."accounts" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."accounts" TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."accounts" TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."budget_plans" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."budget_plans" TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."budget_plans" TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."categories" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."categories" TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."categories" TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."cero_schema_migrations" TO anon;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."cero_schema_migrations" TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."cero_schema_migrations" TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."goal_contributions" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."goal_contributions" TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."goal_contributions" TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."recurring_transactions" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."recurring_transactions" TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."recurring_transactions" TO service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."savings_goals" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."savings_goals" TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public."savings_goals" TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."transactions" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."transactions" TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."transactions" TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_settings" TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_settings" TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_settings" TO service_role;

-- Cero-owned event trigger. Supabase platform-managed event triggers are intentionally excluded.
-- Creating event triggers can require elevated database privileges; the function is preserved above.
-- The existing production project already has ensure_rls installed.

COMMIT;