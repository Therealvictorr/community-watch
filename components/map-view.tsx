'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Car, AlertTriangle, Eye, MapPin, List } from 'lucide-react'
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

interface MapViewProps {
  reports: MapReport[]
  sightings: MapSighting[]
  user: SupabaseUser | null
}

const reportTypeConfig: Record<ReportType, { label: string; icon: string; color: string }> = {
  missing_child: { label: 'Missing Person', icon: '🔴', color: '#dc2626' },
  missing_item: { label: 'Missing Item', icon: '🟡', color: '#ca8a04' },
  general_incident: { label: 'Incident', icon: '🟠', color: '#ea580c' },
}

export function MapView({ reports, sightings, user }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null)
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    let map: any

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      const L = await import('leaflet')

      // Initialize map centered on a default location (can be updated based on user location)
      map = L.map(mapRef.current).setView([40.7128, -74.006], 11)
    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Create custom icons for reports
    const createReportIcon = (reportType: ReportType) => {
      const config = reportTypeConfig[reportType]
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${config.color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <span style="color: white; font-size: 14px; font-weight: bold;">${reportType === 'missing_child' ? '👤' : reportType === 'missing_item' ? '🚗' : '⚠️'}</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
    }

    // Create sighting icon
    const sightingIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        <span style="color: white; font-size: 12px;">👁</span>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Add report markers
    reports.forEach((report) => {
      const marker = L.marker([report.last_seen_lat, report.last_seen_lng], {
        icon: createReportIcon(report.report_type),
      }).addTo(map)

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: 600; margin-bottom: 4px;">${report.subject}</h3>
          <p style="color: #666; font-size: 12px; margin-bottom: 8px;">${report.last_seen_location || 'Location not specified'}</p>
          <a href="/reports/${report.id}" style="color: #2563eb; font-size: 12px; text-decoration: underline;">View Details</a>
        </div>
      `)

      marker.on('click', () => setSelectedReport(report))
    })

    // Add sighting markers
    sightings.forEach((sighting) => {
      const marker = L.marker([sighting.lat, sighting.lng], {
        icon: sightingIcon,
      }).addTo(map)

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <p style="font-size: 11px; color: #22c55e; font-weight: 500; margin-bottom: 4px;">SIGHTING</p>
          <h3 style="font-weight: 600; margin-bottom: 4px;">${sighting.report.subject}</h3>
          <p style="color: #666; font-size: 12px; margin-bottom: 8px;">${sighting.location_description || 'Location not specified'}</p>
          <a href="/reports/${sighting.report_id}" style="color: #2563eb; font-size: 12px; text-decoration: underline;">View Report</a>
        </div>
      `)
    })

    // Fit bounds to show all markers
    const allPoints: [number, number][] = [
      ...reports.map(r => [r.last_seen_lat, r.last_seen_lng] as [number, number]),
      ...sightings.map(s => [s.lat, s.lng] as [number, number]),
    ]
    
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    }

    initMap()

    return () => {
      if (map) {
        map.remove()
      }
      mapInstanceRef.current = null
    }
  }, [reports, sightings])

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Legend */}
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#dc2626]" />
                <span>Missing Person</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ca8a04]" />
                <span>Missing Item</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ea580c]" />
                <span>Incident</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
                <span>Sighting</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Badge variant="secondary" className="bg-background/95 backdrop-blur">
          {reports.length} Reports
        </Badge>
        <Badge variant="secondary" className="bg-background/95 backdrop-blur">
          {sightings.length} Sightings
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-background/95 backdrop-blur"
          onClick={() => setShowList(!showList)}
        >
          <List className="h-4 w-4 mr-1" />
          {showList ? 'Hide' : 'Show'} List
        </Button>
      </div>

      {/* Report list panel */}
      {showList && (
        <div className="absolute top-20 right-4 z-10 w-80 max-h-[calc(100vh-10rem)] overflow-auto">
          <Card className="bg-background/95 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reports with location data
                  </p>
                ) : (
                  reports.map((report) => {
                    const config = reportTypeConfig[report.report_type]
                    const IconComponent = report.report_type === 'missing_child' ? User : report.report_type === 'missing_item' ? Car : AlertTriangle
                    return (
                      <Link
                        key={report.id}
                        href={`/reports/${report.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: config.color }}
                          >
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{report.subject}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {report.last_seen_location || 'No location'}
                            </p>
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

      {/* Floating action button for logged in users */}
      {user && (
        <div className="absolute bottom-6 right-6 z-10">
          <Button asChild size="lg" className="rounded-full shadow-lg">
            <Link href="/reports/new">
              + New Report
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
