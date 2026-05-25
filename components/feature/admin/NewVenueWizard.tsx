'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { City } from '@/lib/types/database'
import type { PlaceSearchResult } from '@/lib/google/places'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Beer, Loader2, Search, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface NewVenueWizardProps {
  cities: City[]
}

const AVAILABLE_HIGHLIGHTS = [
  'Terraza',
  'Cervecero',
  'Tapas',
  'Ambiente futbolero',
  'Familiar',
  'Tranquilo',
  'Castizo',
  'Moderno',
  'Histórico',
  'Universidad',
  'Mercado',
]

const TONES = [
  { value: 'classic', label: 'Clásico' },
  { value: 'modern', label: 'Moderno' },
  { value: 'sports', label: 'Deportivo / Futbolero' },
  { value: 'family', label: 'Familiar' },
  { value: 'cervecero', label: 'Cervecero' },
  { value: 'fiestero', label: 'Fiestero' },
]

export default function NewVenueWizard({ cities }: NewVenueWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 State
  const [searchName, setSearchName] = useState('')
  const [selectedCityId, setSelectedCityId] = useState(cities[0]?.id || '')

  // Step 2 State
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Step 3 State
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [formData, setFormData] = useState({
    city_id: cities[0]?.id || '',
    name: '',
    google_place_id: '',
    address: '',
    district: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    website: '',
    hours_json: null as unknown as Record<string, unknown> | null,
    cover_image_url: '',
    editorNote: '',
  })

  // Step 4 State
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [aiGeneratedData, setAiGeneratedData] = useState({
    description: '',
    meta_title: '',
    meta_description: '',
    highlights: [] as string[],
    suggested_district: '',
    tone: 'classic',
    description_ai_version: '1.0.0',
    description_edited_by_human: false,
  })

  // Track if user manually edits description
  const [initialDescription, setInitialDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Step 1: Trigger Search
  const handleSearch = async () => {
    if (!searchName.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const city = cities.find((c) => c.id === selectedCityId)
      const res = await fetch('/api/admin/venues/places-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchName, cityName: city?.name }),
      })
      if (!res.ok) throw new Error('Error al buscar locales')
      const results = (await res.json()) as PlaceSearchResult[]
      setSearchResults(results)
      setStep(2)
    } catch (e: unknown) {
      setSearchError((e as Error).message || 'Error en la búsqueda.')
    } finally {
      setSearching(false)
    }
  }

  // Step 2: Select a Place & Get Details
  const handleSelectPlace = async (placeId: string) => {
    setLoadingDetails(true)
    try {
      const res = await fetch('/api/admin/venues/place-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId }),
      })
      if (!res.ok) throw new Error('Error al obtener detalles del bar')
      const details = await res.json()

      // Build photo URL with public key
      const photoName = details.photos?.[0]?.name as string | undefined
      const cover_image_url = photoName
        ? `https://places.googleapis.com/v1/${photoName}/media?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&maxWidthPx=800`
        : ''

      setFormData((prev) => ({
        ...prev,
        name: details.name,
        google_place_id: details.id,
        address: details.formattedAddress,
        latitude: details.location.lat,
        longitude: details.location.lng,
        phone: details.nationalPhoneNumber || '',
        website: details.websiteUri || '',
        hours_json: (details.hoursJson as Record<string, unknown>) || null,
        cover_image_url,
      }))
      setStep(3)
    } catch (e: unknown) {
      alert((e as Error).message || 'Error cargando detalles del local.')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Step 3: Trigger AI Description Generation
  const handleGenerateDescription = async () => {
    setGeneratingDescription(true)
    try {
      const city = cities.find((c) => c.id === selectedCityId)
      const res = await fetch('/api/admin/venues/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          cityName: city?.name || '',
          placesData: {
            address: formData.address,
            phone: formData.phone,
            website: formData.website,
            hours: formData.hours_json,
          },
          editorNote: formData.editorNote,
        }),
      })

      if (!res.ok) throw new Error('Error en generación de descripción por IA')
      const data = await res.json()

      setAiGeneratedData({
        description: data.description,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        highlights: (data.highlights as string[]) || [],
        suggested_district: data.suggested_district || '',
        tone: data.tone || 'classic',
        description_ai_version: '1.0.0',
        description_edited_by_human: false,
      })
      setInitialDescription(data.description)
      // Autofill district if AI generated it
      if (data.suggested_district) {
        setFormData((prev) => ({ ...prev, district: data.suggested_district }))
      }
      setStep(4)
    } catch (e: unknown) {
      alert((e as Error).message || 'Error en la llamada de IA.')
    } finally {
      setGeneratingDescription(false)
    }
  }

  // Step 4: Toggle dynamic highlights
  const handleHighlightToggle = (tag: string) => {
    setAiGeneratedData((prev) => {
      const exists = prev.highlights.includes(tag)
      return {
        ...prev,
        highlights: exists
          ? prev.highlights.filter((t) => t !== tag)
          : [...prev.highlights, tag],
      }
    })
  }

  // Step 4: Save Venue to DB
  const handleSaveVenue = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const isEdited = aiGeneratedData.description !== initialDescription

      const payload = {
        ...formData,
        description: aiGeneratedData.description,
        description_ai_version: aiGeneratedData.description_ai_version,
        description_edited_by_human: isEdited,
        highlights: aiGeneratedData.highlights,
        tone: aiGeneratedData.tone,
        status,
      }

      const res = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error guardando el bar')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    } catch (e: unknown) {
      setSubmitError((e as Error).message || 'Error al persistir el venue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <Card className="max-w-md mx-auto py-12">
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
          <h2 className="text-2xl font-bold">¡Bar Guardado con éxito!</h2>
          <p className="text-muted-foreground text-sm">Redirigiendo al panel de administración...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wizard Steps indicator */}
      <div className="flex justify-between items-center max-w-xl mx-auto text-xs font-semibold text-muted-foreground">
        <span className={step === 1 ? 'text-primary font-bold' : ''}>1. Buscar</span>
        <span className="text-muted-foreground/30">&gt;</span>
        <span className={step === 2 ? 'text-primary font-bold' : ''}>2. Seleccionar</span>
        <span className="text-muted-foreground/30">&gt;</span>
        <span className={step === 3 ? 'text-primary font-bold' : ''}>3. Datos & IA</span>
        <span className="text-muted-foreground/30">&gt;</span>
        <span className={step === 4 ? 'text-primary font-bold' : ''}>4. Revisar & Publicar</span>
      </div>

      {/* STEP 1: Search Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Localizar Bar</CardTitle>
            <CardDescription>Busca el local por su nombre y selecciona la ciudad correspondiente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Nombre del bar</Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ej. O Seal, El Chozo, El Enxebre"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city-select">Ciudad</Label>
              <select
                id="city-select"
                value={selectedCityId}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedCityId(val)
                  setFormData((prev) => ({ ...prev, city_id: val }))
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            {searchError && <p className="text-sm text-destructive">{searchError}</p>}
            <Button onClick={handleSearch} disabled={searching || !searchName.trim()} className="w-full">
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                </>
              ) : (
                <>
                  Buscar en Google Places <Search className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Search Results */}
      {step === 2 && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Paso 2: Resultados en Google Places</CardTitle>
              <CardDescription>Selecciona el local correcto de los resultados encontrados.</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
            </Button>
          </CardHeader>
          <CardContent>
            {loadingDetails ? (
              <div className="flex flex-col items-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Obteniendo detalles del local de Google...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No se encontraron locales. Intenta afinar el término de búsqueda.</p>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-base">{result.name}</h4>
                      <p className="text-xs text-muted-foreground">{result.formattedAddress}</p>
                    </div>
                    <Button onClick={() => handleSelectPlace(result.id)}>
                      Seleccionar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Place Details & Trigger AI */}
      {step === 3 && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Paso 3: Datos de Google Places</CardTitle>
              <CardDescription>Confirma los datos pre-rellenados y añade notas para el redactor IA.</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venue-name">Nombre</Label>
                <Input
                  id="venue-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-address">Dirección</Label>
                <Input
                  id="venue-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-lat">Latitud</Label>
                <Input
                  id="venue-lat"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-lng">Longitud</Label>
                <Input
                  id="venue-lng"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-phone">Teléfono</Label>
                <Input
                  id="venue-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-website">Web</Label>
                <Input
                  id="venue-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editor-note">Notas del Editor (Indicaciones para la IA)</Label>
              <textarea
                id="editor-note"
                rows={3}
                value={formData.editorNote}
                onChange={(e) => setFormData({ ...formData, editorNote: e.target.value })}
                placeholder="Ej. Tienen raciones tradicionales espectaculares. El grifo está en la entrada. Vaso de bodega impecable."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <Button
              onClick={handleGenerateDescription}
              disabled={generatingDescription || !formData.name}
              className="w-full h-11"
            >
              {generatingDescription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando descripción con Claude...
                </>
              ) : (
                <>
                  Generar descripción con IA <Beer className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Review AI Generation & Save */}
      {step === 4 && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Paso 4: Revisión Editorial y Publicación</CardTitle>
              <CardDescription>Afina la descripción generada y los parámetros antes de guardar.</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-desc">Descripción Editorial (IA)</Label>
              <textarea
                id="ai-desc"
                rows={5}
                value={aiGeneratedData.description}
                onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, description: e.target.value })}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 80-120 palabras. Edítalo libremente. Se marcará automáticamente como revisado por humanos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Meta Title</Label>
                <Input
                  id="seo-title"
                  value={aiGeneratedData.meta_title}
                  onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, meta_title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-desc">Meta Description</Label>
                <textarea
                  id="seo-desc"
                  rows={2}
                  value={aiGeneratedData.meta_description}
                  onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, meta_description: e.target.value })}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-district">Barrio / Distrito</Label>
                <Input
                  id="venue-district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Ej. Casco Vello, Zona Vella, Malasaña"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-tone">Tono del Local</Label>
                <select
                  id="venue-tone"
                  value={aiGeneratedData.tone}
                  onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, tone: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Highlights del Local</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/20">
                {AVAILABLE_HIGHLIGHTS.map((tag) => {
                  const active = aiGeneratedData.highlights.includes(tag)
                  return (
                    <label key={tag} className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleHighlightToggle(tag)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{tag}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="venue-status">Estado de publicación</Label>
              <select
                id="venue-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="draft">Borrador (Solo visible en admin)</option>
                <option value="published">Publicado (Visible en web principal)</option>
              </select>
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSaveVenue()}
                disabled={submitting}
              >
                {submitting && status === 'draft' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Guardar Borrador
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setStatus('published')
                  handleSaveVenue()
                }}
                disabled={submitting}
              >
                {submitting && status === 'published' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
