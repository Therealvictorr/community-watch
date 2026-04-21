'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

interface ReportStatusControlProps {
  reportId: string
  currentStatus: string
  isOwner: boolean
}

export function ReportStatusControl({ reportId, currentStatus, isOwner }: ReportStatusControlProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOwner) return null

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)

      if (error) {
        console.error('Failed to update status:', error)
        alert(`Failed to update: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'resolved' || currentStatus === 'closed') {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                This report has been {currentStatus}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                You can reopen it if needed
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStatus('active')}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            {loading ? 'Updating...' : 'Reopen Report'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
        <div>
          <p className="font-medium">Manage Report</p>
          <p className="text-sm text-muted-foreground">
            Mark this report as resolved when the person/item is found
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" disabled={loading}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Mark Resolved
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as Resolved?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the report as resolved, indicating the person or item has been found. 
                  The report will no longer appear in active listings. You can reopen it later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => updateStatus('resolved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Yes, Mark Resolved
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <XCircle className="h-4 w-4 mr-1.5" />
                Close
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close this report?</AlertDialogTitle>
                <AlertDialogDescription>
                  Closing a report removes it from active listings without marking it as resolved. 
                  Use this if the report is no longer relevant. You can reopen it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateStatus('closed')}>
                  Yes, Close Report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
