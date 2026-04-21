'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, MapPin, Clock, CheckCircle2, LogIn, Navigation, Crosshair } from 'lucide-react'
import Link from 'next/link'

interface SightingFormProps {
  reportId: string
  userId: string | null
}

export function SightingForm({ reportId, userId }: SightingFormProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [sightedAt, setSightedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        
        // Reverse geocoding to get address
        try {
          let address = null
          
          // Try multiple geocoding services
          if (process.env.NEXT_PUBLIC_GEOCODING_API_KEY) {
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?apikey=${process.env.NEXT_PUBLIC_GEOCODING_API_KEY}&lat=${latitude}&lon=${longitude}&localityLanguage=en`
              )
              const data = await response.json()
              if (data.status === 'ok' && data.results.length > 0) {
                address = data.results[0].formatted
              }
            } catch (err) {
              console.error('Primary geocoding failed:', err)
            }
          }
          
          // Fallback to OpenStreetMap Nominatim (free, no API key required)
          if (!address) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              )
              const data = await response.json()
              if (data.display_name) {
                address = data.display_name
              }
            } catch (err) {
              console.error('Fallback geocoding failed:', err)
            }
          }
          
          setUserLocation({ lat: latitude, lng: longitude, address: address || undefined })
          if (address) {
            setLocationDescription(address)
          }
        } catch (err) {
          console.error('Geocoding error:', err)
          setUserLocation({ lat: latitude, lng: longitude })
        }
        
        setLocationLoading(false)
        setUseCurrentLocation(true)
      },
      (error) => {
        console.error('Location error:', error)
        setError('Unable to get your location. Please enter it manually.')
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  if (!userId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Eye className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg mb-1">Seen something?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to report a sighting and help the community
          </p>
          <Button asChild>
            <Link href="/auth/login">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to Report Sighting
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Ensure profile exists
      await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })

      const sightingData: any = {
          report_id: reportId,
          reporter_id: userId,
          description: description.trim(),
          location_description: locationDescription.trim() || null,
          sighted_at: sightedAt ? new Date(sightedAt).toISOString() : new Date().toISOString(),
        }
        
        // Only add location coordinates if columns exist
        if (userLocation?.lat && userLocation?.lng) {
          sightingData.latitude = userLocation.lat
          sightingData.longitude = userLocation.lng
        }

      const { error: insertError } = await supabase
        .from('sightings')
        .insert(sightingData)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setDescription('')
      setLocationDescription('')
      setSightedAt('')
      
      // Refresh the page to show the new sighting
      setTimeout(() => {
        router.refresh()
        setSuccess(false)
      }, 2000)
    } catch {
      setError('Failed to submit sighting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="flex items-center gap-3 py-6">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Sighting submitted!</p>
            <p className="text-sm text-green-600 dark:text-green-400">Thank you for helping the community. The page will refresh shortly.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          Report a Sighting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label htmlFor="sighting-description" className="text-sm font-medium mb-1.5 block">
              What did you see? *
            </label>
            <Textarea
              id="sighting-description"
              placeholder="Describe what you saw — include details like appearance, direction of movement, who they were with, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sighting-location" className="text-sm font-medium mb-1.5 flex items-center gap-1 block">
                <MapPin className="h-3.5 w-3.5" />
                Where?
              </label>
              <div className="flex gap-2">
                <Input
                  id="sighting-location"
                  placeholder="e.g., Corner of Main St & Oak Ave"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  title="Use current location"
                >
                  {locationLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {userLocation && useCurrentLocation && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Crosshair className="h-3 w-3" />
                    <span className="font-medium">Reporting from current location:</span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400">
                    {userLocation.address || `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="sighting-time" className="text-sm font-medium mb-1.5 flex items-center gap-1 block">
                <Clock className="h-3.5 w-3.5" />
                When?
              </label>
              <Input
                id="sighting-time"
                type="datetime-local"
                value={sightedAt}
                onChange={(e) => setSightedAt(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || !description.trim()} className="w-full sm:w-auto">
            {loading ? 'Submitting...' : 'Submit Sighting'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
