import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MapView } from '@/components/map-view'

export default async function MapPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch reports with location data
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id,
      report_type,
      status,
      subject,
      last_seen_lat,
      last_seen_lng,
      last_seen_location,
      created_at
    `)
    .eq('status', 'active')
    .not('last_seen_lat', 'is', null)
    .not('last_seen_lng', 'is', null)

  // Fetch sightings with location data
  const { data: sightings } = await supabase
    .from('sightings')
    .select(`
      id,
      report_id,
      lat,
      lng,
      location_description,
      sighted_at,
      report:reports!report_id(subject, report_type)
    `)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1">
        <MapView 
          reports={reports || []} 
          sightings={sightings || []} 
          user={user}
        />
      </main>
    </div>
  )
}
