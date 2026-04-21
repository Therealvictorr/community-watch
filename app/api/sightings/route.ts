import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { report_id, description, location, sighting_at, contact_info, photos } = body

    // Validate required fields
    if (!report_id || !description || !location) {
      return NextResponse.json(
        { error: 'Report ID, description, and location are required' },
        { status: 400 }
      )
    }

    // Verify the report exists
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, status')
      .eq('id', report_id)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    if (report.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot add sightings to inactive reports' },
        { status: 400 }
      )
    }

    // Create the sighting
    const { data: sighting, error: sightingError } = await supabase
      .from('sightings')
      .insert({
        report_id,
        description,
        location,
        sighting_at: sighting_at || new Date().toISOString(),
        contact_info,
        reporter_id: user.id,
      })
      .select()
      .single()

    if (sightingError) {
      console.error('Sighting creation error:', sightingError)
      return NextResponse.json(
        { error: 'Failed to create sighting' },
        { status: 500 }
      )
    }

    // Handle photo uploads if provided
    let photoAttachments = []
    if (photos && photos.length > 0) {
      const uploadPromises = photos.map(async (photo: any, index: number) => {
        try {
          // In a real implementation, you'd handle file uploads here
          // For now, we'll just create the attachment records
          const { data: attachment, error: attachmentError } = await supabase
            .from('sighting_photos')
            .insert({
              sighting_id: sighting.id,
              file_name: photo.name || `photo-${index}`,
              file_path: photo.path || `sightings/${sighting.id}/photo-${index}`,
              file_url: photo.url || '',
              file_type: photo.type || 'image/jpeg',
              file_size: photo.size || 0,
            })
            .select()
            .single()

          if (attachmentError) {
            console.error('Attachment creation error:', attachmentError)
            return null
          }

          return attachment
        } catch (err) {
          console.error('Photo upload error:', err)
          return null
        }
      })

      try {
        photoAttachments = await Promise.all(uploadPromises)
        photoAttachments = photoAttachments.filter(att => att !== null)
      } catch (err) {
        console.error('Error processing photos:', err)
        // Don't fail the whole request if photos fail
      }
    }

    return NextResponse.json({
      success: true,
      sighting,
      photos: photoAttachments,
    })

  } catch (error) {
    console.error('Sighting API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('report_id')

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const { data: sightings, error } = await supabase
      .from('sightings')
      .select(`
        *,
        sighting_photos(*),
        reporter:profiles!reporter_id(id, full_name)
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Sighting fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sightings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sightings: sightings || [],
    })

  } catch (error) {
    console.error('Sighting GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
