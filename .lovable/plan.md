# PetDrama Phase 1 — Cloud Gallery (Supabase)

Move the gallery off localStorage for logged-in users. Save lightweight metadata in the database and the rendered card images in Storage. Anonymous users keep using localStorage exactly like today. UI stays the same.

Sharing, public pages, OG metadata, and video are explicitly out of scope and will be added in a later phase.

## Database

Single table `public.gallery_items`:

| column | type | notes |
|---|---|---|
| `id` | uuid PK, default `gen_random_uuid()` | |
| `user_id` | uuid NOT NULL | references `auth.users(id)` ON DELETE CASCADE |
| `pet_name` | text NOT NULL | normalized display name |
| `pet_type` | text NOT NULL | dog/cat/etc. |
| `style_id` | text NOT NULL | machine id from `DRAMA_STYLES` |
| `pet_role` | text NOT NULL | drama style display name (e.g. "Drama Queen") |
| `quote` | text NOT NULL | chosen quote |
| `caption` | text | chosen caption |
| `hashtags` | text[] | drama hashtags |
| `original_image_path` | text NOT NULL | storage object key |
| `remix_image_path` | text | nullable |
| `variant` | text NOT NULL default 'original' | last-viewed: `'original'` or `'remix'` |
| `created_at` | timestamptz NOT NULL default `now()` | |

Index: `(user_id, created_at DESC)` for fast gallery listing.

No base64 anywhere — images live only in Storage.

## Storage

One private bucket `gallery` with per-user folders:

```text
gallery/{user_id}/{gallery_item_id}/original.webp
gallery/{user_id}/{gallery_item_id}/remix.webp   (only if remix exists)
```

Bucket is private. The Gallery UI loads previews via signed URLs (1-hour TTL, refreshed on each gallery load).

Format: render to **WEBP** at quality ~0.9 instead of base64 PNG. ~600 KB vs ~2 MB per card. Existing `renderDramaPng` returns a data URL — add a sibling that returns a `Blob` via `canvas.toBlob('image/webp', 0.9)` for upload.

## RLS

`gallery_items`:
- `SELECT` where `auth.uid() = user_id`
- `INSERT` where `auth.uid() = user_id`
- `UPDATE` where `auth.uid() = user_id` (used minimally — e.g. updating `variant`)
- `DELETE` where `auth.uid() = user_id`

`storage.objects` for bucket `gallery`:
- All operations restricted to `(storage.foldername(name))[1] = auth.uid()::text`

This means a user can only ever read/write inside `gallery/{their_uid}/...`.

## Client integration

New `src/lib/gallery-cloud.ts`:
- `listMyGallery()` → selects rows for current user, signs URLs for each path, returns a list shaped like the existing `DramaDraft` so `Gallery.tsx` can render with minimal changes (just swap the data source).
- `saveGalleryItem(draft)` → uploads original (and remix if present) WEBP blobs to storage, then inserts the metadata row. Returns the new id.
- `deleteGalleryItem(id, paths)` → removes storage objects (`original.webp`, `remix.webp` if any) then deletes the row. Order matters so we don't end up with orphaned rows; if storage delete fails we still delete the row and log the orphan.

New `src/lib/upload.ts`:
- `renderDramaWebpBlob(opts)` → wraps existing canvas render but returns a `Blob`.
- Helper to upload a Blob to a given path in `gallery`.

Edited `src/pages/Result.tsx` (`onSaveToGallery` only):
- If `supabase.auth.getUser()` returns a user → render WEBP blobs, call `saveGalleryItem`. On success, mark draft `savedToGallery = true` (still in localStorage for the active draft, so Continue-to-result flow keeps working).
- If anonymous → keep current `saveToGallery` localStorage path unchanged.
- Do **not** put base64 into the cloud row.

Edited `src/pages/Gallery.tsx`:
- On mount, check auth. Logged in → `listMyGallery()`. Anonymous → existing `loadGallery()` from localStorage with a small banner: "Saved on this device only. Sign in to save permanently." (No login redirect, no push.)
- Item rendering uses signed URLs returned by `listMyGallery`. Modal preview, download, and the existing card layout work as-is.
- Delete: if the item came from cloud, call `deleteGalleryItem`; otherwise the existing localStorage delete. The Undo affordance is dropped for cloud deletes in Phase 1 (storage objects are gone) — toast just confirms.
- Visual UI unchanged: same `StickerCard` grid, same modal, same delete button.

Edited `src/lib/storage.ts`:
- No structural change. Still the source of truth for the **active draft** (Create → Result hand-off) and for **anonymous gallery**. Logged-in users no longer have their gallery list in localStorage.
- Add a small auth-aware notice surface, but don't refactor the existing module.

No changes to `Create.tsx`, `App.tsx` routing, `index.html`, `drama-remix` edge function, or auth flow.

## Migration of existing localStorage items

One-time, gentle: when a logged-in user opens `/gallery` and their cloud list is empty but `petdrama:gallery` has items, show a non-blocking prompt: "Move N device-saved drama(s) to your account?" → uploads each item's `renderedDataUrl` / `remixRenderedDataUrl` (already cached in localStorage) as WEBP to storage, inserts rows, then clears the localStorage gallery on success. If any item fails, leave it in localStorage and surface the count.

If the user dismisses the prompt, do nothing — localStorage items stay where they are; we don't auto-merge later loads.

## Files touched

New:
- `src/lib/gallery-cloud.ts`
- `src/lib/upload.ts`

Edited:
- `src/lib/render.ts` — add `renderDramaWebpBlob()` (keep existing PNG path used elsewhere)
- `src/pages/Result.tsx` — auth-aware `onSaveToGallery`
- `src/pages/Gallery.tsx` — auth-aware load + delete + anon banner

DB:
- One migration: `gallery_items` table + index + RLS policies; create `gallery` storage bucket (private) + storage RLS policies.

Not touched: `Create.tsx`, `Login.tsx`, `Account.tsx`, `App.tsx`, `index.html`, `supabase/config.toml`, `drama-remix` edge fn, `src/components/*`.

## Risks / notes

- **Signed URL expiry**: 1-hour TTL is plenty for a session. If a user leaves the gallery open for >1h and clicks Download, we re-sign on demand.
- **Delete cleanup**: storage and DB are two operations. We delete storage first; if storage fails we still try DB so the user sees the item gone, and log the orphaned files. A future cron can sweep orphans (out of scope here).
- **Quota**: WEBP ~600 KB × 2 ≈ 1.2 MB per drama. Supabase free tier 1 GB ⇒ ~800 dramas total across all users. Acceptable for Phase 1; soft per-user caps can come later.
- **Auth race**: `Gallery.tsx` must await the auth check before deciding cloud vs local; render a brief loading state to avoid flashing the "anonymous" banner to logged-in users.
- **Existing `creationId` / `galleryId` logic**: stays untouched for the localStorage path so anonymous users still get the recent persistence fixes. Cloud items are identified by their DB `id`.

## Manual test (matches the user's checklist)

1. Sign in with Google.
2. Create A → Generate → Save → toast confirms.
3. Create B → Generate → Save.
4. Open `/gallery` → A and B visible (with signed-URL previews).
5. Hard refresh → A and B still visible (loaded from cloud).
6. Sign out → `/gallery` shows the anonymous local view (or empty if nothing local).
7. Sign in again → A and B restored from cloud.
8. Delete A → only A removed from grid; in Storage, `gallery/{uid}/{A.id}/*` is gone; B intact.

After this lands, sharing + public page + video can be layered on top without touching persistence again.
