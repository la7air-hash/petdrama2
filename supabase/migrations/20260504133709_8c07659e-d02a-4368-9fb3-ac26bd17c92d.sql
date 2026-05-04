-- Add creation_id to gallery_items so multiple saves of the same PetDrama
-- (e.g. user clicks Save before remix, then again after) update the same row
-- instead of creating duplicate cards.
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS creation_id TEXT;

-- Backfill existing rows so the unique constraint is satisfiable.
UPDATE public.gallery_items
SET creation_id = id::text
WHERE creation_id IS NULL;

ALTER TABLE public.gallery_items
  ALTER COLUMN creation_id SET NOT NULL;

-- One row per (user, creation). Subsequent saves of the same creation upsert.
CREATE UNIQUE INDEX IF NOT EXISTS gallery_items_user_creation_unique
  ON public.gallery_items (user_id, creation_id);