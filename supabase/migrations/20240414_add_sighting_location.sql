-- Add latitude and longitude columns to sightings table
ALTER TABLE sightings 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Add index for location queries
CREATE INDEX idx_sightings_location ON sightings (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment to describe the new columns
COMMENT ON COLUMN sightings.latitude IS 'Latitude coordinate of the sighting location';
COMMENT ON COLUMN sightings.longitude IS 'Longitude coordinate of the sighting location';
