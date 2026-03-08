'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Empty } from '@/components/ui/empty'
import { Search, MapPin, Clock, Eye, User, Car, AlertTriangle, ChevronRight } from 'lucide-react'
import type { Report, ReportType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface ReportsFeedProps {
  reports: Report[]
}

const reportTypeConfig: Record<ReportType, { label: string; icon: React.ElementType; color: string }> = {
  missing_child: { label: 'Missing Child', icon: User, color: 'bg-destructive text-destructive-foreground' },
  missing_item: { label: 'Missing Item', icon: Car, color: 'bg-warning text-warning-foreground' },
  general_incident: { label: 'Incident', icon: AlertTriangle, color: 'bg-accent text-accent-foreground' },
}

export function ReportsFeed({ reports }: ReportsFeedProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.last_seen_location?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter
    
    return matchesSearch && matchesType
  })

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Active Reports</h2>
            <p className="text-muted-foreground">Help find missing persons and items in your community</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="missing_child">Missing Children</SelectItem>
                <SelectItem value="missing_item">Missing Items</SelectItem>
                <SelectItem value="general_incident">Incidents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <Empty
            title="No reports found"
            description={searchQuery || typeFilter !== 'all' 
              ? "Try adjusting your search or filters" 
              : "No active reports in your community yet"
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ReportCard({ report }: { report: Report }) {
  const config = reportTypeConfig[report.report_type]
  const Icon = config.icon
  const primaryImage = report.attachments?.find(a => a.is_primary) || report.attachments?.[0]
  
  const displayName = report.report_type === 'missing_child' 
    ? report.person_details?.name 
    : report.report_type === 'missing_item'
    ? report.item_details?.name || `${report.item_details?.make} ${report.item_details?.model}`
    : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {primaryImage && (
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img
            src={primaryImage.url}
            alt={report.subject}
            className="object-cover w-full h-full"
          />
          <Badge className={`absolute top-3 left-3 ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      )}
      {!primaryImage && (
        <div className="aspect-video relative bg-muted flex items-center justify-center">
          <Icon className="h-12 w-12 text-muted-foreground/50" />
          <Badge className={`absolute top-3 left-3 ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg line-clamp-1">{report.subject}</h3>
        {displayName && (
          <p className="text-sm text-muted-foreground">{displayName}</p>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        {report.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {report.description}
          </p>
        )}
        <div className="flex flex-col gap-1.5 text-sm">
          {report.last_seen_location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{report.last_seen_location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {report.last_seen_at 
                ? `Last seen ${formatDistanceToNow(new Date(report.last_seen_at), { addSuffix: true })}`
                : `Reported ${formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}`
              }
            </span>
          </div>
          {report.sighting_count !== undefined && report.sighting_count > 0 && (
            <div className="flex items-center gap-2 text-accent">
              <Eye className="h-4 w-4 shrink-0" />
              <span>{report.sighting_count} sighting{report.sighting_count !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/reports/${report.id}`}>
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
