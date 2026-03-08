import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports, mockSightings } from '@/lib/mock-data'
import { MapPageContent } from '@/components/map-page-content'

export default async function MapPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header user={null} />
        <main className="flex-1">
          <MapPageContent
            reports={mockReports.map((report) => ({
              id: report.id,
              report_type: report.report_type,
              status: report.status,
              subject: report.subject,
              last_seen_lat: report.last_seen_lat || 0,
              last_seen_lng: report.last_seen_lng || 0,
              last_seen_location: report.last_seen_location,
              created_at: report.created_at,
            }))}
            sightings={mockSightings.map((sighting) => ({
              id: sighting.id,
              report_id: sighting.report_id,
              lat: sighting.lat || 0,
              lng: sighting.lng || 0,
              location_description: sighting.location_description,
              sighted_at: sighting.sighted_at,
              report: {
                subject: mockReports.find((report) => report.id === sighting.report_id)?.subject || 'Report',
                report_type:
                  mockReports.find((report) => report.id === sighting.report_id)?.report_type ||
                  'general_incident',
              },
            }))}
            user={null}
          />
        </main>
      </div>
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
        <MapPageContent reports={reports || []} sightings={sightings || []} user={user} />
      </main>
    </div>
  )
}
