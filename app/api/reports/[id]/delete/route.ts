import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the report to check ownership
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('reporter_id')
      .eq('id', params.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Check if user is the report creator or admin
    const canDelete = report.reporter_id === user.id || user.user_metadata?.role === 'admin'
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied. Only report creator can delete this report.' },
        { status: 403 }
      )
    }

    // Delete related sightings first (foreign key constraint)
    const { error: sightingsError } = await supabase
      .from('sightings')
      .delete()
      .eq('report_id', params.id)

    if (sightingsError) {
      console.error('Error deleting sightings:', sightingsError)
      return NextResponse.json(
        { error: 'Failed to delete related sightings' },
        { status: 500 }
      )
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete report' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
