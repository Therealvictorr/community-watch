'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert, Zap } from 'lucide-react'

interface AiAnalysisResult {
  summary: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  key_details: string[]
  recommended_actions: string[]
  vcon_insight: string
}

interface AiAnalysisProps {
  reportId: string
}

const urgencyConfig = {
  low: { label: 'Low Urgency', color: 'bg-green-500/10 text-green-400 border-green-500/30', Icon: CheckCircle2, glow: 'shadow-green-500/10' },
  medium: { label: 'Medium Urgency', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', Icon: AlertTriangle, glow: 'shadow-yellow-500/10' },
  high: { label: 'High Urgency', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', Icon: AlertCircle, glow: 'shadow-orange-500/10' },
  critical: { label: 'CRITICAL', color: 'bg-red-500/10 text-red-400 border-red-500/30', Icon: ShieldAlert, glow: 'shadow-red-500/20' },
}

export function AiAnalysis({ reportId }: AiAnalysisProps) {
  const [result, setResult] = useState<AiAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${reportId}/ai-analysis`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Analysis failed')
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const urgency = result ? urgencyConfig[result.urgency] || urgencyConfig.medium : null

  return (
    <Card className={`border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl overflow-hidden transition-shadow duration-500 ${urgency?.glow || ''}`}>
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base text-white">Incident Analysis</CardTitle>
            </div>
          </div>
          {result && urgency && (
            <Badge className={`border text-xs font-semibold ${urgency.color}`}>
              <urgency.Icon className="h-3 w-3 mr-1" />
              {urgency.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 px-4 pb-4">
        {!result && !loading && !error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Let AI analyze this vCon record</p>
            <p className="text-xs text-gray-600 mb-5 max-w-xs mx-auto">
              Get urgency assessment, key details extracted, and recommended community actions
            </p>
            <Button onClick={analyze} className="bg-purple-600 hover:bg-purple-700 text-white border-0 gap-2">
              <Sparkles className="h-4 w-4" />
              Analyze with AI
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <Spinner className="mx-auto mb-3 h-6 w-6 text-purple-400" />
            <p className="text-sm text-gray-400">Analyzing vCon record…</p>
            <p className="text-xs text-gray-600 mt-1">Groq is processing your incident data</p>
          </div>
        )}

        {error && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={analyze} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}

        {result && urgency && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="rounded-lg border border-white/5 bg-white/2 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Summary</p>
              <p className="text-sm text-gray-200 leading-relaxed">{result.summary}</p>
            </div>

            {/* Key details */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Key Details from vCon</p>
              <ul className="space-y-1.5">
                {result.key_details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended actions */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Recommended Actions</p>
              <ul className="space-y-2">
                {result.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-200">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* vCon insight callout */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-purple-400 font-medium mb-1">vCon Insight</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.vcon_insight}</p>
                </div>
              </div>
            </div>

            <Button onClick={analyze} variant="outline" size="sm" className="w-full border-white/10 text-gray-400 hover:text-white gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Re-analyze
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
