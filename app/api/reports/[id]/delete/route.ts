import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js App Router, params is a Promise
    const resolvedParams = await params;
    
    // Debug the params object
    console.log('Full params object:', resolvedParams)
    console.log('params.id type:', typeof resolvedParams.id)
    console.log('params.id value:', resolvedParams.id)
    console.log('params.id === undefined:', resolvedParams.id === undefined)
    console.log('params.id === "undefined":', resolvedParams.id === 'undefined')
    
    // Validate UUID parameter
    const reportId = resolvedParams.id;
    console.log('Starting delete operation for report:', reportId)
    
    if (!reportId || reportId === 'undefined') {
      console.error('Invalid report ID:', reportId, 'Type:', typeof reportId)
      return NextResponse.json(
        { error: 'Invalid report ID provided' },
        { status: 400 }
      )
    }
    
    // Simple UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(reportId)) {
      console.error('Invalid UUID format:', reportId)
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      )
    }
    
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
    console.log('Querying report with ID:', reportId)
    
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
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
        searchedId: reportId,
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
      reportId: reportId, 
      subject: report.subject,
      allFields: Object.keys(report),
      hasReporterId: !!report.reporter_id,
      hasUserId: !!report.user_id,
      reporterId: report.reporter_id,
      userId: report.user_id
    })

    // Check if user is the report creator or admin
    const reporterId = report.reporter_id || report.user_id || report.reporter?.id; // Handle multiple field name possibilities
    
    console.log('Permission check:', {
      userId: user.id,
      reporterId: reporterId,
      reportReporterId: report.reporter_id,
      reportUserId: report.user_id,
      reportReporterIdNested: report.reporter?.id,
      isAdmin: user.user_metadata?.role === 'admin'
    })
    
    // Check if we have a valid reporter ID
    if (!reporterId && user.user_metadata?.role !== 'admin') {
      console.error('No reporter ID found and user is not admin:', { 
        userId: user.id, 
        reportFields: Object.keys(report),
        reportData: report 
      })
      return NextResponse.json(
        { error: 'Unable to determine report ownership. This report may not have a valid creator.' },
        { status: 403 }
      )
    }
    
    const canDelete = (reporterId && reporterId === user.id) || user.user_metadata?.role === 'admin'
    
    if (!canDelete) {
      console.error('Permission denied:', { 
        userId: user.id, 
        reporterId: reporterId,
        isAdmin: user.user_metadata?.role === 'admin'
      })
      return NextResponse.json(
        { error: 'Permission denied. Only report creator can delete this report.' },
        { status: 403 }
      )
    }

    // Delete related sightings first (if any exist)
    console.log('Deleting sightings for report:', reportId)
    try {
      const { error: sightingsError } = await supabase
        .from('sightings')
        .delete()
        .eq('report_id', reportId)

      // Don't fail if sightings deletion fails, just log it
      if (sightingsError) {
        console.warn('Warning: Could not delete sightings:', sightingsError)
        // Continue with report deletion anyway
      } else {
        console.log('Sightings deleted successfully')
      }
    } catch (sightingsError) {
      console.warn('Exception when deleting sightings:', sightingsError)
      // Continue with report deletion anyway
    }

    // Delete the report
    console.log('Deleting report:', reportId)
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete report: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Successfully deleted report:', reportId)
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
