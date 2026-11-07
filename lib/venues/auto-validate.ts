import { createServiceClient } from '@/lib/supabase/service'
import { searchPlaces, getPlaceDetails, type PlaceSearchResult } from '@/lib/google/places'
import { geocodeAddress } from '@/lib/geo/nominatim'

/**
 * Validación automática de sugerencias contra Google Places.
 * Se publica SOLO si la coincidencia es clara:
 *  - el nombre sugerido y el de Google comparten al menos la mitad de sus palabras significativas, y
 *  - el local está a menos de MAX_KM del centro de la ciudad de la guía, y
 *  - Google lo tiene como operativo y es un tipo de local de hostelería.
 * Si no, la sugerencia queda pendiente con una nota explicando por qué.
 */

const MAX_KM = 20
const STOP = new Set(['bar', 'cafe', 'cafeteria', 'cerveceria', 'taberna', 'restaurante', 'la', 'el', 'los', 'las', 'de', 'do', 'da', 'o', 'a', 'y', 'e', 'sports'])
const HOSPITALITY = ['bar', 'cafe', 'restaurant', 'pub', 'food', 'meal', 'brewery', 'night_club', 'wine_bar', 'coffee', 'tapas']

function words(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
}

export function nameMatch(a: string, b: string) {
  const wa = new Set(words(a))
  const wb = new Set(words(b))
  if (wa.size === 0 || wb.size === 0) return 0
  let common = 0
  wa.forEach((w) => wb.has(w) && common++)
  return common / Math.min(wa.size, wb.size)
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}


/** Enlaza un bar a Estrella Galicia de Bodega en tanque (cerveza por defecto mientras el alta no pregunta la cerveza). */
async function linkDefaultBeer(venueId: string) {
  const supabase = createServiceClient()
  const { data: beer } = await supabase.from('beers').select('id').eq('slug', 'estrella-galicia-de-bodega').maybeSingle()
  if (beer) await supabase.from('venue_beers').upsert({ venue_id: venueId, beer_id: beer.id, source: 'equipo' }, { onConflict: 'venue_id,beer_id' })
}

/** Crea y publica un bar desde un place_id de Google. Devuelve el slug o null si ya existía. */
export async function publishVenueFromPlace(opts: {
  cityId: string
  placeId: string
  name: string
  servesBodega: boolean
  fallbackAddress?: string | null
  /** Ficha provisional (sin place_id) que hay que completar en lugar de crear otra. */
  provisionalSlug?: string
}) {
  const supabase = createServiceClient()
  const { data: dup } = await supabase.from('venues').select('id, slug').eq('google_place_id', opts.placeId).maybeSingle()
  if (dup) return { created: false as const, slug: dup.slug as string }

  const place = await getPlaceDetails(opts.placeId)

  if (opts.provisionalSlug) {
    const { data: prov } = await supabase
      .from('venues')
      .select('id, slug')
      .eq('city_id', opts.cityId)
      .eq('slug', opts.provisionalSlug)
      .is('google_place_id', null)
      .maybeSingle()
    if (prov) {
      const { error } = await supabase
        .from('venues')
        .update({
          google_place_id: opts.placeId,
          address: place.formattedAddress || opts.fallbackAddress || null,
          latitude: place.location.lat || null,
          longitude: place.location.lng || null,
          coords_source: 'google',
          coords_updated_at: new Date().toISOString(),
        })
        .eq('id', prov.id)
      if (error) throw new Error(error.message)
      return { created: true as const, slug: prov.slug as string }
    }
  }
  const base = slugify(opts.name) || 'bar'
  let slug = base
  for (let i = 2; i < 20; i++) {
    const { data: taken } = await supabase.from('venues').select('id').eq('city_id', opts.cityId).eq('slug', slug).maybeSingle()
    if (!taken) break
    slug = `${base}-${i}`
  }
  const now = new Date().toISOString()
  const { data: inserted, error } = await supabase.from('venues').insert({
    city_id: opts.cityId,
    slug,
    name: opts.name,
    google_place_id: opts.placeId,
    address: place.formattedAddress || opts.fallbackAddress || null,
    latitude: place.location.lat || null,
    longitude: place.location.lng || null,
    coords_source: 'google',
    coords_updated_at: now,
    serves_eg_bodega: opts.servesBodega,
    status: 'published',
    published_at: now,
  }).select('id').single()
  if (error) throw new Error(error.message)
  if (opts.servesBodega && inserted) await linkDefaultBeer(inserted.id)
  return { created: true as const, slug }
}

export type AutoResult = { id: string; name: string; result: 'published' | 'duplicate' | 'pending'; detail: string; url?: string }

export async function autoValidateSuggestion(suggestionId: string): Promise<AutoResult> {
  const supabase = createServiceClient()
  const { data: s } = await supabase
    .from('venue_suggestions')
    .select('id, venue_name, address, city_id, status, cities(name, slug, latitude, longitude)')
    .eq('id', suggestionId)
    .single()
  if (!s) return { id: suggestionId, name: '?', result: 'pending', detail: 'No encontrada' }
  const city = s.cities as unknown as { name: string; slug: string; latitude: number | null; longitude: number | null } | null
  const now = new Date().toISOString()
  const keepPending = async (detail: string): Promise<AutoResult> => {
    await supabase.from('venue_suggestions').update({ ai_notes: detail, ai_processed_at: now, ai_prompt_version: 'auto-v1' }).eq('id', s.id)
    return { id: s.id, name: s.venue_name, result: 'pending', detail }
  }

  if (s.status !== 'pending') return { id: s.id, name: s.venue_name, result: 'pending', detail: `Estado ${s.status}` }
  if (!s.city_id || !city) return keepPending('Ciudad fuera de la guía')

  let results: PlaceSearchResult[]
  try {
    results = await searchPlaces([s.venue_name, s.address].filter(Boolean).join(', '), city.name)
  } catch (e) {
    return keepPending(`Error de Google: ${(e as Error).message.slice(0, 200)}`)
  }
  const top = results[0]
  if (!top) return keepPending('Google no devuelve resultados')

  const score = nameMatch(s.venue_name, top.name)
  const dist = city.latitude && city.longitude ? km(top.location, { lat: Number(city.latitude), lng: Number(city.longitude) }) : 0
  const type = (top.primaryType || '').toLowerCase()
  const isHosp = !type || HOSPITALITY.some((h) => type.includes(h))

  if (score < 0.5) return keepPending(`Nombre poco parecido: «${top.name}» (${Math.round(score * 100)}%)`)
  if (dist > MAX_KM) return keepPending(`Demasiado lejos de ${city.name}: ${dist.toFixed(1)} km`)
  if (!isHosp) return keepPending(`Tipo de local dudoso: ${type}`)

  const pub = await publishVenueFromPlace({
    cityId: s.city_id,
    placeId: top.id,
    name: top.name || s.venue_name,
    servesBodega: true,
    fallbackAddress: s.address,
    provisionalSlug: slugify(s.venue_name),
  })
  await supabase
    .from('venue_suggestions')
    .update({
      status: pub.created ? 'approved' : 'duplicate',
      google_place_id: top.id,
      reviewed_at: now,
      ai_processed_at: now,
      ai_prompt_version: 'auto-v1',
      ai_notes: `Auto: «${top.name}», ${top.formattedAddress}, coincidencia ${Math.round(score * 100)}%, ${dist.toFixed(1)} km`,
    })
    .eq('id', s.id)
  return {
    id: s.id,
    name: s.venue_name,
    result: pub.created ? 'published' : 'duplicate',
    detail: `${top.name} · ${top.formattedAddress} · ${top.location.lat.toFixed(5)},${top.location.lng.toFixed(5)} · ${type}`,
    url: `/${city.slug}/${pub.slug}`,
  }
}

/**
 * Publica una ficha PROVISIONAL sin Google: nombre y dirección de la sugerencia y coordenadas de OpenStreetMap.
 * La sugerencia sigue pendiente; cuando la validación con Google funcione, completará esta misma ficha.
 */
export async function publishProvisional(suggestionId: string): Promise<AutoResult> {
  const supabase = createServiceClient()
  const { data: s } = await supabase
    .from('venue_suggestions')
    .select('id, venue_name, address, city_id, status, cities(name, slug)')
    .eq('id', suggestionId)
    .single()
  if (!s || s.status !== 'pending' || !s.city_id) return { id: suggestionId, name: s?.venue_name ?? '?', result: 'pending', detail: 'No apta' }
  const city = s.cities as unknown as { name: string; slug: string }
  const slug = slugify(s.venue_name)
  const { data: exists } = await supabase
    .from('venues')
    .select('id, latitude, google_place_id')
    .eq('city_id', s.city_id)
    .eq('slug', slug)
    .maybeSingle()
  if (exists) {
    // Ficha provisional sin coordenadas: reintenta la geocodificación.
    if (exists.latitude === null && !exists.google_place_id && s.address) {
      const g = await geocodeAddress(s.address)
      if (g) {
        await supabase.from('venues').update({ latitude: g.lat, longitude: g.lng, coords_updated_at: new Date().toISOString() }).eq('id', exists.id)
        return { id: s.id, name: s.venue_name, result: 'published', detail: `geocodificada: ${g.lat.toFixed(5)},${g.lng.toFixed(5)} · ${g.label}`, url: `/${city.slug}/${slug}` }
      }
    }
    return { id: s.id, name: s.venue_name, result: 'duplicate', detail: 'Ya publicada', url: `/${city.slug}/${slug}` }
  }

  const geo = s.address ? await geocodeAddress(s.address) : null
  const now = new Date().toISOString()
  const { data: inserted, error } = await supabase.from('venues').insert({
    city_id: s.city_id,
    slug,
    name: s.venue_name,
    address: s.address,
    latitude: geo?.lat ?? null,
    longitude: geo?.lng ?? null,
    coords_source: 'manual',
    coords_updated_at: geo ? now : null,
    serves_eg_bodega: true,
    status: 'published',
    published_at: now,
  }).select('id').single()
  if (error) return { id: s.id, name: s.venue_name, result: 'pending', detail: error.message }
  if (inserted) await linkDefaultBeer(inserted.id)
  await supabase
    .from('venue_suggestions')
    .update({ ai_notes: `Ficha provisional publicada (coordenadas OSM: ${geo ? geo.label : 'sin geocodificar'}). Pendiente de Google.` })
    .eq('id', s.id)
  return {
    id: s.id,
    name: s.venue_name,
    result: 'published',
    detail: geo ? `${geo.lat.toFixed(5)},${geo.lng.toFixed(5)} · ${geo.label}` : 'sin coordenadas',
    url: `/${city.slug}/${slug}`,
  }
}
