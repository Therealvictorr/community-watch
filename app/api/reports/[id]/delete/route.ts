import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting delete operation for report:', params.id)
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    // Get report to check ownership - try multiple field names
    let report;
    let reportError;
    
    // Try with reporter_id first
    const result1 = await supabase
      .from('reports')
      .select('reporter_id, subject')
      .eq('id', params.id)
      .single();
    
    if (result1.data) {
      report = result1.data;
      reportError = result1.error;
    } else {
      // Try with just basic fields to see what exists
      const result2 = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)
        .single();
      
      report = result2.data;
      reportError = result2.error;
    }

    if (reportError || !report) {
      console.error('Report not found:', { params, reportError, reportData: report })
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    console.log('Report found:', { 
      reportId: params.id, 
      reporterId: report.reporter_id, 
      subject: report.subject,
      allFields: Object.keys(report)
    })

    // Check if user is the report creator or admin
    const reporterId = report.reporter_id || report.user_id; // Handle both possible field names
    const canDelete = reporterId === user.id || user.user_metadata?.role === 'admin'
    
    if (!canDelete) {
      console.error('Permission denied:', { userId: user.id, reporterId: report.reporter_id })
      return NextResponse.json(
        { error: 'Permission denied. Only report creator can delete this report.' },
        { status: 403 }
      )
    }

    // Delete related sightings first (if any exist)
    console.log('Deleting sightings for report:', params.id)
    const { error: sightingsError } = await supabase
      .from('sightings')
      .delete()
      .eq('report_id', params.id)

    // Don't fail if sightings deletion fails, just log it
    if (sightingsError) {
      console.warn('Warning: Could not delete sightings:', sightingsError)
      // Continue with report deletion anyway
    }

    // Delete the report
    console.log('Deleting report:', params.id)
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete report: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Successfully deleted report:', params.id)
    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
