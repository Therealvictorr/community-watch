'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Car, AlertTriangle, MapPin, List } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { ReportType } from '@/lib/types'

interface MapReport {
  id: string
  report_type: ReportType
  status: string
  subject: string
  last_seen_lat: number
  last_seen_lng: number
  last_seen_location?: string
  created_at: string
}

interface MapSighting {
  id: string
  report_id: string
  lat: number
  lng: number
  location_description?: string
  sighted_at: string
  report: {
    subject: string
    report_type: ReportType
  }
}

interface RiskBubble {
  key: string
  lat: number
  lng: number
  score: number
  incidents: number
  missing: number
  sightings: number
  level: 'low' | 'medium' | 'high'
}

interface MapViewProps {
  reports: MapReport[]
  sightings: MapSighting[]
  user: SupabaseUser | null
}

const reportTypeConfig: Record<ReportType, { label: string; color: string }> = {
  missing_child: { label: 'Missing Person', color: '#dc2626' },
  missing_item: { label: 'Missing Item', color: '#ca8a04' },
  general_incident: { label: 'Incident', color: '#ea580c' },
}

const bubbleStyles: Record<RiskBubble['level'], { color: string; fill: string; label: string }> = {
  low: { color: '#22c55e', fill: '#86efac', label: 'Low risk' },
  medium: { color: '#f59e0b', fill: '#fcd34d', label: 'Medium risk' },
  high: { color: '#ef4444', fill: '#fca5a5', label: 'High risk' },
}

export function MapView({ reports, sightings, user }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [showList, setShowList] = useState(false)
  const [riskBubbles, setRiskBubbles] = useState<RiskBubble[]>([])

  // Load risk bubbles
  useEffect(() => {
    let mounted = true

    const loadBubbles = async () => {
      try {
        const response = await fetch('/api/map/bubbles', { cache: 'no-store' })
        if (!response.ok) return
        const payload = await response.json()
        if (mounted) {
          setRiskBubbles(payload.bubbles || [])
        }
      } catch {
        // keep map functional even if analytics endpoint fails
      }
    }

    loadBubbles()
    const timer = setInterval(loadBubbles, 30000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  // Initialize and update map
  useEffect(() => {
    let map: any

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      const L = await import('leaflet')

      map = L.map(mapRef.current).setView([40.7128, -74.006], 11)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      const createReportIcon = (reportType: ReportType) => {
        const config = reportTypeConfig[reportType]
        return L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${config.color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="color: white; font-size: 14px; font-weight: bold;">${reportType === 'missing_child' ? '👤' : reportType === 'missing_item' ? '🚗' : '⚠️'}</span></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      }

      const sightingIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><span style="color: white; font-size: 12px;">👁</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      riskBubbles.forEach((bubble) => {
        const style = bubbleStyles[bubble.level]
        const radius = Math.min(900, 250 + bubble.score * 35)
        L.circle([bubble.lat, bubble.lng], {
          radius,
          color: style.color,
          fillColor: style.fill,
          fillOpacity: 0.35,
          weight: 2,
        })
          .bindPopup(`<div style="min-width: 220px;"><p style="font-size:11px;font-weight:600;color:${style.color};margin-bottom:6px;">${style.label.toUpperCase()} BUBBLE</p><p style="font-size:12px;margin-bottom:4px;"><strong>Risk Score:</strong> ${bubble.score}</p><p style="font-size:12px;margin-bottom:4px;"><strong>Incidents:</strong> ${bubble.incidents}</p><p style="font-size:12px;margin-bottom:4px;"><strong>Missing Reports:</strong> ${bubble.missing}</p><p style="font-size:12px;"><strong>Sightings:</strong> ${bubble.sightings}</p></div>`)
          .addTo(map)
      })

      reports.forEach((report) => {
        const marker = L.marker([report.last_seen_lat, report.last_seen_lng], {
          icon: createReportIcon(report.report_type),
        }).addTo(map)

        marker.bindPopup(`<div style="min-width: 200px;"><h3 style="font-weight: 600; margin-bottom: 4px;">${report.subject}</h3><p style="color: #666; font-size: 12px; margin-bottom: 8px;">${report.last_seen_location || 'Location not specified'}</p><a href="/reports/${report.id}" style="color: #2563eb; font-size: 12px; text-decoration: underline;">View Details</a></div>`)
      })

      sightings.forEach((sighting) => {
        const marker = L.marker([sighting.lat, sighting.lng], { icon: sightingIcon }).addTo(map)

        marker.bindPopup(`<div style="min-width: 200px;"><p style="font-size: 11px; color: #22c55e; font-weight: 500; margin-bottom: 4px;">SIGHTING</p><h3 style="font-weight: 600; margin-bottom: 4px;">${sighting.report.subject}</h3><p style="color: #666; font-size: 12px; margin-bottom: 8px;">${sighting.location_description || 'Location not specified'}</p><a href="/reports/${sighting.report_id}" style="color: #2563eb; font-size: 12px; text-decoration: underline;">View Report</a></div>`)
      })

      const allPoints: [number, number][] = [
        ...reports.map((r) => [r.last_seen_lat, r.last_seen_lng] as [number, number]),
        ...sightings.map((s) => [s.lat, s.lng] as [number, number]),
        ...riskBubbles.map((b) => [b.lat, b.lng] as [number, number]),
      ]

      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] })
      }
    }

    initMap()

    return () => {
      if (map) {
        map.remove()
      }
      mapInstanceRef.current = null
    }
  }, [reports, sightings, riskBubbles])

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <div ref={mapRef} className="absolute inset-0 z-0" />

      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-background/95 backdrop-blur">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map Legend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#dc2626]" /><span>Missing Person</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#ca8a04]" /><span>Missing Item</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#ea580c]" /><span>Incident</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#22c55e]" /><span>Sighting</span></div>
              <div className="mt-2 border-t pt-2 space-y-2">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#86efac] border border-[#22c55e]" /><span>Low risk bubble</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#fcd34d] border border-[#f59e0b]" /><span>Medium risk bubble</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#fca5a5] border border-[#ef4444]" /><span>High risk bubble</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Badge variant="secondary" className="bg-background/95 backdrop-blur">{reports.length} Reports</Badge>
        <Badge variant="secondary" className="bg-background/95 backdrop-blur">{sightings.length} Sightings</Badge>
        <Badge variant="secondary" className="bg-background/95 backdrop-blur">{riskBubbles.length} Risk Bubbles</Badge>
        <Button variant="outline" size="sm" className="bg-background/95 backdrop-blur" onClick={() => setShowList(!showList)}>
          <List className="h-4 w-4 mr-1" />
          {showList ? 'Hide' : 'Show'} List
        </Button>
      </div>

      {showList && (
        <div className="absolute top-20 right-4 z-10 w-80 max-h-[calc(100vh-10rem)] overflow-auto">
          <Card className="bg-background/95 backdrop-blur">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Active Reports</CardTitle></CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reports with location data</p>
                ) : (
                  reports.map((report) => {
                    const config = reportTypeConfig[report.report_type]
                    const IconComponent = report.report_type === 'missing_child' ? User : report.report_type === 'missing_item' ? Car : AlertTriangle
                    return (
                      <Link key={report.id} href={`/reports/${report.id}`} className="block p-3 rounded-lg border hover:bg-muted transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: config.color }}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{report.subject}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{report.last_seen_location || 'No location'}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user && (
        <div className="absolute bottom-6 right-6 z-10">
          <Button asChild size="lg" className="rounded-full shadow-lg">
            <Link href="/reports/new">+ New Report</Link>
          </Button>
        </div>
      )}
    </div>
  )
}