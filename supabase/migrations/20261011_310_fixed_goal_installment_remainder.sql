-- Phase 1G: remainder-aware fixed goal installments.
-- Existing transactions, balances, and historical contributions are untouched.
-- A fixed goal with 11,000 / 3 posts 3,667 + 3,667 + 3,666.
-- Fractional goals are rounded to cents and the final contribution is capped
-- to the remaining target.
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

-- Use a stable installment amount, with the final payment equal to the
-- exact remaining target. Integer-valued goals keep whole-unit installments;
-- fractional targets are rounded to currency cents.
v_fixed_amount := CASE
 WHEN mod(v_goal.target_amount - coalesce(v_goal.starting_amount,0),1)=0
 THEN ceil((v_goal.target_amount - coalesce(v_goal.starting_amount,0))/v_goal.duration_count)
 ELSE round((v_goal.target_amount - coalesce(v_goal.starting_amount,0))/v_goal.duration_count,2)
 END;

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

