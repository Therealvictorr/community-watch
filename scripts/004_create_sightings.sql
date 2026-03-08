-- Sightings table aligned with app contract
CREATE TABLE IF NOT EXISTS public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,

  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  location_description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  sighted_at TIMESTAMPTZ NOT NULL,
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sightings_select_all" ON public.sightings FOR SELECT USING (true);
CREATE POLICY "sightings_insert_auth" ON public.sightings FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "sightings_update_own" ON public.sightings FOR UPDATE USING (auth.uid() = reporter_id);
CREATE POLICY "sightings_delete_own" ON public.sightings FOR DELETE USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_sightings_report ON public.sightings(report_id);
CREATE INDEX IF NOT EXISTS idx_sightings_location ON public.sightings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_sightings_created ON public.sightings(created_at DESC);
