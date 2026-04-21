-- Create report_status_changes table to track status history
CREATE TABLE IF NOT EXISTS report_status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status_reason column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS status_reason TEXT NULL;

-- Add status_updated_by column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_status_changes_report_id ON report_status_changes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_status_changes_changed_at ON report_status_changes(changed_at);

-- Add comments
COMMENT ON TABLE report_status_changes IS 'Tracks status changes for reports with audit trail';
COMMENT ON COLUMN report_status_changes.reason IS 'Reason for status change';
COMMENT ON COLUMN reports.status_reason IS 'Reason for current report status';
COMMENT ON COLUMN reports.status_updated_by IS 'User who last updated the report status';
