-- Add share columns
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS public_share_slug TEXT,
  ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS gallery_items_public_share_slug_key
  ON public.gallery_items (public_share_slug)
  WHERE public_share_slug IS NOT NULL;

-- SECURITY DEFINER function returning ONLY safe public fields for a shared item.
CREATE OR REPLACE FUNCTION public.get_public_share(_slug TEXT)
RETURNS TABLE (
  pet_name TEXT,
  pet_type TEXT,
  style_id TEXT,
  pet_role TEXT,
  quote TEXT,
  caption TEXT,
  hashtags TEXT[],
  variant TEXT,
  original_image_path TEXT,
  remix_image_path TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gi.pet_name,
    gi.pet_type,
    gi.style_id,
    gi.pet_role,
    gi.quote,
    gi.caption,
    gi.hashtags,
    gi.variant,
    gi.original_image_path,
    gi.remix_image_path
  FROM public.gallery_items gi
  WHERE gi.public_share_slug = _slug
    AND gi.share_enabled = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_share(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_share(TEXT) TO anon, authenticated;