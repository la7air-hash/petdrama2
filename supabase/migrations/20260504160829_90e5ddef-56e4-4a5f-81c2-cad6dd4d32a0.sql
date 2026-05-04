
-- profiles
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  pro_until timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- usage_events
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_key text,
  kind text not null check (kind in ('generate','regenerate','remix')),
  created_at timestamptz not null default now()
);
create index idx_usage_user on public.usage_events (user_id, created_at desc);
create index idx_usage_anon on public.usage_events (anon_key, created_at desc);
alter table public.usage_events enable row level security;

create policy "Users can view own usage"
  on public.usage_events for select
  using (auth.uid() = user_id);

-- auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill existing users
insert into public.profiles (user_id)
  select id from auth.users on conflict do nothing;

-- read-only usage summary for the UI
create or replace function public.get_my_usage()
returns table(plan text, used_today int, used_month int, daily_limit int, monthly_limit int, remix_allowed boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p text;
begin
  if uid is null then
    return query select 'anon'::text, 0, 0, 1, 1, false;
    return;
  end if;
  select coalesce(pr.plan, 'free') into p from public.profiles pr where pr.user_id = uid;
  if p is null then p := 'free'; end if;
  if p = 'pro' then
    return query select
      'pro'::text,
      0,
      (select count(*)::int from public.usage_events ue where ue.user_id = uid and ue.created_at > now() - interval '30 days'),
      0,
      150,
      true;
  else
    return query select
      'free'::text,
      (select count(*)::int from public.usage_events ue where ue.user_id = uid and ue.created_at::date = (now() at time zone 'utc')::date),
      0,
      5,
      0,
      false;
  end if;
end;
$$;

-- atomic consume — used by edge functions via service role
create or replace function public.consume_usage(_user_id uuid, _anon_key text, _kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
  used int;
  new_id uuid;
begin
  if _kind not in ('generate','regenerate','remix') then
    return jsonb_build_object('ok', false, 'error', 'bad_kind');
  end if;

  if _user_id is null then
    -- anonymous: 1 lifetime per anon_key
    if _anon_key is null or length(_anon_key) < 8 then
      return jsonb_build_object('ok', false, 'error', 'anon_required');
    end if;
    if _kind = 'remix' then
      return jsonb_build_object('ok', false, 'error', 'pro_only');
    end if;
    select count(*) into used from public.usage_events where anon_key = _anon_key;
    if used >= 1 then
      return jsonb_build_object('ok', false, 'error', 'anon_limit', 'signupRequired', true);
    end if;
    insert into public.usage_events (anon_key, kind) values (_anon_key, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', 'anon', 'remaining', 0, 'event_id', new_id);
  end if;

  select coalesce(pr.plan, 'free') into p from public.profiles pr where pr.user_id = _user_id;
  if p is null then p := 'free'; end if;

  if _kind = 'remix' and p <> 'pro' then
    return jsonb_build_object('ok', false, 'error', 'pro_only');
  end if;

  if p = 'pro' then
    select count(*) into used from public.usage_events
      where user_id = _user_id and created_at > now() - interval '30 days';
    if used >= 150 then
      return jsonb_build_object('ok', false, 'error', 'monthly_limit_reached');
    end if;
    insert into public.usage_events (user_id, kind) values (_user_id, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', 'pro', 'remaining', 150 - used - 1, 'event_id', new_id);
  else
    select count(*) into used from public.usage_events
      where user_id = _user_id and created_at::date = (now() at time zone 'utc')::date;
    if used >= 5 then
      return jsonb_build_object('ok', false, 'error', 'daily_limit_reached');
    end if;
    insert into public.usage_events (user_id, kind) values (_user_id, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', 'free', 'remaining', 5 - used - 1, 'event_id', new_id);
  end if;
end;
$$;

-- refund (delete the just-recorded event) when AI fails
create or replace function public.refund_usage(_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.usage_events where id = _event_id;
end;
$$;
