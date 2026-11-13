import { createServiceClient } from '@/lib/supabase/service'
import { getVenueScores } from '@/lib/supabase/queries'

export type ArchivedVenue = {
  name: string
  reason: string | null
  archivedAt: string | null
  city: { name: string; slug: string }
  /** Bares con tanque publicados más cercanos (misma ciudad). */
  nearby: Array<{ name: string; slug: string; distanceM: number | null; score: number | null; votes: number }>
}

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Bar desactivado (archivado) por su ciudad y slug, para mostrar «ya no está en la guía» en vez de un error. */
export async function getArchivedVenue(citySlug: string, venueSlug: string): Promise<ArchivedVenue | null> {
  const supabase = createServiceClient()
  const { data: city } = await supabase.from('cities').select('id, name, slug').eq('slug', citySlug).maybeSingle()
  if (!city) return null
  const { data: venue } = await supabase
    .from('venues')
    .select('name, latitude, longitude, archived_reason, archived_at')
    .eq('city_id', city.id)
    .eq('slug', venueSlug)
    .eq('status', 'archived')
    .maybeSingle()
  if (!venue) return null

  const { data: others } = await supabase
    .from('venues')
    .select('id, name, slug, latitude, longitude')
    .eq('city_id', city.id)
    .eq('status', 'published')
  const here = venue.latitude !== null && venue.longitude !== null ? { lat: Number(venue.latitude), lng: Number(venue.longitude) } : null
  const list = (others || []).map((o) => ({
    ...o,
    d: here && o.latitude !== null && o.longitude !== null ? distanceM(here, { lat: Number(o.latitude), lng: Number(o.longitude) }) : null,
  }))
  list.sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity))
  const top = list.slice(0, 3)
  const scores = await getVenueScores(top.map((t) => t.id))

  return {
    name: venue.name as string,
    reason: (venue.archived_reason as string | null) ?? null,
    archivedAt: (venue.archived_at as string | null) ?? null,
    city: { name: city.name as string, slug: city.slug as string },
    nearby: top.map((t) => ({
      name: t.name as string,
      slug: t.slug as string,
      distanceM: t.d,
      score: scores[t.id]?.score ?? null,
      votes: scores[t.id]?.votes ?? 0,
    })),
  }
}
