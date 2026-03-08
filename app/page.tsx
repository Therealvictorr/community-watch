import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ReportsFeed } from '@/components/reports-feed'
import { HeroSection } from '@/components/hero-section'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch recent active reports with sighting counts
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

  // Transform sighting counts
  const reportsWithCounts = reports?.map(report => ({
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
