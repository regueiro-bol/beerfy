import { createClient } from './server'
import type { City } from '@/lib/types/database'

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
    if (error.code !== 'PGRST116') { // PGRST116 is code for "no rows returned"
      console.error(`Error fetching city by slug ${slug}:`, error)
    }
    return null
  }

  return data
}
