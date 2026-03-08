'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileJson, Users, Clock, Paperclip, Hash, Tag } from 'lucide-react'
import type { VconObject } from '@/lib/vcon'

interface VconViewerProps {
  vcon: VconObject
  reportType: string
}

const reportTypeColors: Record<string, string> = {
  missing_child: 'bg-red-500/10 border-red-500/30 text-red-400',
  missing_item: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  general_incident: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
}

const roleColors: Record<string, string> = {
  reporter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contact: 'bg-green-500/10 text-green-400 border-green-500/20',
  witness: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function SyntaxJson({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2)
  const highlighted = json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span class="text-blue-300">${match}</span>`
        return `<span class="text-green-300">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span class="text-yellow-300">${match}</span>`
      if (/null/.test(match)) return `<span class="text-red-400">${match}</span>`
      return `<span class="text-purple-300">${match}</span>`
    })

  return (
    <pre
      className="text-xs font-mono leading-relaxed overflow-auto max-h-96 p-4 bg-gray-950 rounded-lg border border-white/5"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

export function VconViewer({ vcon, reportType }: VconViewerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const typeColor = reportTypeColors[reportType] || 'bg-gray-500/10 border-gray-500/30 text-gray-400'

  return (
    <Card className="border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileJson className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base text-white">vCon Record</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">IETF vCon v{vcon.vcon}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs border ${typeColor} font-medium`}>
              {reportType.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono text-gray-400 border-white/10">
              <Hash className="h-3 w-3 mr-1" />
              {vcon.uuid.slice(0, 8)}…
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 bg-white/5 border border-white/10 mb-4 h-9">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Users className="h-3 w-3 mr-1.5" />Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Clock className="h-3 w-3 mr-1.5" />Timeline
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Paperclip className="h-3 w-3 mr-1.5" />Attachments
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white font-mono">
              <FileJson className="h-3 w-3 mr-1.5" />JSON
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* UUID */}
            <div className="rounded-lg border border-white/5 bg-white/2 p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">vCon UUID</p>
              <p className="text-xs font-mono text-gray-200 break-all">{vcon.uuid}</p>
            </div>

            {/* Parties */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Parties ({vcon.parties.length})
              </p>
              <div className="space-y-2">
                {vcon.parties.map((party, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/2 p-3">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColors[party.role || ''] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {(party.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium">{party.name || 'Unknown'}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${roleColors[party.role || ''] || ''}`}>
                          {party.role || 'party'}
                        </Badge>
                      </div>
                      {party.mailto && <p className="text-xs text-gray-400 mt-0.5">✉ {party.mailto}</p>}
                      {party.tel && <p className="text-xs text-gray-400 mt-0.5">📞 {party.tel}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(vcon.tags).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300">
                    <span className="text-gray-500">{k}:</span> {String(v)}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="mt-0">
            <div className="relative pl-4">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-4">
                {vcon.dialog.map((entry, i) => {
                  const isMeta = entry.meta?.report_id
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[17px] top-2 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isMeta ? 'bg-blue-500 border-blue-400' : 'bg-green-500 border-green-400'}`} />
                      <div className="rounded-lg border border-white/5 bg-white/2 p-3 ml-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <Badge className={`text-[10px] px-1.5 py-0 border ${isMeta ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                            {isMeta ? '📋 Report Filed' : '👁 Sighting'}
                          </Badge>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(entry.start).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed">{entry.body}</p>
                        {entry.meta?.last_seen_location && (
                          <p className="text-xs text-gray-500 mt-1">📍 {String(entry.meta.last_seen_location)}</p>
                        )}
                        {entry.meta?.location_description && (
                          <p className="text-xs text-gray-500 mt-1">📍 {String(entry.meta.location_description)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* ATTACHMENTS */}
          <TabsContent value="attachments" className="mt-0">
            {vcon.attachments.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No attachments in this vCon</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vcon.attachments.map((att, i) => (
                  <a key={i} href={att.body_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/2 p-3 hover:bg-white/5 transition-colors">
                    <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{att.filename || 'Attachment'}</p>
                      <p className="text-xs text-gray-500">{att.mime_type || att.type}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RAW JSON */}
          <TabsContent value="raw" className="mt-0">
            <SyntaxJson data={vcon} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
