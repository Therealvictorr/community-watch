import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports, mockSightings } from '@/lib/mock-data'
import { buildVconObject } from '@/lib/vcon'
import { VconViewer } from '@/components/vcon-viewer'
import { AiAnalysis } from '@/components/ai-analysis'
import { SightingForm } from '@/components/sighting-form'
import { ShareButton } from '@/components/share-button'
import { ReportDetailsClient } from '@/components/report-details-client'
import { Report, Sighting } from '@/lib/types'
import { VconObject } from '@/lib/vcon'

export default async function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    const report = mockReports.find((item) => item.id === id)
    if (!report) notFound()

    const sightings = mockSightings.filter((s) => s.report_id === report!.id)
    const vcon = buildVconObject({ report: report!, sightings, attachments: [] })

    return (
      <div className="min-h-screen bg-background">
        <Header user={null} />
        <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
          <ReportDetailsClient report={report!} sightings={sightings} vcon={vcon} userId={null} />
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*, attachments:report_attachments(*), reporter:profiles!reporter_id(id, full_name)')
    .eq('id', id)
    .maybeSingle()

  if (reportError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-red-500 max-w-xl">
          <h2 className="text-xl font-bold mb-2">Supabase Query Failed</h2>
          <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto">
            {JSON.stringify(reportError, null, 2)}
          </pre>
          <div className="mt-4">
            <Link href="/" className="underline hover:text-red-400">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    const mockReport = mockReports.find((item) => item.id === id)
    if (!mockReport) notFound()

    const sightings = mockSightings.filter((s) => s.report_id === mockReport!.id)
    const vcon = buildVconObject({ report: mockReport!, sightings, attachments: [] })

    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
          <ReportDetailsClient report={mockReport!} sightings={sightings} vcon={vcon} userId={user?.id || null} />
        </main>
      </div>
    )
  }

  let sightings: any[] | null = null
  const { data: sightingsData, error: sightingsError } = await supabase
    .from('sightings')
    .select('*, reporter:profiles!reporter_id(id, full_name)')
    .eq('report_id', id)
    .order('sighted_at', { ascending: false })

  if (sightingsError) {
    // Fallback: fetch sightings without the profiles join
    console.error('Sightings query error:', sightingsError)
    const { data: fallbackSightings } = await supabase
      .from('sightings')
      .select('*')
      .eq('report_id', id)
      .order('sighted_at', { ascending: false })
    sightings = fallbackSightings
  } else {
    sightings = sightingsData
  }

  const vcon = buildVconObject({
    report,
    sightings: sightings || [],
    attachments: report.attachments || [],
  })

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <ReportDetailsClient report={report} sightings={sightings || []} vcon={vcon} userId={user?.id || null} />
      </main>
    </div>
  )
}

