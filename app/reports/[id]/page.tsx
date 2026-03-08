import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports, mockSightings } from '@/lib/mock-data'

export default async function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    const report = mockReports.find((item) => item.id === id)
    if (!report) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-background">
        <Header user={null} />
        <main className="container mx-auto px-4 py-8 space-y-6">
          <ReportDetailsContent report={report} sightings={mockSightings.filter((s) => s.report_id === report.id)} />
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: report } = await supabase
    .from('reports')
    .select('*, attachments:report_attachments(*), reporter:profiles!reporter_id(id, full_name)')
    .eq('id', id)
    .single()

  if (!report) {
    const mockReport = mockReports.find((item) => item.id === id)
    if (!mockReport) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 py-8 space-y-6">
          <ReportDetailsContent
            report={mockReport}
            sightings={mockSightings.filter((sighting) => sighting.report_id === mockReport.id)}
          />
        </main>
      </div>
    )
  }

  const { data: sightings } = await supabase
    .from('sightings')
    .select('*, reporter:profiles!reporter_id(id, full_name)')
    .eq('report_id', id)
    .order('sighted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <ReportDetailsContent report={report} sightings={sightings || []} />
      </main>
    </div>
  )
}

function ReportDetailsContent({ report, sightings }: { report: any; sightings: any[] }) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{report.subject}</h1>
          <p className="text-muted-foreground">{report.last_seen_location || 'Location unknown'}</p>
          <p className="text-xs text-muted-foreground mt-1">vCon UUID: {report.vcon_uuid || report.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{report.status}</Badge>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/api/reports/${report.id}/vcon`} target="_blank">
              Download vCon JSON
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{report.description || 'No additional description provided.'}</p>
          {report.contact_name && <p><strong>Contact:</strong> {report.contact_name}</p>}
          {report.contact_phone && <p><strong>Phone:</strong> {report.contact_phone}</p>}
          {report.contact_email && <p><strong>Email:</strong> {report.contact_email}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sightings ({sightings.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sightings.length === 0 ? (
            <p className="text-muted-foreground">No sightings have been shared yet.</p>
          ) : (
            sightings.map((sighting) => (
              <div className="border rounded-md p-3" key={sighting.id}>
                <p className="font-medium">{sighting.description}</p>
                <p className="text-sm text-muted-foreground">{sighting.location_description || 'Location not specified'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href="/">Back to reports</Link>
      </Button>
    </>
  )
}
