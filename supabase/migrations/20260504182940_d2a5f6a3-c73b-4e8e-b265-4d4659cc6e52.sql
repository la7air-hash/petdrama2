
-- 1. Update consume_usage with new free limits (10/3)
CREATE OR REPLACE FUNCTION public.consume_usage(_user_id uuid, _anon_key text, _kind text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  if p = 'admin' then
    insert into public.usage_events (user_id, kind) values (_user_id, _kind) returning id into new_id;
    return jsonb_build_object('ok', true, 'plan', 'admin', 'remaining', 999999, 'event_id', new_id);
  end if;

  if p = 'pro' then
    std_limit := 50; remix_limit := 20;
  elsif p = 'standard' then
    std_limit := 25; remix_limit := 10;
  else
    std_limit := 10; remix_limit := 3;
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
$function$;

-- 2. Update get_my_usage with new free limits
CREATE OR REPLACE FUNCTION public.get_my_usage()
 RETURNS TABLE(plan text, standard_used integer, standard_limit integer, remix_used integer, remix_limit integer, is_admin boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  else std_l := 10; rem_l := 3;
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
$function$;

-- 3. New gallery_remixes table
CREATE TABLE public.gallery_remixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id uuid NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_path text NOT NULL,
  caption text,
  quote text NOT NULL,
  hashtags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_remixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own remix variants"
  ON public.gallery_remixes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own remix variants"
  ON public.gallery_remixes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own remix variants"
  ON public.gallery_remixes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX gallery_remixes_item_created_idx
  ON public.gallery_remixes (gallery_item_id, created_at DESC);
