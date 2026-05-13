CREATE TABLE IF NOT EXISTS public.remix_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id uuid NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  variant_key text NOT NULL,
  voter_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT remix_votes_variant_key_check CHECK (variant_key ~ '^(original|remix:.+)$')
);

CREATE UNIQUE INDEX IF NOT EXISTS remix_votes_item_voter_unique
  ON public.remix_votes (gallery_item_id, voter_key);

CREATE INDEX IF NOT EXISTS remix_votes_item_variant_idx
  ON public.remix_votes (gallery_item_id, variant_key);

ALTER TABLE public.remix_votes ENABLE ROW LEVEL SECURITY;
