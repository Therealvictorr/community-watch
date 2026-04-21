-- Migration: Add latitude and longitude to sightings table
-- Run this in your Supabase SQL editor

-- Add latitude column
ALTER TABLE sightings 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL;

-- Add longitude column  
ALTER TABLE sightings 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_sightings_location 
ON sightings (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments
COMMENT ON COLUMN sightings.latitude IS 'Latitude coordinate of the sighting location';
COMMENT ON COLUMN sightings.longitude IS 'Longitude coordinate of the sighting location';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sightings' 
AND column_name IN ('latitude', 'longitude');
