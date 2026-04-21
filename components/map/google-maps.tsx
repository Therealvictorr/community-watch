'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GoogleMapsProps {
  reports: Array<{
    id: string
    subject: string
    latitude?: number
    longitude?: number
    report_type: string
    status: string
  }>
  sightings?: Array<{
    id: string
    description: string
    latitude?: number
    longitude?: number
    sighted_at: string
  }>
  height?: string
}

export function GoogleMaps({ reports, sightings, height = '400px' }: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true
    
    window.initMap = () => {
      if (!mapRef.current) return

      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      // Add report markers
      reports.forEach(report => {
        if (report.latitude && report.longitude) {
          const marker = new (window as any).google.maps.Marker({
            position: { lat: report.latitude, lng: report.longitude },
            map: map,
            title: report.subject,
            icon: {
              url: getMarkerIcon(report.report_type),
              scaledSize: new (window as any).google.maps.Size(32, 32),
              origin: new (window as any).google.maps.Point(0, 0),
              anchor: new (window as any).google.maps.Point(16, 32)
            }
          })

          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">${report.subject}</h3>
                <p style="margin: 0 0 10px 0; color: #666;">${report.report_type.replace('_', ' ').replace(/\b\w/g, word => word.toUpperCase())}</p>
                <p style="margin: 0 0 10px 0; color: #666;">Status: ${report.status}</p>
              </div>
            `
          })

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })
        }
      })

      // Add sighting markers
      sightings?.forEach(sighting => {
        if (sighting.latitude && sighting.longitude) {
          const marker = new (window as any).google.maps.Marker({
            position: { lat: sighting.latitude, lng: sighting.longitude },
            map: map,
            title: sighting.description,
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#10b981',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          })

          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Sighting</h3>
                <p style="margin: 0 0 10px 0; color: #666;">${sighting.description}</p>
                <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">${new Date(sighting.sighted_at).toLocaleString()}</p>
              </div>
            `
          })

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })
        }
      })
    }

    document.head.appendChild(script)
  }, [reports, sightings])

  const getMarkerIcon = (reportType: string) => {
    // Simple colored markers based on report type
    const colors = {
      missing_child: '#dc2626',
      missing_item: '#2563eb',
      general_incident: '#ca8a04'
    }
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${colors[reportType as keyof typeof colors] || '#666'}" stroke="#fff" stroke-width="2"/>
      </svg>
    `)}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          style={{ height, width: '100%' }}
          className="rounded-lg overflow-hidden"
        />
        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-600">Google Maps API key is required to display the map</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
