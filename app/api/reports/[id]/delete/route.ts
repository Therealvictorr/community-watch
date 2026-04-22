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

    // Get report to check ownership - use comprehensive query
    console.log('Querying report with ID:', params.id)
    
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', params.id)
      .single();

    if (reportError) {
      console.error('Database query error:', {
        error: reportError,
        code: reportError.code,
        details: reportError.details,
        hint: reportError.hint,
        message: reportError.message
      })
      return NextResponse.json(
        { error: `Database error: ${reportError.message}` },
        { status: 500 }
      )
    }

    if (!report) {
      console.error('Report not found in database:', { 
        searchedId: params.id,
        error: reportError 
      })
      
      // Let's check if any reports exist at all
      const { data: allReports, error: allReportsError } = await supabase
        .from('reports')
        .select('id, subject')
        .limit(5);
        
      console.log('Sample reports in database:', allReports?.slice(0, 3));
      
      return NextResponse.json(
        { error: 'Report not found in database' },
        { status: 404 }
      )
    }

    console.log('Report found:', { 
      reportId: params.id, 
      subject: report.subject,
      allFields: Object.keys(report),
      hasReporterId: !!report.reporter_id,
      hasUserId: !!report.user_id,
      reporterId: report.reporter_id,
      userId: report.user_id
    })

    // Check if user is the report creator or admin
    const reporterId = report.reporter_id || report.user_id || report.reporter?.id; // Handle multiple field name possibilities
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
