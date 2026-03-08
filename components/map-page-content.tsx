'use client'

import { MapView } from '@/components/map-view'

interface MapPageContentProps {
  reports: Array<{
    id: string
    report_type: 'missing_child' | 'missing_item' | 'general_incident'
    status: string
    subject: string
    last_seen_lat: number
    last_seen_lng: number
    last_seen_location?: string
    created_at: string
  }>
  sightings: Array<{
    id: string
    report_id: string
    lat: number
    lng: number
    location_description?: string
    sighted_at: string
    report: {
      subject: string
      report_type: 'missing_child' | 'missing_item' | 'general_incident'
    }
  }>
  user: any
}

export function MapPageContent({ reports, sightings, user }: MapPageContentProps) {
  return <MapView reports={reports} sightings={sightings} user={user} />
}
