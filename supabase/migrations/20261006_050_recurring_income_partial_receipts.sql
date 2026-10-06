-- Recurring income may arrive in multiple deposits (for example salary + allowances).
-- Keep the scheduled occurrence open until cumulative receipts reach the planned amount.
-- The existing transaction update/delete RPCs remain responsible for atomic balance corrections.

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
if r.type <> 'income' and coalesce(r.payment_mode, 'fixed') = 'fixed' then

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

if r.type = 'income' or coalesce(r.payment_mode, 'fixed') = 'flexible' then

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


REVOKE ALL ON FUNCTION public.cero_post_recurring_transaction(uuid,numeric,date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cero_post_recurring_transaction(uuid,numeric,date,date,text) TO authenticated;
