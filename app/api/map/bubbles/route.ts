import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports, mockSightings } from '@/lib/mock-data'
import type { ReportType } from '@/lib/types'

interface BubbleAccumulator {
  lat: number
  lng: number
  incidents: number
  missing: number
  sightings: number
  score: number
}

interface BubbleResponse {
  key: string
  lat: number
  lng: number
  score: number
  incidents: number
  missing: number
  sightings: number
  level: 'low' | 'medium' | 'high'
}

function cellKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`
}

function upsertBubble(map: Map<string, BubbleAccumulator>, lat: number, lng: number) {
  const key = cellKey(lat, lng)
  const existing = map.get(key)
  if (existing) return existing

  const created: BubbleAccumulator = {
    lat: Number(lat.toFixed(2)),
    lng: Number(lng.toFixed(2)),
    incidents: 0,
    missing: 0,
    sightings: 0,
    score: 0,
  }
  map.set(key, created)
  return created
}

function reportWeight(reportType: ReportType) {
  if (reportType === 'general_incident') return 6
  if (reportType === 'missing_child') return 5
  return 3
}

function levelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 10) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

export async function GET() {
  const bubbles = new Map<string, BubbleAccumulator>()

  if (!isSupabaseConfigured()) {
    for (const report of mockReports) {
      if (!report.last_seen_lat || !report.last_seen_lng) continue
      const bucket = upsertBubble(bubbles, report.last_seen_lat, report.last_seen_lng)
      if (report.report_type === 'general_incident') {
        bucket.incidents += 1
      } else {
        bucket.missing += 1
      }
      bucket.score += reportWeight(report.report_type)
    }

    for (const sighting of mockSightings) {
      if (!sighting.lat || !sighting.lng) continue
      const bucket = upsertBubble(bubbles, sighting.lat, sighting.lng)
      bucket.sightings += 1
      bucket.score += sighting.is_verified ? 3 : 2
    }

    const payload: BubbleResponse[] = Array.from(bubbles.entries()).map(([key, value]) => ({
      key,
      lat: value.lat,
      lng: value.lng,
      score: value.score,
      incidents: value.incidents,
      missing: value.missing,
      sightings: value.sightings,
      level: levelFromScore(value.score),
    }))

    return NextResponse.json({ bubbles: payload })
  }

  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select('report_type,last_seen_lat,last_seen_lng,status')
    .eq('status', 'active')
    .not('last_seen_lat', 'is', null)
    .not('last_seen_lng', 'is', null)

  const { data: sightings } = await supabase
    .from('sightings')
    .select('lat,lng,is_verified')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  for (const report of reports || []) {
    const bucket = upsertBubble(bubbles, report.last_seen_lat, report.last_seen_lng)
    if (report.report_type === 'general_incident') {
      bucket.incidents += 1
    } else {
      bucket.missing += 1
    }
    bucket.score += reportWeight(report.report_type as ReportType)
  }

  for (const sighting of sightings || []) {
    const bucket = upsertBubble(bubbles, sighting.lat, sighting.lng)
    bucket.sightings += 1
    bucket.score += sighting.is_verified ? 3 : 2
  }

  const payload: BubbleResponse[] = Array.from(bubbles.entries())
    .map(([key, value]) => ({
      key,
      lat: value.lat,
      lng: value.lng,
      score: value.score,
      incidents: value.incidents,
      missing: value.missing,
      sightings: value.sightings,
      level: levelFromScore(value.score),
    }))
    .sort((a, b) => b.score - a.score)

  return NextResponse.json({ bubbles: payload })
}
