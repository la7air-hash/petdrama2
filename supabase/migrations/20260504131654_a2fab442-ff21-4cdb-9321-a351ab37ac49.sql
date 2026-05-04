
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_name TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  style_id TEXT NOT NULL,
  pet_role TEXT NOT NULL,
  quote TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  original_image_path TEXT NOT NULL,
  remix_image_path TEXT,
  variant TEXT NOT NULL DEFAULT 'original',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_items_user_created
  ON public.gallery_items (user_id, created_at DESC);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gallery items"
  ON public.gallery_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gallery items"
  ON public.gallery_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items"
  ON public.gallery_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items"
  ON public.gallery_items FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', false);

CREATE POLICY "Users can read their own gallery files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload to their own gallery folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own gallery files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own gallery files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gallery'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
