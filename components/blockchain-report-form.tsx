'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useXionWallet } from '@/hooks/use-xion-wallet'
import { communityWatchContract } from '@/lib/xion-contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Car, AlertTriangle, AlertCircle, MapPin, Shield, Database } from 'lucide-react'
import type { ReportType, PersonDetails, ItemDetails } from '@/lib/types'

interface BlockchainReportFormProps {
  userId: string
}

export function BlockchainReportForm({ userId }: BlockchainReportFormProps) {
  const router = useRouter()
  const { isConnected, address } = useXionWallet()
  const [loading, setLoading] = useState(false)
  const [blockchainLoading, setBlockchainLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Blockchain toggle
  const [storeOnBlockchain, setStoreOnBlockchain] = useState(false)
  
  // Common fields
  const [reportType, setReportType] = useState<ReportType>('missing_child')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [lastSeenLocation, setLastSeenLocation] = useState('')
  const [lastSeenAt, setLastSeenAt] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [severity, setSeverity] = useState(3) // 1-5 scale
  const [category, setCategory] = useState('general')
  
  // Location coordinates (for blockchain)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  
  // Person details
  const [personName, setPersonName] = useState('')
  const [personAge, setPersonAge] = useState('')
  const [personGender, setPersonGender] = useState('')
  const [personHeight, setPersonHeight] = useState('')
  const [personWeight, setPersonWeight] = useState('')
  const [personHairColor, setPersonHairColor] = useState('')
  const [personEyeColor, setPersonEyeColor] = useState('')
  const [personClothing, setPersonClothing] = useState('')
  const [personFeatures, setPersonFeatures] = useState('')
  const [personRelationship, setPersonRelationship] = useState('')
  
  // Item details
  const [itemType, setItemType] = useState<'vehicle' | 'property' | 'pet' | 'other'>('vehicle')
  const [itemName, setItemName] = useState('')
  const [itemMake, setItemMake] = useState('')
  const [itemModel, setItemModel] = useState('')
  const [itemYear, setItemYear] = useState('')
  const [itemColor, setItemColor] = useState('')
  const [itemLicensePlate, setItemLicensePlate] = useState('')
  const [itemDescription, setItemDescription] = useState('')

  const generateReportId = () => {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // Ensure the user profile exists
      await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })

      // Build person or item details based on report type
      let personDetails: PersonDetails | undefined
      let itemDetails: ItemDetails | undefined

      if (reportType === 'missing_child') {
        personDetails = {
          name: personName,
          age: personAge ? parseInt(personAge) : undefined,
          gender: personGender || undefined,
          height: personHeight || undefined,
          weight: personWeight || undefined,
          hair_color: personHairColor || undefined,
          eye_color: personEyeColor || undefined,
          clothing_description: personClothing || undefined,
          distinguishing_features: personFeatures || undefined,
          relationship_to_reporter: personRelationship || undefined,
        }
      } else if (reportType === 'missing_item') {
        itemDetails = {
          item_type: itemType,
          name: itemName || undefined,
          make: itemMake || undefined,
          model: itemModel || undefined,
          year: itemYear ? parseInt(itemYear) : undefined,
          color: itemColor || undefined,
          license_plate: itemLicensePlate || undefined,
          description: itemDescription || undefined,
        }
      }

      // First, create the report in Supabase
      const { data, error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: userId,
          report_type: reportType,
          subject,
          description: description || null,
          person_details: personDetails || null,
          item_details: itemDetails || null,
          last_seen_location: lastSeenLocation || null,
          last_seen_at: lastSeenAt ? new Date(lastSeenAt).toISOString() : null,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          contact_email: contactEmail || null,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // If blockchain storage is enabled and wallet is connected
      if (storeOnBlockchain && isConnected && address) {
        setBlockchainLoading(true)
        
        try {
          const reportId = generateReportId()
          const location = {
            latitude: latitude ? parseFloat(latitude) : 0,
            longitude: longitude ? parseFloat(longitude) : 0,
            address: lastSeenLocation || undefined,
          }

          // Store on blockchain
          const txHash = await communityWatchContract.createReport({
            id: reportId,
            title: subject,
            description: description || '',
            location,
            category: category || 'general',
            severity: severity || 3,
            attachments: [], // Could be added later
          })

          // Update Supabase record with blockchain info
          await supabase
            .from('reports')
            .update({
              blockchain_tx_hash: txHash,
              blockchain_report_id: reportId,
              stored_on_chain: true,
            })
            .eq('id', data.id)

          setSuccess('Report created successfully and stored on blockchain!')
        } catch (blockchainError) {
          console.error('Blockchain error:', blockchainError)
          setError('Report created in database but failed to store on blockchain: ' + 
            (blockchainError instanceof Error ? blockchainError.message : 'Unknown error'))
        } finally {
          setBlockchainLoading(false)
        }
      } else {
        setSuccess('Report created successfully!')
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/reports/${data.id}`)
        router.refresh()
      }, 2000)

    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canUseBlockchain = isConnected && storeOnBlockchain

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Options
          </CardTitle>
          <CardDescription>
            Choose where to store your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Switch
                  checked={storeOnBlockchain}
                  onCheckedChange={setStoreOnBlockchain}
                  disabled={!isConnected}
                />
                <Label htmlFor="blockchain-store">Store on Blockchain</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? "Store your report permanently on the Xion blockchain for enhanced security and transparency"
                  : "Connect your Xion wallet to enable blockchain storage"
                }
              </p>
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50">
                <Shield className="h-3 w-3 mr-1" />
                Wallet Connected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Type</CardTitle>
          <CardDescription>Select what you are reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="missing_child" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Missing Person</span>
                <span className="sm:hidden">Person</span>
              </TabsTrigger>
              <TabsTrigger value="missing_item" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Missing Item</span>
                <span className="sm:hidden">Item</span>
              </TabsTrigger>
              <TabsTrigger value="general_incident" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Incident</span>
                <span className="sm:hidden">Incident</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Provide a clear title and description</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subject">Title *</FieldLabel>
              <Input
                id="subject"
                placeholder={
                  reportType === 'missing_child' 
                    ? "e.g., Missing: 8-year-old boy last seen at Lincoln Park" 
                    : reportType === 'missing_item'
                    ? "e.g., Stolen: Silver Toyota Camry from Main St"
                    : "e.g., Suspicious activity reported on Oak Avenue"
                }
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Provide any additional details that might help..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </Field>
            
            {canUseBlockchain && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="suspicious">Suspicious</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="severity">Severity (1-5)</FieldLabel>
                    <Select value={severity.toString()} onValueChange={(v) => setSeverity(parseInt(v))}>
                      <SelectTrigger id="severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Low</SelectItem>
                        <SelectItem value="2">2 - Minor</SelectItem>
                        <SelectItem value="3">3 - Moderate</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {canUseBlockchain && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Precise Location (Blockchain)
            </CardTitle>
            <CardDescription>
              Exact coordinates for blockchain storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 40.7128"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g., -74.0060"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Person and item details sections remain the same as original */}
      {reportType === 'missing_child' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Person Details</CardTitle>
            <CardDescription>Describe the missing person</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="personName">Full Name *</FieldLabel>
                  <Input
                    id="personName"
                    placeholder="Full name of the missing person"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="personAge">Age</FieldLabel>
                  <Input
                    id="personAge"
                    type="number"
                    placeholder="Age"
                    value={personAge}
                    onChange={(e) => setPersonAge(e.target.value)}
                  />
                </Field>
              </div>
              {/* Additional person fields... */}
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {reportType === 'missing_item' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Describe the missing item</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="itemType">Item Type *</FieldLabel>
                <Select value={itemType} onValueChange={(v) => setItemType(v as typeof itemType)}>
                  <SelectTrigger id="itemType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="property">Property / Electronics</SelectItem>
                    <SelectItem value="pet">Pet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {/* Additional item fields... */}
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Last Seen Location
          </CardTitle>
          <CardDescription>Where and when was the person/item last seen?</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lastSeenLocation">Location</FieldLabel>
              <Input
                id="lastSeenLocation"
                placeholder="e.g., Lincoln Park, near the main entrance"
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastSeenAt">Date and Time</FieldLabel>
              <Input
                id="lastSeenAt"
                type="datetime-local"
                value={lastSeenAt}
                onChange={(e) => setLastSeenAt(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How can people reach you with information?</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contactName">Contact Name</FieldLabel>
              <Input
                id="contactName"
                placeholder="Your name or preferred contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="contactPhone">Phone Number</FieldLabel>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="Your phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="Your email address"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || blockchainLoading}>
          {(loading || blockchainLoading) ? <Spinner className="mr-2" /> : null}
          {blockchainLoading ? 'Storing on Blockchain...' : 
           loading ? 'Creating Report...' : 
           storeOnBlockchain ? 'Create Report (Blockchain)' : 'Create Report'}
        </Button>
      </div>
    </form>
  )
}
