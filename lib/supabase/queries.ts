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

export type VenueWithCity = Venue & { cities: { slug: string; name: string } | null }
export type VenueScore = { score: number | null; votes: number }

/**
 * Nota de tirada (0–10) por local, a partir de las valoraciones visibles (1–5 → ×2).
 */
export async function getVenueScores(venueIds: string[]): Promise<Record<string, VenueScore>> {
  const out: Record<string, VenueScore> = {}
  venueIds.forEach((id) => (out[id] = { score: null, votes: 0 }))
  if (venueIds.length === 0) return out

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ratings')
    .select('venue_id, rating')
    .in('venue_id', venueIds)
    .eq('status', 'visible')

  if (error) {
    console.error('Error fetching ratings:', error)
    return out
  }

  const sums: Record<string, { s: number; n: number }> = {}
  for (const r of (data || []) as Array<{ venue_id: string; rating: number }>) {
    const acc = (sums[r.venue_id] ??= { s: 0, n: 0 })
    acc.s += r.rating
    acc.n += 1
  }
  for (const [id, { s, n }] of Object.entries(sums)) {
    out[id] = { score: (s / n) * 2, votes: n }
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
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.votes - a.votes)
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
      .map((r) => ({ comment: r.comment as string, score: r.rating * 2, created_at: r.created_at })),
  }
}
