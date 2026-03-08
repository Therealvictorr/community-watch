import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ReportsFeed } from '@/components/reports-feed'
import { HeroSection } from '@/components/hero-section'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports } from '@/lib/mock-data'

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={null} />
        <main>
          <HeroSection user={null} />
          <ReportsFeed reports={mockReports} />
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
      *,
      reporter:profiles!reporter_id(id, full_name, avatar_url),
      attachments:report_attachments(*),
      sightings(count)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  const reportsWithCounts = reports?.map((report) => ({
    ...report,
    sighting_count: report.sightings?.[0]?.count || 0,
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main>
        <HeroSection user={user} />
        <ReportsFeed reports={reportsWithCounts || []} />
      </main>
    </div>
  )
}
