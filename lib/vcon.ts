import type { Report, ReportAttachment, Sighting } from '@/lib/types'

interface VconParty {
  tel?: string
  mailto?: string
  name?: string
  role?: string
}

interface VconAttachment {
  type: string
  body_url: string
  encoding: 'none'
  filename?: string
  mime_type?: string
}

interface VconDialog {
  type: 'text'
  start: string
  parties: number[]
  body: string
  mimetype: 'text/plain'
  meta?: Record<string, unknown>
}

export interface VconObject {
  vcon: '0.0.1'
  uuid: string
  created_at: string
  subject?: string
  redacted: Record<string, unknown>
  parties: VconParty[]
  attachments: VconAttachment[]
  dialog: VconDialog[]
  analysis: Array<Record<string, unknown>>
  tags: Record<string, unknown>
}

export function buildVconObject(input: {
  report: Report
  sightings: Sighting[]
  attachments: ReportAttachment[]
}): VconObject {
  const { report, sightings, attachments } = input

  const reporterName = report.reporter?.full_name || 'Reporter'
  const parties: VconParty[] = [
    {
      name: reporterName,
      role: 'reporter',
    },
  ]

  if (report.contact_name || report.contact_phone || report.contact_email) {
    parties.push({
      name: report.contact_name,
      tel: report.contact_phone,
      mailto: report.contact_email,
      role: 'contact',
    })
  }

  const vconAttachments: VconAttachment[] = attachments.map((attachment) => ({
    type: attachment.type,
    body_url: attachment.url,
    encoding: 'none',
    filename: attachment.filename,
    mime_type: attachment.mime_type,
  }))

  const reportDialog: VconDialog = {
    type: 'text',
    start: report.created_at,
    parties: [0],
    body: report.description || report.subject,
    mimetype: 'text/plain',
    meta: {
      report_id: report.id,
      report_type: report.report_type,
      status: report.status,
      subject: report.subject,
      last_seen_location: report.last_seen_location,
      last_seen_at: report.last_seen_at,
      person_details: report.person_details,
      item_details: report.item_details,
    },
  }

  const sightingDialogs: VconDialog[] = sightings.map((sighting) => ({
    type: 'text',
    start: sighting.sighted_at,
    parties: [0],
    body: sighting.description,
    mimetype: 'text/plain',
    meta: {
      sighting_id: sighting.id,
      report_id: sighting.report_id,
      location_description: sighting.location_description,
      lat: sighting.lat,
      lng: sighting.lng,
      is_verified: sighting.is_verified,
    },
  }))

  return {
    vcon: '0.0.1',
    uuid: report.vcon_uuid,
    created_at: report.created_at,
    subject: report.subject,
    redacted: {},
    parties,
    attachments: vconAttachments,
    dialog: [reportDialog, ...sightingDialogs],
    analysis: [
      {
        type: 'community-watch-report',
        vendor: 'v0-community-watch-app',
        body: {
          report_id: report.id,
          report_status: report.status,
          sighting_count: sightings.length,
        },
      },
    ],
    tags: {
      app: 'community-watch',
      report_type: report.report_type,
      status: report.status,
    },
  }
}
