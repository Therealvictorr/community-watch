"use client";

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buildVconObject } from '@/lib/vcon'
import { VconViewer } from '@/components/vcon-viewer'
import { AiAnalysis } from '@/components/ai-analysis'
import { SightingForm } from '@/components/sighting-form'
import { Report, Sighting } from '@/lib/types'
import { VconObject } from '@/lib/vcon'

interface ReportDetailsContentProps {
  report: Report;
  sightings: Sighting[];
  vcon: VconObject;
  user?: any;
}

export function ReportDetailsContent({ 
  report, 
  sightings, 
  vcon, 
  user 
}: ReportDetailsContentProps) {
  const [sightingsList, setSightingsList] = useState<Sighting[]>(sightings);
  
  const handleSightingSubmitted = () => {
    // In a real implementation, you'd refetch the sightings
    // For now, we'll just show a success message
    console.log('Sighting submitted successfully');
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{report.subject}</h1>
          <p className="text-muted-foreground mt-1">{report.last_seen_location || 'Location unknown'}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">vCon UUID: {report.vcon_uuid || report.id}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge>{report.status}</Badge>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/api/reports/${report.id}/vcon`} target="_blank">
              Download vCon JSON
            </Link>
          </Button>
        </div>
      </div>

      {/* Report Details */}
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

      {/* Photos */}
      {report.attachments && report.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {report.attachments.map((attachment: any) => (
                <div key={attachment.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sightings */}
      <Card>
        <CardHeader>
          <CardTitle>Sightings ({sightingsList.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sightingsList.length === 0 ? (
            <p className="text-muted-foreground">No sightings have been shared yet.</p>
          ) : (
            sightingsList.map((sighting) => (
              <div className="border rounded-md p-3" key={sighting.id}>
                <p className="font-medium">{sighting.description}</p>
                <p className="text-sm text-muted-foreground">{sighting.location_description || 'Location not specified'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(sighting.sighted_at || sighting.created_at).toLocaleDateString()} at {new Date(sighting.sighted_at || sighting.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Sighting Form - Only show to logged-in users */}
      {user && report.status === 'active' && (
        <SightingForm 
          reportId={report.id} 
          onSightingSubmitted={handleSightingSubmitted}
        />
      )}

      {/* vCon Viewer */}
      <VconViewer vcon={vcon} reportType={report.report_type} />

      {/* AI Analysis */}
      <AiAnalysis reportId={report.id} />

      <Button asChild variant="outline">
        <Link href="/">Back to reports</Link>
      </Button>
    </>
  )
}
