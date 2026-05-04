
# Tiered Pricing + Server-Enforced Usage Limits

Scope: limits + Pro flag + Pricing page rewrite + Remix lock. **No real Stripe checkout.** Pro is structurally supported (DB flag) but cannot be bought yet — admin-only flip for now.

## Tiers (no "unlimited" anywhere)

| Tier | Creations | Remix | Watermark | HD |
|------|-----------|-------|-----------|----|
| Anonymous | 1 total / device | ❌ | ✅ | ❌ |
| Free (logged in) | 5 / day (UTC) | ❌ → upgrade prompt | ✅ | ❌ |
| Pro | 150 / month (rolling 30d) | ✅ | ❌ | ✅ |

"Creation" = generate / regenerate / new-batch / remix. Save, Download, Copy, Share, public views are NOT counted.

## 1. Database changes (one migration)

```sql
-- profiles: one row per auth user, default 'free'
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  pro_until timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = user_id);
-- no insert/update policy → only service-role (edge functions / admin) can flip plan

-- usage_events: one row per AI creation
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_key text,                       -- hashed device id when not logged in
  kind text not null check (kind in ('generate','regenerate','remix')),
  created_at timestamptz not null default now()
);
create index on public.usage_events (user_id, created_at desc);
create index on public.usage_events (anon_key, created_at desc);
alter table public.usage_events enable row level security;
create policy "read own usage" on public.usage_events
  for select using (auth.uid() = user_id);
-- no insert policy → only edge functions (service role) write

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill existing users
insert into public.profiles (user_id)
  select id from auth.users on conflict do nothing;

-- helper RPC: read-only summary for the UI
create or replace function public.get_my_usage()
returns table(plan text, used_today int, used_month int, daily_limit int, monthly_limit int, remix_allowed boolean)
language plpgsql stable security definer set search_path = public as $$
declare p text; uid uuid := auth.uid();
begin
  if uid is null then
    return query select 'anon'::text, 0, 0, 1, 1, false;
    return;
  end if;
  select coalesce(pr.plan,'free') into p from public.profiles pr where pr.user_id = uid;
  if p = 'pro' then
    return query select 'pro',
      0,
      (select count(*)::int from public.usage_events where user_id = uid and created_at > now() - interval '30 days'),
      0, 150, true;
  else
    return query select 'free',
      (select count(*)::int from public.usage_events where user_id = uid and created_at::date = (now() at time zone 'utc')::date),
      0, 5, 0, false;
  end if;
end $$;
```

(`credit_packs` table is NOT created — listed as future work only.)

## 2. New edge function: `usage-check`

Single endpoint the frontend calls **before** every AI action. It both checks AND records.

```text
POST /functions/v1/usage-check   (verify_jwt = false; we read JWT manually)
body: { kind: 'generate'|'regenerate'|'remix', anonKey?: string }
```

Logic (using service-role client):
1. Parse Authorization Bearer → `supabase.auth.getUser(token)` if present.
2. Resolve plan: anon / free / pro (default free if profile missing).
3. If `kind === 'remix'` and plan !== 'pro' → `403 { error:'pro_only' }`.
4. Count usage in window:
   - anon: lifetime count for `anon_key` >= 1 → `402 { error:'anon_limit', signupRequired:true }`
   - free: today's count >= 5 → `402 { error:'daily_limit_reached' }`
   - pro: last-30d count >= 150 → `402 { error:'monthly_limit_reached' }`
5. Otherwise `INSERT into usage_events` and return `{ ok:true, remaining, plan }`.

Atomicity: do count + insert inside one SQL function called from edge to avoid races (helper SECURITY DEFINER RPC `consume_usage(_kind, _anon_key)` returning the same shape; edge fn just thin-wraps it).

## 3. `drama-remix` edge function changes

At the top of the handler, before calling AI:
- Read JWT from `Authorization` header.
- If no user → `401`.
- Call `consume_usage('remix', null)` via service-role client.
- If response says `pro_only` → return `403 { error:'pro_only' }`.
- If `monthly_limit_reached` → return `402 { error:'monthly_limit_reached' }`.
- Else proceed with current AI flow.

Also add `[functions.usage-check] verify_jwt = false` to `supabase/config.toml`.

## 4. Frontend changes

### New
- `src/lib/anon-id.ts` — generate/persist a UUID in `localStorage` (`pd_anon_id`).
- `src/lib/usage.ts` — `checkUsage(kind)` POSTs to `usage-check`, includes JWT if present, otherwise sends `anonKey`. Returns `{ ok, plan, remaining, error? }`.
- `src/hooks/use-entitlements.ts` — on auth change calls `get_my_usage` RPC; exposes `{ plan, isPro, isAnon, usage, refresh() }`.
- `src/components/UsageMeter.tsx` — small chip "3 / 5 today" or "62 / 150 this month".
- `src/components/UpgradeModal.tsx` — reused dialog for pro_only / limit_reached / anon → signup.
- `src/components/ProBadge.tsx` — "PRO" sticker.

### Edited
- `src/pages/Create.tsx` — `onGenerate`: call `checkUsage('generate')` first; if not ok show UpgradeModal (or signup CTA for anon) and abort. On success, run existing local generation. Render `<UsageMeter>` in the sticky bar. After success, call `refresh()`.
- `src/pages/Result.tsx`:
  - Replace `const [isPro] = useState(false)` with `useEntitlements()`.
  - `onRegenerate` → `checkUsage('regenerate')` first.
  - `onDramaRemix` → if `!isPro` show UpgradeModal, **don't** call function. Otherwise the edge function still re-checks and consumes.
  - The Drama Remix CTA button shows a `<ProBadge>` + lock icon when `!isPro`.
  - `watermark` flag for `renderDramaPng` already uses `!isPro` → now driven by real value.
- `src/pages/Pricing.tsx` — full rewrite (see §5).
- `src/components/AccountPill.tsx` — show plan badge + tiny remaining counter.
- `supabase/config.toml` — add `[functions.usage-check]` block.

### Untouched
Gallery storage, public-share route, RLS on `gallery_items`, render pipeline, routing.

## 5. Pricing page copy

- **Free $0** — 5 creations per day, basic drama styles, personal gallery, small "Made with PetDrama" watermark, standard download. *No Drama Remix. No HD.*
- **Pro $9.99/month** (toggle: $79/year, save ~34%) — 150 creations per month, Drama Remix unlocked, all styles, no watermark, HD downloads, share links, personal cloud gallery.
- "Upgrade to Pro" button → opens modal: *"Pro checkout is coming soon. We're finalizing payments — leave your email to be notified."* (simple mailto / no-op for now). No live Stripe.
- Footnote: "Need more? One-time credit packs coming soon."
- Remove every occurrence of "Unlimited".

## 6. How each requirement is satisfied

- **Free vs Pro detection** → `profiles.plan`, surfaced via `useEntitlements()` and validated server-side in `usage-check` / `drama-remix`.
- **Remix lock** → UI hides/locks button + Upgrade modal; **edge function returns 403 `pro_only`** even if bypassed.
- **Counted actions** → only the three frontend code paths that produce AI output (Create generate, Result regenerate / new-batch, Drama Remix) call `checkUsage`. Save/Download/Copy/Share/public view never call it.
- **Anonymous cap** → `anon_key` (hashed UUID) row in `usage_events`; second attempt returns `anon_limit` → signup modal. Imperfect (clearable) but server-recorded.

## 7. Risks / limitations

- Anonymous limit is bypassable by clearing `localStorage`; acceptable for v1. Optional IP-based rate limit can be added later.
- No payments yet → no live Pro upgrade path; admins flip `profiles.plan='pro'` via SQL or future admin UI.
- Daily window is UTC-based; minor edge-of-day confusion possible.
- Existing logged-in users start as Free (backfill inserts default row).
- AI failures must NOT consume credit — current plan inserts BEFORE the AI call; if AI fails we should refund. Mitigation: in `drama-remix`, on AI failure, `delete` the just-inserted usage row (track its id from `consume_usage`). Same for `usage-check`-only flows (generate/regenerate are deterministic local code so no refund needed).

## 8. Implementation phases

1. **DB migration** (profiles, usage_events, trigger, RPCs).
2. **Edge**: `usage-check` function + `drama-remix` Pro/limit guard + config.toml.
3. **Frontend lib/hook**: anon-id, usage.ts, useEntitlements.
4. **UI gates**: Create + Result wired to `checkUsage`, Remix lock, UsageMeter, UpgradeModal.
5. **Pricing page** rewrite.
6. **Manual QA**: anon (1 then blocked), free (5 then blocked, remix blocked), pro (150 cap, remix works, no watermark).

## 9. Confirmation summary (delivered after build)

- Tables added: `profiles`, `usage_events`. Trigger: `on_auth_user_created`. RPCs: `get_my_usage`, `consume_usage`.
- Edge functions: new `usage-check`; updated `drama-remix` with Pro + limit guard.
- Free vs Pro: `profiles.plan` (default `'free'`), checked server-side every AI call; surfaced client-side via `useEntitlements`.
- Remix lock: UI hides button behind PRO badge → UpgradeModal; server returns 403 `pro_only` regardless.
- Counting: only `generate`/`regenerate`/`remix` insert a `usage_events` row; non-AI actions never call the check.
