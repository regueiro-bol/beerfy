import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CHAPTERS } from '@/lib/content/bodega'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL

  let cities: Array<{ slug: string }> = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cities')
      .select('slug')
      .eq('is_published', true)

    if (!error && data) {
      cities = data
    }
  } catch (e) {
    console.error('Error generating dynamic sitemap from database:', e)
  }

  let venues: Array<{ slug: string; cities: { slug: string } | null }> = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('venues')
      .select('slug, cities(slug)')
      .eq('status', 'published')

    if (!error && data) {
      venues = data as unknown as Array<{ slug: string; cities: { slug: string } | null }>
    }
  } catch (e) {
    console.error('Error fetching venues for sitemap:', e)
  }

  const cityUrls = cities.map((city) => ({
    url: `${base}/${city.slug}`,
    lastModified: new Date(),
    priority: 0.7,
  }))

  const venueUrls = venues
    .filter((v) => v.cities?.slug)
    .map((v) => ({
      url: `${base}/${v.cities!.slug}/${v.slug}`,
      lastModified: new Date(),
      priority: 0.6,
    }))

  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/la-bodega`, lastModified: new Date(), priority: 0.9 },
    ...CHAPTERS.map((c) => ({ url: `${base}/la-bodega/${c.slug}`, lastModified: new Date(), priority: 0.8 })),
    { url: `${base}/ciudades`, lastModified: new Date(), priority: 0.8 },
    ...cityUrls,
    ...venueUrls,
    { url: `${base}/sugerir`, lastModified: new Date(), priority: 0.5 },
    { url: `${base}/sobre-beerfy`, lastModified: new Date(), priority: 0.5 },
  ]
}
