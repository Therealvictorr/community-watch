'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Archive } from 'lucide-react'

interface ReportStatusManagerProps {
  reportId: string
  currentStatus: string
  reportCreatorId: string
  onStatusUpdated?: () => void
  isAdmin?: boolean
  userId?: string | null
}

export function ReportStatusManager({ 
  reportId, 
  currentStatus, 
  reportCreatorId,
  onStatusUpdated,
  isAdmin = false,
  userId = null
}: ReportStatusManagerProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'resolved', label: 'Resolved', color: 'bg-blue-100 text-blue-800' },
    { value: 'closed', label: 'Closed', color: 'bg-red-100 text-red-800' }
  ]

  // Check if user can change status (only report creator can resolve/close)
  const canChangeStatus = userId === reportCreatorId || isAdmin
  const canResolve = userId === reportCreatorId // Only creator can resolve

  // Filter status options based on permissions
  const availableStatusOptions = statusOptions.filter(option => {
    if (!canChangeStatus) return false
    if (!canResolve && (option.value === 'resolved' || option.value === 'closed')) {
      return false
    }
    return true
  })

  const handleStatusChange = async () => {
    if (status === currentStatus) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason.trim() || undefined })
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || 'Failed to update status')
        return
      }

      setSuccess(true)
      onStatusUpdated?.()
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false)
        setReason('')
      }, 2000)

    } catch (err) {
      setError('An error occurred while updating status')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Status Updated!</strong> Report status changed to {status}.
        </AlertDescription>
      </Alert>
    )
  }

  const currentStatusConfig = statusOptions.find(s => s.value === currentStatus)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Report Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">Current Status</label>
          <div className="flex items-center gap-2">
            <Badge className={currentStatusConfig?.color}>
              {currentStatusConfig?.label || currentStatus}
            </Badge>
            {currentStatus === 'active' && (
              <span className="text-sm text-muted-foreground">
                This report is currently active and accepting sightings
              </span>
            )}
            {currentStatus === 'inactive' && (
              <span className="text-sm text-muted-foreground">
                This report has been marked as inactive
              </span>
            )}
            {currentStatus === 'resolved' && (
              <span className="text-sm text-muted-foreground">
                This report has been resolved
              </span>
            )}
            {currentStatus === 'closed' && (
              <span className="text-sm text-muted-foreground">
                This report has been closed
              </span>
            )}
          </div>
        </div>

        {/* Status Change */}
        {canChangeStatus ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="status-select" className="text-sm font-medium mb-2 block">
                Change Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="reason" className="text-sm font-medium mb-2 block">
                Reason (Optional)
              </label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for this status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleStatusChange}
              disabled={loading || status === currentStatus}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Only the report creator can change the status of this report.
            </div>
            {userId && (
              <div className="text-xs text-muted-foreground">
                You are viewing this report as a community member. If you have information about this case, please submit a sighting below.
              </div>
            )}
            {!userId && (
              <div className="text-xs text-muted-foreground">
                Sign in to submit sightings or if you are the report creator.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
