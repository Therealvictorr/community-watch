import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header-simple'
import { HeroSection } from '@/components/hero-section'
import { RealTimeReportsFeed } from '@/components/reports/real-time-reports-feed'
import { CommunityAssistant } from '@/components/ai/community-assistant'
import { InteractiveMap } from '@/components/map/interactive-map'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports } from '@/lib/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Camera, Eye } from 'lucide-react'

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={null} />
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="reports" className="w-full">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="ai">AI Assistant</TabsTrigger>
                <TabsTrigger value="drone-ops">Drone Scans</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="reports" className="mt-0">
              <HeroSection user={null} />
              <RealTimeReportsFeed 
                initialReports={mockReports}
                userLocation={undefined} />
            </TabsContent>
            
            <TabsContent value="map" className="mt-4">
              <InteractiveMap reports={reportsWithCounts || []} />
            </TabsContent>
            
            <TabsContent value="ai" className="mt-4">
              <CommunityAssistant reports={reportsWithCounts || []} />
            </TabsContent>
            
            <TabsContent value="drone-ops" className="mt-4">
              <div className="text-center py-16 px-4 bg-muted/40 rounded-xl border-2 border-dashed max-w-3xl mx-auto mt-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 shadow-sm">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Guiding Eye Drone Deployment</h3>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 text-pretty">
                  In the future, authorized security agencies will be able to launch autonomous drones immediately upon incident reports to scan broad areas. We will also interconnect neighborhood AI security cameras to detect anomalies in real-time.
                </p>
                <Button variant="outline" size="lg" disabled className="shadow-sm">
                  Feature Coming Soon
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: reports, error: reportsError } = await supabase
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

  if (reportsError) {
    console.error('Homepage reports query error:', reportsError)
  }

  const reportsWithCounts = reports?.map((report) => ({
    ...report,
    sighting_count: report.sightings?.[0]?.count || 0,
    // Add mock progress data for demonstration
    progress: {
      stage: Math.random() > 0.5 ? "investigating" : "following_leads",
      percentage: Math.floor(Math.random() * 80) + 20,
      last_update: report.created_at
    }
  }))

  // Mock user location for demo
  const userLocation = { lat: 40.7128, lng: -74.0060 }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reports" className="w-full">
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2">
            <TabsList className="grid w-full grid-cols-4 shadow-sm">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              <TabsTrigger value="drone-ops">Drone Scans</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="reports" className="mt-0">
            <HeroSection user={user} />
            <RealTimeReportsFeed 
              initialReports={reportsWithCounts || []} 
              userLocation={userLocation}
            />
          </TabsContent>
          
          <TabsContent value="map" className="mt-4">
            <InteractiveMap 
              reports={reportsWithCounts || []} 
              userLocation={userLocation}
            />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <CommunityAssistant 
              reports={reportsWithCounts || []} 
              userLocation={userLocation}
            />
          </TabsContent>
          
          <TabsContent value="drone-ops" className="mt-4">
            <div className="text-center py-20 px-4 bg-muted/40 rounded-xl border-2 border-dashed max-w-4xl mx-auto mt-12 mb-12">
              <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6 shadow-sm">
                <Camera className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Autonomous Drone Operations</h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 text-pretty">
                Soon, Community Watch will serve as a continuous 'guiding eye' for security agencies. 
                Using interconnected neighborhood AI security cameras and automated drone dispatches, 
                we'll be able to proactively scan locations the second an incident is logged.
              </p>
              <Button variant="outline" size="lg" disabled className="shadow-sm">
                Feature Under Development
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
