## Phase 2 — Gallery Share Links

Add a public sharing system on top of the existing private cloud Gallery without changing how saving/listing/deleting works today.

---

### 1. Database changes (one migration)

Add three columns to `gallery_items`:

- `public_share_slug TEXT UNIQUE` — null until first share
- `share_enabled BOOLEAN NOT NULL DEFAULT false`
- `shared_at TIMESTAMPTZ` — null until first share

Index: `CREATE UNIQUE INDEX gallery_items_public_share_slug_key ON gallery_items (public_share_slug) WHERE public_share_slug IS NOT NULL;`

No changes to existing columns. No rename. No backfill needed (existing rows stay private).

### 2. Slug generation

Generate slugs server-side via a Postgres helper or in the edge function (preferred — see §6) using a 10-char base62 string (e.g. `nanoid`-style). Retry on unique conflict. Slug is opaque, not guessable, never includes user_id or pet name.

### 3. RLS / security plan

Keep all 4 existing policies on `gallery_items` (owner-only SELECT/INSERT/UPDATE/DELETE).

Add ONE additional policy:

```sql
create policy "Public can view shared gallery items"
on public.gallery_items
for select
to anon, authenticated
using (share_enabled = true and public_share_slug is not null);
```

Sensitive columns (`user_id`, `original_image_path`, `remix_image_path`, `creation_id`) are technically still selectable when the row is shared. To avoid leaking the user_id and storage paths to anonymous clients, the public page will NOT query the table directly. Instead it calls a public edge function (§6) that returns only display fields + signed image URLs.

The new RLS policy is needed so the edge function (using anon key + the unauthenticated request context) — or a SECURITY DEFINER RPC — can read shared rows. We will use a SECURITY DEFINER RPC `get_public_share(slug)` that returns only safe columns, so the public-select policy can be omitted entirely. **Recommended: SECURITY DEFINER RPC, no public-select RLS policy.** This keeps user_id and storage paths fully hidden.

### 4. Storage plan — recommendation: Option A (signed URLs)

The `gallery` bucket stays **private**. The public share edge function generates short-lived signed URLs (e.g. 24h TTL) for `original.webp` and `remix.webp` on each page request. The public page caches the signed URLs only for the session.

Why Option A over Option B (copy to public bucket):
- No duplicate storage cost
- Unsharing or deleting instantly revokes access (no orphan public copies)
- Avoids a public bucket which is harder to lock back down later
- Signed URLs are still hot-linkable for the OG preview window — fine because anyone with the slug already has access by design

Tradeoff: signed URLs expire, so OG image scrapers (WhatsApp/Facebook) see a fresh URL each fetch. This is fine because they re-scrape; the long-lived `og:image` URL is our own `/api/og?slug=…` endpoint (§7), not the raw storage URL.

### 5. Public route

New route `/p/:slug` → `src/pages/PublicShare.tsx`.

Page content:
- PetDrama branding header (logo, link to `/`)
- Card image (Original / Remix tabs if both exist; default to the row's `variant`)
- Pet name, pet role (style name), quote, caption, hashtag chips
- Share buttons (Copy / WhatsApp / Facebook / native Share / Download)
- Big CTA: "Create your own PetDrama →" linking to `/create`
- 404 state if slug not found / `share_enabled=false` / row deleted

No login required. No access to private data. No "browse all public" listing anywhere.

### 6. Edge functions

Two new edge functions, both `verify_jwt = true` for the toggle, `verify_jwt = false` for the public read.

a) `share-toggle` (authenticated)
   - Input: `{ gallery_item_id, enabled: boolean }`
   - Validates the item belongs to `auth.uid()`
   - If enabling and no slug yet: generates a unique slug, sets `share_enabled=true`, `shared_at=now()`, `public_share_slug=<slug>`
   - If enabling and slug exists: just sets `share_enabled=true`
   - If disabling: sets `share_enabled=false` (keeps slug so re-enabling restores the same URL)
   - Returns `{ slug, url }`

b) `public-share` (unauthenticated, `verify_jwt = false`)
   - Input: `?slug=…`
   - Calls SECURITY DEFINER SQL function `get_public_share(slug)` which returns only: `pet_name, pet_type, style_id, pet_role, quote, caption, hashtags, variant, original_image_path, remix_image_path` when `share_enabled=true`
   - Generates 24h signed URLs for the two image paths
   - Returns `{ petName, styleId, petRole, quote, caption, hashtags, variant, originalUrl, remixUrl }` — NO user_id, NO email, NO storage paths
   - Returns 404 JSON if not found

### 7. Open Graph previews — simple first version

SPAs can't serve dynamic per-route `<meta>` tags to scrapers because WhatsApp/Facebook don't run JS. Two options:

**v1 (simple, recommended):** ship static OG tags in `index.html` (current PetDrama brand image + generic title/description). All shared links show the same brand preview. Pros: zero infra. Cons: preview isn't personalised.

**v2 (later):** an edge function `og-share?slug=…` that returns HTML with per-slug `<meta>` tags and a redirect/refresh to `/p/:slug`. The shared URL becomes `…/og-share?slug=…`. Adds complexity (separate URL, image must be a stable public URL).

Plan for Phase 2: ship v1 only. Add a note in the plan doc that v2 is a follow-up.

### 8. Frontend changes — Gallery only, no redesign

Edit `src/pages/Gallery.tsx`:
- In the modal, add a Share section under the existing Download/Delete row:
  - "Share publicly" toggle (calls `share-toggle`)
  - When enabled: show the share URL (read-only input) + buttons:
    - Copy link
    - Native Share (uses `navigator.share` if available; tries `navigator.canShare({ files })` with the WEBP file fetched from the signed URL, else shares the URL)
    - WhatsApp (`https://wa.me/?text=<encoded url>`)
    - Facebook (`https://www.facebook.com/sharer/sharer.php?u=<encoded url>`)
    - Download PNG (existing behaviour)
- On the card grid: add a small "shared" badge when `share_enabled=true` (optional, low priority)

New helper file `src/lib/share.ts`:
- `enableShare(itemId)` / `disableShare(itemId)` → call edge function
- `getShareUrl(slug)` → builds `${origin}/p/${slug}`
- `shareNative({ url, file? })` → Web Share API wrapper with file fallback
- WhatsApp / Facebook URL builders

New page `src/pages/PublicShare.tsx` + route in `src/App.tsx` (`/p/:slug`).

Update `src/lib/gallery-cloud.ts`:
- Add `public_share_slug`, `share_enabled`, `shared_at` to `CloudGalleryItem`
- Include them in the SELECT (already `select("*")`, just type them)

Instagram / TikTok: no direct publishing. The Download PNG button + native share sheet on mobile is the documented path.

### 9. Files likely to change

- `supabase/migrations/<new>.sql` — columns + index + SECURITY DEFINER `get_public_share` function
- `supabase/functions/share-toggle/index.ts` — new
- `supabase/functions/public-share/index.ts` — new
- `supabase/config.toml` — add `[functions.public-share] verify_jwt = false`
- `src/lib/gallery-cloud.ts` — extend type, no behaviour change
- `src/lib/share.ts` — new
- `src/pages/Gallery.tsx` — add share UI inside existing modal
- `src/pages/PublicShare.tsx` — new
- `src/App.tsx` — add `/p/:slug` route
- `src/integrations/supabase/types.ts` — auto-regenerated

Do NOT touch: existing save/list/delete code paths, Examples page, private RLS policies, Create/Result flow.

### 10. Risks and limitations

- **OG previews are generic in v1** — WhatsApp/Facebook show the brand preview, not the user's pet. Mitigation: clearly call out v2 follow-up.
- **Signed URL expiry** — if a user copies the public page URL and reopens after 24h, images re-fetch fine because the page re-calls `public-share`. But if a user hot-links the raw image URL (e.g. pastes into Discord), it expires. Acceptable; the share URL is the page, not the image.
- **Slug enumeration** — 10-char base62 ≈ 60 bits of entropy, not enumerable.
- **Web Share API file support** — Safari iOS supports file sharing; Android Chrome partial; Desktop usually URL-only. Code must feature-detect with `navigator.canShare({ files })` and fall back to URL share.
- **Deleted items** — delete already removes the row; public page returns 404 automatically. Slug is freed (but unique index allows reuse only if we ever recycled — we won't).
- **Disable vs delete slug** — disabling keeps the slug so re-enabling gives the same URL. If a user wants to invalidate, they delete the item.

### 11. Implementation phases (within Phase 2)

1. Migration + SECURITY DEFINER RPC
2. `share-toggle` edge function + `src/lib/share.ts` (toggle + Copy link only)
3. `public-share` edge function + `src/pages/PublicShare.tsx` + route
4. Gallery modal UI: add toggle + Copy link + WhatsApp + Facebook + Native Share
5. Manual QA per the test checklist
6. Note v2 OG follow-up in plan doc

Order matters: backend before frontend so the UI has something to call.

### What gets built first

Migration + SECURITY DEFINER RPC + `share-toggle` and `public-share` edge functions. Once those return correct data via curl, wire the UI.