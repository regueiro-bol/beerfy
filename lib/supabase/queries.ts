import { createClient } from './server'
import type { City, Venue } from '@/lib/types/database'

export async function getPublishedCities(): Promise<City[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_published', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching published cities:', error)
    return []
  }

  return data || []
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(`Error fetching city by slug ${slug}:`, error)
    }
    return null
  }

  return data
}

export async function getPublishedVenuesForCity(cityId: string): Promise<Venue[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .order('name', { ascending: true })

  if (error) {
    console.error(`Error fetching venues for city ${cityId}:`, error)
    return []
  }

  return data || []
}

export async function getVenueBySlugs(
  citySlug: string,
  venueSlug: string
): Promise<{ venue: Venue; city: City } | null> {
  const supabase = await createClient()

  // Fetch published city
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', citySlug)
    .eq('is_published', true)
    .single()

  if (cityError || !city) {
    return null
  }

  // Fetch published venue
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .eq('city_id', city.id)
    .eq('slug', venueSlug)
    .eq('status', 'published')
    .single()

  if (venueError || !venue) {
    return null
  }

  return { venue, city }
}

export async function getPublishedVenues(): Promise<Array<Venue & { cities: { slug: string } | null }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*, cities(slug)')
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching all published venues:', error)
    return []
  }

  return (data || []) as unknown as Array<Venue & { cities: { slug: string } | null }>
}

type RatingRow = {
  rating: number
  score_temperature: number | null
  score_foam: number | null
  score_glass: number | null
  score_freshness: number | null
}

/** Nota 1–5 de una valoración: media exacta de los 4 criterios si existen; si no, la nota global antigua. */
function ratingValue(r: RatingRow) {
  const c = [r.score_temperature, r.score_foam, r.score_glass, r.score_freshness]
  return c.every((v): v is number => typeof v === 'number') ? c.reduce((a, b) => a + b, 0) / 4 : r.rating
}

export type VenueWithCity = Venue & { cities: { slug: string; name: string } | null }
export type VenueScore = { score: number | null; votes: number }

/**
 * Nota de tirada (0–10) por local, a partir de las valoraciones visibles (1–5 → ×2).
 */
/** Votos mínimos para mostrar la Nota de tirada (antes, el bar está «en calibración»). */
export const MIN_VOTES = 5

export async function getVenueScores(venueIds: string[]): Promise<Record<string, VenueScore>> {
  const out: Record<string, VenueScore> = {}
  venueIds.forEach((id) => (out[id] = { score: null, votes: 0 }))
  if (venueIds.length === 0) return out

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ratings')
    .select('venue_id, rating, score_temperature, score_foam, score_glass, score_freshness')
    .in('venue_id', venueIds)
    .eq('status', 'visible')

  if (error) {
    console.error('Error fetching ratings:', error)
    return out
  }

  const sums: Record<string, { s: number; n: number }> = {}
  for (const r of (data || []) as Array<{ venue_id: string } & RatingRow>) {
    const acc = (sums[r.venue_id] ??= { s: 0, n: 0 })
    acc.s += ratingValue(r)
    acc.n += 1
  }
  for (const [id, { s, n }] of Object.entries(sums)) {
    out[id] = { score: n >= MIN_VOTES ? (s / n) * 2 : null, votes: n }
  }
  return out
}

/**
 * Locales publicados con su nota, ordenados por nota (los que no tienen votos, al final y más recientes primero).
 */
export async function getRankedVenues(limit = 3): Promise<Array<VenueWithCity & VenueScore>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*, cities(slug, name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching ranked venues:', error)
    return []
  }

  const venues = (data || []) as unknown as VenueWithCity[]
  const scores = await getVenueScores(venues.map((v) => v.id))
  return venues
    .map((v) => ({ ...v, score: scores[v.id]?.score ?? null, votes: scores[v.id]?.votes ?? 0 }))
    // Con nota: por nota y, a igualdad, por votos. Sin nota: se respeta el orden por fecha de alta
    // (los votos sueltos por debajo del mínimo no deben fijar a nadie arriba de «Recién llegados»).
    .sort((a, b) => {
      if (a.score !== null && b.score !== null) return b.score - a.score || b.votes - a.votes
      if (a.score !== null) return -1
      if (b.score !== null) return 1
      return 0
    })
    .slice(0, limit)
}

/** Nº de locales publicados por ciudad. */
export async function getVenueCountsByCity(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('venues').select('city_id').eq('status', 'published')
  if (error) {
    console.error('Error counting venues:', error)
    return {}
  }
  const counts: Record<string, number> = {}
  for (const v of (data || []) as Array<{ city_id: string }>) counts[v.city_id] = (counts[v.city_id] || 0) + 1
  return counts
}

export type CriteriaBreakdown = {
  temperature: number | null
  foam: number | null
  glass: number | null
  freshness: number | null
  votes: number
  comments: Array<{ comment: string; score: number; created_at: string }>
}

/** Desglose por criterios (escala 0–10) y últimos comentarios visibles de un local. */
export async function getVenueCriteria(venueId: string): Promise<CriteriaBreakdown> {
  const empty: CriteriaBreakdown = { temperature: null, foam: null, glass: null, freshness: null, votes: 0, comments: [] }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ratings')
    .select('rating, score_temperature, score_foam, score_glass, score_freshness, comment, created_at')
    .eq('venue_id', venueId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error || !data) {
    if (error) console.error('Error fetching criteria:', error)
    return empty
  }
  type Row = {
    rating: number
    score_temperature: number | null
    score_foam: number | null
    score_glass: number | null
    score_freshness: number | null
    comment: string | null
    created_at: string
  }
  const rows = data as Row[]
  const avg = (k: keyof Row) => {
    const vals = rows.map((r) => r[k]).filter((v): v is number => typeof v === 'number')
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) * 2 : null
  }
  return {
    temperature: avg('score_temperature'),
    foam: avg('score_foam'),
    glass: avg('score_glass'),
    freshness: avg('score_freshness'),
    votes: rows.length,
    comments: rows
      .filter((r) => r.comment)
      .slice(0, 5)
      .map((r) => ({ comment: r.comment as string, score: ratingValue(r) * 2, created_at: r.created_at })),
  }
}

export type TankBeer = {
  id: string
  slug: string
  name: string
  brewery: string
  style: string | null
  unpasteurized: boolean
  status: 'confirmada' | 'por_confirmar'
  source: 'equipo' | 'comunidad' | 'bar'
  last_confirmed_at: string | null
}

/** Cervezas en tanque de un local (sin las retiradas). */
export async function getVenueBeers(venueId: string): Promise<TankBeer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venue_beers')
    .select('status, source, last_confirmed_at, beers(id, slug, name, brewery, style, unpasteurized)')
    .eq('venue_id', venueId)
    .neq('status', 'retirada')
  if (error) {
    console.error('Error fetching venue beers:', error)
    return []
  }
  type Row = {
    status: TankBeer['status']
    source: TankBeer['source']
    last_confirmed_at: string | null
    beers: Omit<TankBeer, 'status' | 'source' | 'last_confirmed_at'> | null
  }
  return ((data || []) as unknown as Row[])
    .filter((r) => r.beers)
    .map((r) => ({ ...r.beers!, status: r.status, source: r.source, last_confirmed_at: r.last_confirmed_at }))
}

/** Hace cuánto, en lenguaje natural. */
export function timeAgo(iso: string | null) {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}
