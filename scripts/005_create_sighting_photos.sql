-- Photos attached to sightings aligned with app contract
CREATE TABLE IF NOT EXISTS public.sighting_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES public.sightings(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.sighting_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sighting_photos_select_all" ON public.sighting_photos FOR SELECT USING (true);
CREATE POLICY "sighting_photos_insert_auth" ON public.sighting_photos
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT reporter_id FROM public.sightings WHERE id = sighting_id
    )
  );
CREATE POLICY "sighting_photos_delete_own" ON public.sighting_photos
  FOR DELETE USING (
    auth.uid() IN (
      SELECT reporter_id FROM public.sightings WHERE id = sighting_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_sighting_photos_sighting ON public.sighting_photos(sighting_id);
