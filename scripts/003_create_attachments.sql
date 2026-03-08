-- Attachments table aligned with app contract
CREATE TABLE IF NOT EXISTS public.report_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,

  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'document', 'video')),
  mime_type TEXT,
  url TEXT NOT NULL,
  filename TEXT,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_attachments_report ON public.report_attachments(report_id);
