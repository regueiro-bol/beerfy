export interface PlaceSearchResult {
  id: string
  name: string
  formattedAddress: string
  location: {
    lat: number
    lng: number
  }
  primaryType?: string
  googleMapsUri?: string
}

export interface PlaceDetails {
  id: string
  name: string
  formattedAddress: string
  location: {
    lat: number
    lng: number
  }
  nationalPhoneNumber?: string
  websiteUri?: string
  hoursJson?: unknown
  photos?: Array<{
    name: string
    widthPx: number
    heightPx: number
  }>
  types?: string[]
  primaryType?: string
}

interface GooglePlacesSearchResponse {
  places?: Array<{
    id: string
    displayName?: { text: string }
    formattedAddress?: string
    location?: { latitude: number; longitude: number }
    primaryType?: string
    googleMapsUri?: string
  }>
}

interface GooglePlaceDetailsResponse {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  nationalPhoneNumber?: string
  websiteUri?: string
  currentOpeningHours?: unknown
  photos?: Array<{
    name: string
    widthPx: number
    heightPx: number
  }>
  types?: string[]
  primaryType?: string
}

const PLACES_API_URL = 'https://places.googleapis.com/v1/places'

export async function searchPlaces(query: string, cityName?: string): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not defined')
  }

  const queryText = cityName ? `${query}, ${cityName}` : query

  const res = await fetch(`${PLACES_API_URL}:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.googleMapsUri',
    },
    body: JSON.stringify({
      textQuery: queryText,
      languageCode: 'es',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Google Places Search API error ${res.status}: ${errorText}`)
  }

  const data = (await res.json()) as GooglePlacesSearchResponse
  const places = data.places || []

  return places.map((p) => ({
    id: p.id,
    name: p.displayName?.text || '',
    formattedAddress: p.formattedAddress || '',
    location: {
      lat: p.location?.latitude || 0,
      lng: p.location?.longitude || 0,
    },
    primaryType: p.primaryType || undefined,
    googleMapsUri: p.googleMapsUri || undefined,
  }))
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not defined')
  }

  const res = await fetch(`${PLACES_API_URL}/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,nationalPhoneNumber,websiteUri,currentOpeningHours,photos,types,primaryType',
    },
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Google Place Details API error ${res.status}: ${errorText}`)
  }

  const p = (await res.json()) as GooglePlaceDetailsResponse

  return {
    id: p.id,
    name: p.displayName?.text || '',
    formattedAddress: p.formattedAddress || '',
    location: {
      lat: p.location?.latitude || 0,
      lng: p.location?.longitude || 0,
    },
    nationalPhoneNumber: p.nationalPhoneNumber || undefined,
    websiteUri: p.websiteUri || undefined,
    hoursJson: p.currentOpeningHours || undefined,
    photos: p.photos
      ? p.photos.map((photo) => ({
          name: photo.name,
          widthPx: photo.widthPx,
          heightPx: photo.heightPx,
        }))
      : undefined,
    types: p.types || [],
    primaryType: p.primaryType || undefined,
  }
}
