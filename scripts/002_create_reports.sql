-- vCon-based reports table (main container)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- vCon metadata
  vcon_version TEXT DEFAULT '0.0.1',
  uuid TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  
  -- Report classification
  report_type TEXT NOT NULL CHECK (report_type IN ('missing_child', 'missing_item', 'general_incident')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'closed')),
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  
  -- Core information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- For missing_child
  child_name TEXT,
  child_age INTEGER,
  child_gender TEXT,
  child_height TEXT,
  child_weight TEXT,
  child_hair_color TEXT,
  child_eye_color TEXT,
  child_clothing TEXT,
  child_distinguishing_features TEXT,
  
  -- For missing_item
  item_type TEXT, -- 'vehicle', 'property', 'pet', 'other'
  item_make TEXT,
  item_model TEXT,
  item_color TEXT,
  item_registration TEXT, -- license plate for vehicles
  item_serial_number TEXT,
  item_value_estimate DECIMAL,
  
  -- Location data
  last_seen_location TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  last_seen_at TIMESTAMPTZ,
  
  -- Contact info
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Reporter (references auth user)
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- vCon tags stored as JSONB array
  tags JSONB DEFAULT '[]'::JSONB
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view reports, authenticated users can create, owners can update/delete
CREATE POLICY "reports_select_all" ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports_insert_auth" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_update_own" ON public.reports FOR UPDATE USING (auth.uid() = reporter_id);
CREATE POLICY "reports_delete_own" ON public.reports FOR DELETE USING (auth.uid() = reporter_id);

-- Indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports(last_seen_lat, last_seen_lng);
