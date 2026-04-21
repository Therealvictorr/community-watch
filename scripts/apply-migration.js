const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Applying migration: Add latitude and longitude to sightings table...');

  try {
    // Add latitude column
    const { error: latError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE sightings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL'
    });

    if (latError) {
      console.error('Error adding latitude column:', latError);
    } else {
      console.log('✅ Latitude column added successfully');
    }

    // Add longitude column
    const { error: lngError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE sightings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL'
    });

    if (lngError) {
      console.error('Error adding longitude column:', lngError);
    } else {
      console.log('✅ Longitude column added successfully');
    }

    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_sightings_location ON sightings (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    });

    if (indexError) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('✅ Location index created successfully');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
