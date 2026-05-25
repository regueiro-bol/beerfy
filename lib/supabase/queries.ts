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
