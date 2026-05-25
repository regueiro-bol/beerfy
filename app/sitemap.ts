import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'

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

  const cityUrls = cities.map((city) => ({
    url: `${base}/${city.slug}`,
    lastModified: new Date(),
    priority: 0.7,
  }))

  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/que-es-estrella-galicia-bodega`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/ciudades`, lastModified: new Date(), priority: 0.8 },
    ...cityUrls,
    { url: `${base}/sugerir`, lastModified: new Date(), priority: 0.5 },
    { url: `${base}/sobre-beerfy`, lastModified: new Date(), priority: 0.5 },
  ]
}
