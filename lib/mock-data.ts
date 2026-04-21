import type { Report, Sighting } from '@/lib/types'

const now = new Date().toISOString()

export const mockReports: Report[] = [
  {
    id: 'demo-report-1',
    vcon_uuid: 'demo-vcon-1',
    report_type: 'missing_child',
    status: 'active',
    subject: 'Missing child near Lincoln Park',
    description: 'Last seen wearing a red hoodie and blue jeans.',
    person_details: {
      name: 'Jamie R.',
      age: 9,
      gender: 'female',
      clothing_description: 'Red hoodie, blue jeans, white shoes',
    },
    last_seen_location: 'Lincoln Park Playground',
    last_seen_lat: 41.9214,
    last_seen_lng: -87.6513,
    last_seen_at: now,
    reporter_id: 'demo-user',
    created_at: now,
    updated_at: now,
    sighting_count: 1,
    attachments: [
      {
        id: 'demo-attachment-1',
        report_id: 'demo-report-1',
        type: 'image',
        mime_type: 'image/jpeg',
        filename: 'missing-child-photo.jpg',
        url: 'https://picsum.photos/seed/missing-child/400/400.jpg',
        description: 'Photo of missing child',
        is_primary: true,
        created_at: now
      }
    ],
  },
  {
    id: 'demo-report-2',
    vcon_uuid: 'demo-vcon-2',
    report_type: 'missing_item',
    status: 'active',
    subject: 'Stolen blue sedan',
    description: 'Blue 2018 Toyota Camry missing from downtown parking lot.',
    item_details: {
      item_type: 'vehicle',
      make: 'Toyota',
      model: 'Camry',
      year: 2018,
      color: 'Blue',
      license_plate: 'ABC-1234',
    },
    last_seen_location: 'Wacker Dr Parking Garage',
    last_seen_lat: 41.888,
    last_seen_lng: -87.626,
    last_seen_at: now,
    reporter_id: 'demo-user',
    created_at: now,
    updated_at: now,
    sighting_count: 0,
    attachments: [
      {
        id: 'demo-attachment-2',
        report_id: 'demo-report-2',
        type: 'image',
        mime_type: 'image/jpeg',
        filename: 'stolen-car-photo.jpg',
        url: 'https://picsum.photos/seed/stolen-car/400/400.jpg',
        description: 'Photo of stolen vehicle',
        is_primary: true,
        created_at: now
      }
    ],
  },
]

export const mockSightings: Sighting[] = [
  {
    id: 'demo-sighting-1',
    report_id: 'demo-report-1',
    reporter_id: 'demo-user-2',
    description: 'Possible match heading east near the pond.',
    location_description: 'Lincoln Park South Pond',
    lat: 41.9222,
    lng: -87.6334,
    sighted_at: now,
    is_verified: false,
    created_at: now,
  },
]
