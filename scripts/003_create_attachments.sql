-- vCon attachments table for photos and documents
CREATE TABLE IF NOT EXISTS public.report_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  
  -- vCon attachment fields
  type TEXT NOT NULL DEFAULT 'image', -- 'image', 'document', 'video'
  mime_type TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  
  -- For images: primary photo flag
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view, authenticated users can add to their reports
CREATE POLICY "attachments_select_all" ON public.report_attachments FOR SELECT USING (true);
CREATE POLICY "attachments_insert_auth" ON public.report_attachments 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT reporter_id FROM public.reports WHERE id = report_id
    )
  );
CREATE POLICY "attachments_delete_own" ON public.report_attachments 
  FOR DELETE USING (
    auth.uid() IN (
      SELECT reporter_id FROM public.reports WHERE id = report_id
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attachments_report ON public.report_attachments(report_id);
