# PetDrama — 3 Fixes Plan

## Issue 1 — Per-user draft isolation (privacy)

**Root cause:** `localStorage` keys `petdrama:current` and `petdrama:gallery` are global, so when user B logs in on the same browser they see user A's last upload/draft on `/create`.

**Fix:**
1. **Namespace the active draft per identity.** In `src/lib/storage.ts`, change `KEY` from a constant to a function `draftKey(ownerId)` where `ownerId = "user:<uid>"` for logged-in users and `"anon"` for guests. `saveDraft/loadDraft/clearDraft` accept an owner id (or read it from a small in-module cache set by an auth listener).
2. **Add an auth listener at app boot** (`src/App.tsx` or a new `src/lib/draft-owner.ts`) that:
   - On `SIGNED_IN`, sets the active owner to that user id.
   - On `SIGNED_OUT`, sets it to `"anon"` and **clears the previous user's active draft** (`localStorage.removeItem` for that user's key) — but does NOT touch the gallery cache (RLS already protects cloud gallery; local mirror can keep prior owners' entries keyed by user too).
   - On `USER_UPDATED`/account swap (different uid than last seen), clear in-memory React state on `/create` via a small Zustand-less event (e.g. `window.dispatchEvent(new Event('petdrama:owner-changed'))`).
3. **`Create.tsx` reacts to owner change**:
   - On mount, only restore a draft if its owner matches the current uid.
   - Listen for `petdrama:owner-changed` and reset all local state (`imageDataUrl`, `petName`, `petType`, `styleId`, `activeCreationId`, `restored`, `hasGeneratedResult`, `restoredSnapshot`).
4. **Anon→login does not auto-import.** Anonymous draft stays under `anon` key; we do not migrate it into the user's namespace (matches requirement #2).
5. **Gallery localStorage** (`petdrama:gallery`) gets the same per-owner namespacing for symmetry, since Gallery page also reads it.

## Issue 2 — Pricing limits + typography

**Limit changes (DB):** new migration updating `consume_usage` and `get_my_usage`:
- Free: standard 15→**10**, remix 5→**3**.
- Standard/Pro/Admin unchanged.

**Frontend mirrors:**
- `src/hooks/use-entitlements.ts` `FREE_FALLBACK`: `standard_limit: 10, remix_limit: 3`.
- `src/pages/Pricing.tsx` Free bullets updated to "10 standard creations / month" and "3 Drama Remix / month". Standard/Pro copy unchanged.

**Typography fix in Pricing cards:**
- Replace `font-display text-6xl font-extrabold` price with a tighter scale: `text-4xl md:text-5xl` for the dollar amount and `text-base md:text-lg` for the `/month` suffix.
- Wrap price in a `flex items-baseline gap-1` so suffix sits cleanly next to the number without wrapping.
- Reduce card padding from `p-8` to `p-6 md:p-7` for breathing room on the smaller PRO card with the "Most popular" pill.
- Verify three columns stay equal-height with `h-full` on `StickerCard` and `flex flex-col` so the CTA stays pinned at bottom.

Buttons stay "Coming soon" (no Stripe).

## Issue 3 — Multiple Remix variants per Gallery item

**Recommended schema (safest, cleanest):** new table `gallery_remixes` (1:N from `gallery_items`). JSONB was considered but a child table gives proper RLS, ordered queries, individual delete, and signed-URL handling per row.

**Migration:**
```sql
create table public.gallery_remixes (
  id uuid primary key default gen_random_uuid(),
  gallery_item_id uuid not null references public.gallery_items(id) on delete cascade,
  user_id uuid not null,
  image_path text not null,
  caption text,
  quote text not null,
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.gallery_remixes enable row level security;
create policy "own remixes select" on public.gallery_remixes for select using (auth.uid() = user_id);
create policy "own remixes insert" on public.gallery_remixes for insert with check (auth.uid() = user_id);
create policy "own remixes delete" on public.gallery_remixes for delete using (auth.uid() = user_id);
create index on public.gallery_remixes (gallery_item_id, created_at desc);
```
- Keep `gallery_items.remix_image_path` for backward compatibility (treated as "Remix 0" if present and no rows in `gallery_remixes`).

**Storage layout:** `${user_id}/${gallery_item_id}/remix-${remix_id}.webp` (instead of overwriting `remix.webp`).

**Code changes (`src/lib/gallery-cloud.ts`):**
- New `addRemixVariant({ galleryItemId, dataUrl, drama })` → uploads to a new path, inserts row, returns variant with signed URL.
- New `listRemixVariants(galleryItemId)` → returns ordered variants with signed URLs.
- `listMyGallery()` extended: for each item, also fetch its remix variants (single batched query: `select * from gallery_remixes where gallery_item_id in (...) order by created_at`). Attach `remixes: RemixVariant[]` and a derived `latestRemix` (first variant if any, else legacy `remix_image_path`).
- `deleteGalleryItem()` already cascades via FK, but also remove all remix files from storage (list + remove) before deleting the row.
- `saveGalleryItem()` no longer uploads remix to a fixed path — remix saves now go through `addRemixVariant` from `Result.tsx`.

**`src/pages/Result.tsx`:**
- After a successful `drama-remix` call + render, call `addRemixVariant` instead of overwriting. Latest variant becomes the visible one.
- Quota: still call `checkUsage('remix')` before the AI call. Saving/displaying additional variants does not call `checkUsage`.

**`src/pages/Gallery.tsx` (modal):**
- One card per gallery item (unchanged grid).
- Modal gets a small variant strip: `[Original] [Remix 1] [Remix 2] …` (chips). Clicking switches the previewed image, caption/quote/hashtags, and what the Download button targets.
- Default selected: latest remix if any, else original (matches current behavior).

**Backward compatibility:**
- Legacy items with only `remix_image_path` and no `gallery_remixes` rows render as `[Original] [Remix]` exactly like today.
- No migration needed for existing rows; new remixes append to the new table.

**Public Share, Storage bucket, RLS on `gallery_items`, Google Auth — untouched.**

## Files likely to change
- `src/lib/storage.ts` (per-owner draft keying)
- `src/App.tsx` or new `src/lib/draft-owner.ts` (auth listener + event)
- `src/pages/Create.tsx` (owner-aware restore + reset listener)
- `src/pages/Pricing.tsx` (limits text + typography/layout)
- `src/hooks/use-entitlements.ts` (Free fallback 10/3)
- `src/lib/gallery-cloud.ts` (remix variants CRUD)
- `src/pages/Result.tsx` (append variant instead of overwrite)
- `src/pages/Gallery.tsx` (variant switcher in modal)
- New migration: update `consume_usage` + `get_my_usage` to 10/3, create `gallery_remixes` table + policies + index
- `src/integrations/supabase/types.ts` will auto-regenerate

## Risks
- **Auth listener double-clearing**: must distinguish "same user re-hydrating session" from "different user signed in" by comparing previous uid in module scope — otherwise refresh wipes the active draft.
- **Storage cleanup on delete**: need to list `${user_id}/${gallery_item_id}/` prefix because remix filenames are now random; if listing fails we still let the FK cascade delete DB rows (orphan files are private and harmless but should be logged).
- **Pricing typography on very narrow mobile**: verify `$9.99/month` doesn't wrap inside the PRO card after the tighter scale; fall back to stacking suffix below if needed.
- **Quota change is retroactive**: existing Free users who already used 11–15 creations this 30-day window will see "limit reached" immediately. Acceptable per prior auto-migration agreement, but worth noting.
- **No Stripe** — Standard/Pro upgrade buttons remain `toast("Coming soon")`.

After approval, I'll execute migration + code changes and redeploy `usage-check` and `drama-remix`.
