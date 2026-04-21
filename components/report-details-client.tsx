'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShareButton } from '@/components/share-button'
import { ReportStatusManager } from '@/components/report-status-manager'
import { GoogleMaps } from '@/components/map/google-maps'
import { AiAnalysis } from '@/components/ai-analysis'
import { SightingForm } from '@/components/sighting-form'
import { Report, Sighting } from '@/lib/types'
import { VconObject } from '@/lib/vcon'
import { MapPin, Clock, Eye, User, AlertTriangle, Archive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ReportDetailsClientProps {
  report: Report
  sightings: Sighting[]
  vcon: VconObject
  userId: string | null
}

const reportTypeConfig = {
  missing_child: { label: 'Missing Person', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: User },
  missing_item: { label: 'Missing Item', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: AlertTriangle },
  general_incident: { label: 'Incident', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: AlertTriangle },
}

export function ReportDetailsClient({ report, sightings, vcon, userId }: ReportDetailsClientProps) {
  const config = reportTypeConfig[report.report_type] || reportTypeConfig.general_incident
  const TypeIcon = config.icon
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('key-info')

  const handleStatusUpdated = () => {
    setRefreshKey(prev => prev + 1) // Trigger re-render of sightings and status
  }

  return (
    <div className="space-y-6">
      {/* Header with share */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={config.color}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            <Badge variant="outline">{report.status}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{report.subject}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {report.last_seen_location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {report.last_seen_location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </span>
            {report.reporter?.full_name && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {report.reporter.full_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShareButton
            title={report.subject}
            description={report.description}
            reportType={report.report_type}
          />
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="key-info" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Key Info
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Map
          </TabsTrigger>
          <TabsTrigger value="sightings" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Sightings ({sightings.length})
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        {/* Key Information Tab */}
        <TabsContent value="key-info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>{report.description || 'No additional description provided.'}</p>

                {report.person_details && (
                  <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                    {report.person_details.name && <div><strong>Name:</strong> {report.person_details.name}</div>}
                    {report.person_details.age && <div><strong>Age:</strong> {report.person_details.age}</div>}
                    {report.person_details.gender && <div><strong>Gender:</strong> {report.person_details.gender}</div>}
                    {report.person_details.height && <div><strong>Height:</strong> {report.person_details.height}</div>}
                    {report.person_details.hair_color && <div><strong>Hair:</strong> {report.person_details.hair_color}</div>}
                    {report.person_details.eye_color && <div><strong>Eyes:</strong> {report.person_details.eye_color}</div>}
                    {report.person_details.clothing_description && (
                      <div className="col-span-2"><strong>Clothing:</strong> {report.person_details.clothing_description}</div>
                    )}
                    {report.person_details.distinguishing_features && (
                      <div className="col-span-2"><strong>Features:</strong> {report.person_details.distinguishing_features}</div>
                    )}
                  </div>
                )}

                {report.item_details && (
                  <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                    {report.item_details.make && <div><strong>Make:</strong> {report.item_details.make}</div>}
                    {report.item_details.model && <div><strong>Model:</strong> {report.item_details.model}</div>}
                    {report.item_details.color && <div><strong>Color:</strong> {report.item_details.color}</div>}
                    {report.item_details.license_plate && <div><strong>Plate:</strong> {report.item_details.license_plate}</div>}
                  </div>
                )}

                <div className="border-t pt-3 space-y-1">
                  {report.contact_name && <p className="text-sm"><strong>Contact:</strong> {report.contact_name}</p>}
                  {report.contact_phone && <p className="text-sm"><strong>Phone:</strong> {report.contact_phone}</p>}
                  {report.contact_email && <p className="text-sm"><strong>Email:</strong> {report.contact_email}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Report Images */}
            {report.attachments && report.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photos ({report.attachments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {report.attachments.map((att) => (
                      <div key={att.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={att.url}
                          alt={att.description || report.subject}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="space-y-4">
          <GoogleMaps 
            reports={[report]} 
            sightings={sightings}
            height="500px"
          />
        </TabsContent>

        {/* Sightings Tab */}
        <TabsContent value="sightings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sightings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sightings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Eye className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No sightings have been reported yet.</p>
                  <p className="text-sm">If you&apos;ve seen something, submit a sighting below.</p>
                </div>
              ) : (
                sightings.map((sighting) => (
                  <div className="border rounded-lg p-4" key={sighting.id}>
                    <p className="font-medium">{sighting.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {sighting.location_description || 'Location not specified'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(sighting.sighted_at), { addSuffix: true })}
                      </span>
                      {sighting.reporter?.full_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {sighting.reporter.full_name}
                        </span>
                      )}
                      {sighting.is_verified && (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Verified</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sighting Submission Form */}
          <SightingForm reportId={report.id} userId={userId} />
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-4">
          {/* Status Management */}
          <ReportStatusManager 
            key={refreshKey}
            reportId={report.id}
            currentStatus={report.status}
            reportCreatorId={report.reporter_id || ''}
            onStatusUpdated={handleStatusUpdated}
            userId={userId}
          />

          {/* AI Analysis */}
          <AiAnalysis reportId={report.id} />

          {/* vCon Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Report Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download the complete vCon file containing all report data, sightings, and metadata.
                </p>
                <Button asChild className="w-full sm:w-auto">
                  <a href={`/api/reports/${report.id}/vcon`} download={`report-${report.id}.vcon.json`}>
                    Download vCon File
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button asChild variant="outline">
          <Link href="/">Back to reports</Link>
        </Button>
        <ShareButton
          title={report.subject}
          description={report.description}
          reportType={report.report_type}
        />
      </div>
    </div>
  )
}
