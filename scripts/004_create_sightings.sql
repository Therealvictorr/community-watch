-- Sightings table (vCon dialog equivalent) - community reports of seeing missing person/item
CREATE TABLE IF NOT EXISTS public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  
  -- Reporter info
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sighting details
  description TEXT NOT NULL,
  sighted_at TIMESTAMPTZ NOT NULL,
  
  -- Location where sighted
  location_description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Confidence level
  confidence TEXT DEFAULT 'possible' CHECK (confidence IN ('possible', 'likely', 'certain')),
  
  -- Status for moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view verified sightings, authenticated users can create
CREATE POLICY "sightings_select_all" ON public.sightings FOR SELECT USING (true);
CREATE POLICY "sightings_insert_auth" ON public.sightings FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "sightings_update_own" ON public.sightings FOR UPDATE USING (auth.uid() = reporter_id);
CREATE POLICY "sightings_delete_own" ON public.sightings FOR DELETE USING (auth.uid() = reporter_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sightings_report ON public.sightings(report_id);
CREATE INDEX IF NOT EXISTS idx_sightings_location ON public.sightings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_sightings_created ON public.sightings(created_at DESC);
