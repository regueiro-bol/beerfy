/**
 * Datos de Google Maps de un local, pedidos EN EL MOMENTO de pintar la ficha.
 *
 * Términos de Google Maps Platform (Places API): no se puede almacenar ni cachear contenido de Places
 * salvo el place_id (indefinido) y lat/lng (máx. 30 días). Por eso horario, puntuación, teléfono y web
 * NO se guardan en Supabase: se piden aquí con `cache: 'no-store'` y se muestran con atribución «Google Maps».
 */

export type LivePlace = {
  openNow: boolean | null
  weekdayDescriptions: string[]
  rating: number | null
  userRatingCount: number | null
  googleMapsUri: string | null
  phone: string | null
  website: string | null
  businessStatus: string | null
}

const FIELDS = [
  'currentOpeningHours.openNow',
  'regularOpeningHours.weekdayDescriptions',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'nationalPhoneNumber',
  'websiteUri',
  'businessStatus',
].join(',')

type Resp = {
  currentOpeningHours?: { openNow?: boolean }
  regularOpeningHours?: { weekdayDescriptions?: string[] }
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  businessStatus?: string
}

export async function getLivePlace(placeId: string | null): Promise<LivePlace | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!placeId || !apiKey) return null

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es&regionCode=ES`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELDS },
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    })
    if (!res.ok) {
      console.error('Google Place live error', res.status, await res.text())
      return null
    }
    const p = (await res.json()) as Resp
    return {
      openNow: p.currentOpeningHours?.openNow ?? null,
      weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions ?? [],
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      googleMapsUri: p.googleMapsUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      businessStatus: p.businessStatus ?? null,
    }
  } catch (e) {
    console.error('Google Place live fetch failed', e)
    return null
  }
}

/** Solo la ubicación (SKU básico). Para refrescar la caché temporal de coordenadas. */
export async function getPlaceLocation(placeId: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'location' },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null
  const p = (await res.json()) as { location?: { latitude: number; longitude: number } }
  return p.location ? { lat: p.location.latitude, lng: p.location.longitude } : null
}
