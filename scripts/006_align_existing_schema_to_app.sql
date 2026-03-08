-- Migration helper for existing projects created from older scripts.
-- Safe/idempotent best-effort alignment to current app model.

-- reports
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS vcon_uuid TEXT;
UPDATE public.reports SET vcon_uuid = COALESCE(vcon_uuid, uuid, gen_random_uuid()::TEXT);
ALTER TABLE public.reports ALTER COLUMN vcon_uuid SET DEFAULT gen_random_uuid()::TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_vcon_uuid_key'
  ) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_vcon_uuid_key UNIQUE (vcon_uuid);
  END IF;
END $$;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS subject TEXT;
UPDATE public.reports SET subject = COALESCE(subject, title, 'Untitled report');
ALTER TABLE public.reports ALTER COLUMN subject SET NOT NULL;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS person_details JSONB;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS item_details JSONB;

UPDATE public.reports
SET person_details = COALESCE(
  person_details,
  jsonb_build_object(
    'name', child_name,
    'age', child_age,
    'gender', child_gender,
    'height', child_height,
    'weight', child_weight,
    'hair_color', child_hair_color,
    'eye_color', child_eye_color,
    'clothing_description', child_clothing,
    'distinguishing_features', child_distinguishing_features
  )
)
WHERE person_details IS NULL
  AND (
    child_name IS NOT NULL OR child_age IS NOT NULL OR child_gender IS NOT NULL
    OR child_height IS NOT NULL OR child_weight IS NOT NULL OR child_hair_color IS NOT NULL
    OR child_eye_color IS NOT NULL OR child_clothing IS NOT NULL OR child_distinguishing_features IS NOT NULL
  );

UPDATE public.reports
SET item_details = COALESCE(
  item_details,
  jsonb_build_object(
    'item_type', item_type,
    'make', item_make,
    'model', item_model,
    'color', item_color,
    'license_plate', item_registration,
    'serial_number', item_serial_number,
    'estimated_value', item_value_estimate
  )
)
WHERE item_details IS NULL
  AND (
    item_type IS NOT NULL OR item_make IS NOT NULL OR item_model IS NOT NULL OR item_color IS NOT NULL
    OR item_registration IS NOT NULL OR item_serial_number IS NOT NULL OR item_value_estimate IS NOT NULL
  );

-- report_attachments
ALTER TABLE public.report_attachments ADD COLUMN IF NOT EXISTS url TEXT;
UPDATE public.report_attachments SET url = COALESCE(url, file_url);
ALTER TABLE public.report_attachments ALTER COLUMN url SET NOT NULL;
ALTER TABLE public.report_attachments ADD COLUMN IF NOT EXISTS filename TEXT;
UPDATE public.report_attachments SET filename = COALESCE(filename, file_name);
ALTER TABLE public.report_attachments ADD COLUMN IF NOT EXISTS description TEXT;

-- sightings
ALTER TABLE public.sightings ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
UPDATE public.sightings SET is_verified = (status = 'verified') WHERE status IS NOT NULL;

-- sighting_photos
ALTER TABLE public.sighting_photos ADD COLUMN IF NOT EXISTS url TEXT;
UPDATE public.sighting_photos SET url = COALESCE(url, file_url);
ALTER TABLE public.sighting_photos ALTER COLUMN url SET NOT NULL;
ALTER TABLE public.sighting_photos ADD COLUMN IF NOT EXISTS filename TEXT;
UPDATE public.sighting_photos SET filename = COALESCE(filename, file_name);
