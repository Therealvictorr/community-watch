-- Complete database migration for all new features
-- Run this in your Supabase SQL editor

-- 1. Add latitude and longitude columns to sightings table
ALTER TABLE sightings 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;

-- 2. Create report_status_changes table for audit trail
CREATE TABLE IF NOT EXISTS report_status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add status tracking columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS status_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sightings_location ON sightings (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_status_changes_report_id ON report_status_changes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_status_changes_changed_at ON report_status_changes(changed_at);

-- 5. Add comments for documentation
COMMENT ON COLUMN sightings.latitude IS 'Latitude coordinate of sighting location';
COMMENT ON COLUMN sightings.longitude IS 'Longitude coordinate of the sighting location';
COMMENT ON TABLE report_status_changes IS 'Tracks status changes for reports with audit trail';
COMMENT ON COLUMN report_status_changes.reason IS 'Reason for status change';
COMMENT ON COLUMN reports.status_reason IS 'Reason for current report status';
COMMENT ON COLUMN reports.status_updated_by IS 'User who last updated the report status';

-- 6. Verify the changes
SELECT 
    'sightings columns' as table_name,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sightings' 
AND column_name IN ('latitude', 'longitude')

UNION ALL

SELECT 
    'report_status_changes table' as table_name,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'report_status_changes' 

UNION ALL

SELECT 
    'reports additional columns' as table_name,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('status_reason', 'status_updated_by');
