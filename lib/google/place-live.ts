/**
 * Datos de Google Maps de un local, pedidos EN EL MOMENTO de pintar la ficha.
 *
 * Términos de Google Maps Platform (Places API): no se puede almacenar ni cachear contenido de Places
 * salvo el place_id (indefinido) y lat/lng (máx. 30 días). Por eso horario, puntuación, teléfono y web
 * NO se guardan en Supabase: se piden aquí con `cache: 'no-store'` y se muestran con atribución «Google Maps».
 * Las fotos tampoco se guardan: se resuelve su URL pública en cada visita y se muestra el autor.
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
  photos: LivePhoto[]
  priceLevel: string | null
  features: string[]
}

export type LivePhoto = {
  url: string
  author: string | null
  authorUri: string | null
}

/** Nº de fotos que se piden por ficha (cada una es una llamada facturable a Place Photos). */
export const MAX_PHOTOS = 1

const FIELDS = [
  'currentOpeningHours.openNow',
  'regularOpeningHours.weekdayDescriptions',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'nationalPhoneNumber',
  'websiteUri',
  'businessStatus',
  'photos',
  'priceLevel',
  'outdoorSeating',
  'goodForWatchingSports',
  'allowsDogs',
  'goodForGroups',
  'liveMusic',
  'servesBreakfast',
  'servesLunch',
  'servesDinner',
  'reservable',
  'paymentOptions',
  'accessibilityOptions',
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
  photos?: Array<{ name: string; authorAttributions?: Array<{ displayName?: string; uri?: string }> }>
  priceLevel?: string
  outdoorSeating?: boolean
  goodForWatchingSports?: boolean
  allowsDogs?: boolean
  goodForGroups?: boolean
  liveMusic?: boolean
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  reservable?: boolean
  paymentOptions?: { acceptsCreditCards?: boolean; acceptsNfc?: boolean; acceptsCashOnly?: boolean }
  accessibilityOptions?: { wheelchairAccessibleEntrance?: boolean }
}

const PRICE: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
}

function featuresOf(p: Resp): string[] {
  const f: string[] = []
  if (p.outdoorSeating) f.push('Terraza')
  if (p.goodForWatchingSports) f.push('Para ver deporte')
  if (p.liveMusic) f.push('Música en directo')
  if (p.allowsDogs) f.push('Admite perros')
  if (p.goodForGroups) f.push('Para grupos')
  const food = [p.servesBreakfast && 'desayunos', p.servesLunch && 'comidas', p.servesDinner && 'cenas'].filter(Boolean)
  if (food.length) f.push(`Sirve ${food.join(', ').replace(/, ([^,]*)$/, ' y $1')}`)
  if (p.reservable) f.push('Admite reservas')
  if (p.paymentOptions?.acceptsCashOnly) f.push('Solo efectivo')
  else if (p.paymentOptions?.acceptsCreditCards || p.paymentOptions?.acceptsNfc) f.push('Pago con tarjeta')
  if (p.accessibilityOptions?.wheelchairAccessibleEntrance) f.push('Entrada accesible')
  return f
}

/** Resuelve la URL pública de una foto sin exponer la clave (skipHttpRedirect devuelve photoUri). */
async function resolvePhoto(name: string, apiKey: string, maxWidthPx: number): Promise<string | null> {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`, {
      headers: { 'X-Goog-Api-Key': apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    })
    if (!res.ok) return null
    const j = (await res.json()) as { photoUri?: string }
    return j.photoUri ?? null
  } catch {
    return null
  }
}

/** `withPhotos=false` cuando el bar ya tiene foto propia: se ahorra la llamada a Place Photos. */
export async function getLivePlace(placeId: string | null, withPhotos = true): Promise<LivePlace | null> {
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
    const picked = withPhotos ? (p.photos ?? []).slice(0, MAX_PHOTOS) : []
    const urls = await Promise.all(picked.map((ph) => resolvePhoto(ph.name, apiKey, 1600)))
    const photos: LivePhoto[] = picked
      .map((ph, i) => ({
        url: urls[i] ?? '',
        author: ph.authorAttributions?.[0]?.displayName ?? null,
        authorUri: ph.authorAttributions?.[0]?.uri ?? null,
      }))
      .filter((ph) => ph.url)
    return {
      openNow: p.currentOpeningHours?.openNow ?? null,
      weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions ?? [],
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      googleMapsUri: p.googleMapsUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      businessStatus: p.businessStatus ?? null,
      photos,
      priceLevel: p.priceLevel ? (PRICE[p.priceLevel] ?? null) : null,
      features: featuresOf(p),
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

/**
 * Foto de portada de Google para las tarjetas (2 llamadas: detalles con solo `photos` + la foto).
 * No se guarda: se pide al pintar la página.
 */
export async function getPlaceCover(placeId: string | null, maxWidthPx = 900): Promise<LivePhoto | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!placeId || !apiKey) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    })
    if (!res.ok) return null
    const p = (await res.json()) as Pick<Resp, 'photos'>
    const ph = p.photos?.[0]
    if (!ph) return null
    const url = await resolvePhoto(ph.name, apiKey, maxWidthPx)
    if (!url) return null
    return { url, author: ph.authorAttributions?.[0]?.displayName ?? null, authorUri: ph.authorAttributions?.[0]?.uri ?? null }
  } catch {
    return null
  }
}

/** Portadas para una lista de bares: la foto propia si existe; si no, la de Google. */
export async function getCovers(
  venues: Array<{ id: string; cover_image_url: string | null; google_place_id: string | null }>
): Promise<Record<string, { url: string; google: LivePhoto | null } | null>> {
  const out: Record<string, { url: string; google: LivePhoto | null } | null> = {}
  await Promise.all(
    venues.map(async (v) => {
      if (v.cover_image_url) {
        out[v.id] = { url: v.cover_image_url, google: null }
        return
      }
      const g = await getPlaceCover(v.google_place_id)
      out[v.id] = g ? { url: g.url, google: g } : null
    })
  )
  return out
}

export type OpeningPoint = { day: number; hour: number; minute: number }
export type OpeningPeriod = { open: OpeningPoint; close?: OpeningPoint }

/**
 * Horario semanal de un sitio (Google regularOpeningHours.periods). `day`: 0 = domingo.
 * Un único periodo sin `close` significa abierto 24 h. Devuelve null si Google no lo da.
 */
export async function getPlaceHours(placeId: string): Promise<{ periods: OpeningPeriod[] | null; businessStatus: string | null } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!placeId || !apiKey) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'regularOpeningHours.periods,businessStatus' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const p = (await res.json()) as { regularOpeningHours?: { periods?: OpeningPeriod[] }; businessStatus?: string }
    const periods = (p.regularOpeningHours?.periods ?? [])
      .filter((x) => x.open && Number.isInteger(x.open.day))
      .map((x) => ({
        open: { day: x.open.day, hour: x.open.hour ?? 0, minute: x.open.minute ?? 0 },
        ...(x.close ? { close: { day: x.close.day, hour: x.close.hour ?? 0, minute: x.close.minute ?? 0 } } : {}),
      }))
    return { periods: periods.length ? periods : null, businessStatus: p.businessStatus ?? null }
  } catch {
    return null
  }
}
