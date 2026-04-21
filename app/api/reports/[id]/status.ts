import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> 
) {
  try {
    const { id } = await params
    const { status, reason } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id and status' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate status
    const validStatuses = ['active', 'inactive', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    // Update report status
    const { data, error } = await supabase
      .from('reports')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        status_reason: reason || null,
        status_updated_by: 'system' // In real app, this would be the user ID
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating report status:', error)
      return NextResponse.json(
        { error: 'Failed to update report status' },
        { status: 500 }
      )
    }

    // If status is inactive or resolved, create a status change record
    if (['inactive', 'resolved'].includes(status)) {
      await supabase
        .from('report_status_changes')
        .insert({
          report_id: id,
          old_status: 'active',
          new_status: status,
          reason: reason || `Status changed to ${status}`,
          changed_by: 'system',
          changed_at: new Date().toISOString()
        })
    }

    return NextResponse.json({ 
      success: true,
      report: data,
      message: `Report status updated to ${status}`
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
