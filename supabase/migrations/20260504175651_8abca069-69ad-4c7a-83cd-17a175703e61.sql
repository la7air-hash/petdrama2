
-- 1. Update plan check constraint to include standard + admin
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('free','standard','pro','admin'));

-- 2. Add standard_until for future Standard subscriptions
alter table public.profiles add column if not exists standard_until timestamptz;

-- 3. Rewrite consume_usage: separate buckets for standard (generate+regenerate) and remix
create or replace function public.consume_usage(_user_id uuid, _anon_key text, _kind text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p text;
  used int;
  new_id uuid;
  std_limit int;
  remix_limit int;
begin
  if _kind not in ('generate','regenerate','remix') then
    return jsonb_build_object('ok', false, 'error', 'bad_kind');
  end if;

  -- Anonymous: 1 standard creation lifetime, no remix
  if _user_id is null then
    if _anon_key is null or length(_anon_key) < 8 then
      return jsonb_build_object('ok', false, 'error', 'anon_required');
    end if;
    if _kind = 'remix' then
      return jsonb_build_object('ok', false, 'error', 'anon_limit', 'signupRequired', true);
    end if;
    select count(*) into used from public.usage_events
      where anon_key = _anon_key and kind in ('generate','regenerate');
    if used >= 1 then
      return jsonb_build_object('ok', false, 'error', 'anon_limit', 'signupRequired', true);
    end if;
    insert into public.usage_events (anon_key, kind) values (_anon_key, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', 'anon', 'remaining', 0, 'event_id', new_id);
  end if;

  select coalesce(pr.plan, 'free') into p from public.profiles pr where pr.user_id = _user_id;
  if p is null then p := 'free'; end if;

  -- Admin: log event but never block
  if p = 'admin' then
    insert into public.usage_events (user_id, kind) values (_user_id, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', 'admin', 'remaining', 999999, 'event_id', new_id);
  end if;

  -- Per-plan rolling 30-day limits
  if p = 'pro' then
    std_limit := 50; remix_limit := 20;
  elsif p = 'standard' then
    std_limit := 25; remix_limit := 10;
  else
    std_limit := 15; remix_limit := 5;
  end if;

  if _kind = 'remix' then
    select count(*) into used from public.usage_events
      where user_id = _user_id and kind = 'remix' and created_at > now() - interval '30 days';
    if used >= remix_limit then
      return jsonb_build_object('ok', false, 'error', 'monthly_remix_limit_reached');
    end if;
    insert into public.usage_events (user_id, kind) values (_user_id, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', p, 'remaining', remix_limit - used - 1, 'event_id', new_id);
  else
    select count(*) into used from public.usage_events
      where user_id = _user_id and kind in ('generate','regenerate') and created_at > now() - interval '30 days';
    if used >= std_limit then
      return jsonb_build_object('ok', false, 'error', 'monthly_standard_limit_reached');
    end if;
    insert into public.usage_events (user_id, kind) values (_user_id, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', p, 'remaining', std_limit - used - 1, 'event_id', new_id);
  end if;
end;
$$;

-- 4. Rewrite get_my_usage with separate counters
drop function if exists public.get_my_usage();
create or replace function public.get_my_usage()
returns table(
  plan text,
  standard_used int, standard_limit int,
  remix_used int, remix_limit int,
  is_admin boolean
)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  uid uuid := auth.uid();
  p text;
  std_l int; rem_l int;
begin
  if uid is null then
    return query select 'anon'::text, 0, 1, 0, 0, false;
    return;
  end if;
  select coalesce(pr.plan, 'free') into p from public.profiles pr where pr.user_id = uid;
  if p is null then p := 'free'; end if;

  if p = 'admin' then
    return query select 'admin'::text, 0, 999999, 0, 999999, true;
    return;
  end if;

  if p = 'pro' then std_l := 50; rem_l := 20;
  elsif p = 'standard' then std_l := 25; rem_l := 10;
  else std_l := 15; rem_l := 5;
  end if;

  return query select
    p,
    (select count(*)::int from public.usage_events ue
       where ue.user_id = uid and ue.kind in ('generate','regenerate')
         and ue.created_at > now() - interval '30 days'),
    std_l,
    (select count(*)::int from public.usage_events ue
       where ue.user_id = uid and ue.kind = 'remix'
         and ue.created_at > now() - interval '30 days'),
    rem_l,
    false;
end;
$$;

-- 5. Auto-promote the test admin email if it already exists
update public.profiles
  set plan = 'admin'
  where user_id in (select id from auth.users where lower(email) = 'la7.visuals@gmail.com');

-- 6. Make sure handle_new_user promotes the admin email on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (user_id, plan)
    values (new.id, case when lower(coalesce(new.email,'')) = 'la7.visuals@gmail.com' then 'admin' else 'free' end)
    on conflict (user_id) do update
      set plan = case when lower(coalesce(new.email,'')) = 'la7.visuals@gmail.com' then 'admin' else public.profiles.plan end;
  return new;
end;
$$;
