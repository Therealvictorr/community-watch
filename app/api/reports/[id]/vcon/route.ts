import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports, mockSightings } from '@/lib/mock-data'
import { buildVconObject } from '@/lib/vcon'
import type { Report, ReportAttachment, Sighting } from '@/lib/types'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    const report = mockReports.find((item) => item.id === id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const vcon = buildVconObject({
      report,
      sightings: mockSightings.filter((sighting) => sighting.report_id === report.id),
      attachments: report.attachments || [],
    })

    return NextResponse.json(vcon, {
      headers: {
        'Content-Disposition': `attachment; filename="${id}-vcon.json"`,
      },
    })
  }

  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(id, full_name), attachments:report_attachments(*)')
    .eq('id', id)
    .single()

  if (!report) {
    const mockReport = mockReports.find((item) => item.id === id)

    if (!mockReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const fallbackVcon = buildVconObject({
      report: mockReport,
      sightings: mockSightings.filter((sighting) => sighting.report_id === mockReport.id),
      attachments: mockReport.attachments || [],
    })

    return NextResponse.json(fallbackVcon, {
      headers: {
        'Content-Disposition': `attachment; filename="${id}-vcon.json"`,
      },
    })
  }

  const { data: sightings } = await supabase
    .from('sightings')
    .select('*')
    .eq('report_id', id)
    .order('sighted_at', { ascending: true })

  const typedReport: Report = {
    ...report,
    vcon_uuid: report.vcon_uuid || report.uuid || report.id,
  }

  const typedAttachments: ReportAttachment[] = report.attachments || []
  const typedSightings: Sighting[] = sightings || []

  const vcon = buildVconObject({
    report: typedReport,
    sightings: typedSightings,
    attachments: typedAttachments,
  })

  return NextResponse.json(vcon, {
    headers: {
      'Content-Disposition': `attachment; filename="${id}-vcon.json"`,
    },
  })
}
