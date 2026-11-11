import { createServiceClient } from '@/lib/supabase/service'
import { getVenueScores } from '@/lib/supabase/queries'
import { getCovers } from '@/lib/google/place-live'
import { CHAPTERS } from '@/lib/content/bodega'
import { IMG } from '@/lib/content/images'
import { SITE_URL } from '@/lib/site'
import { json, preflight } from '@/lib/app/http'

export const dynamic = 'force-dynamic'

const abs = (u: string | null | undefined) => (!u ? null : u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)

/** Todo lo que la app necesita para arrancar: ciudades, bares con nota y capítulos de La Bodega. */
export async function GET() {
  const supabase = createServiceClient()
  const [{ data: cities }, { data: venues }, { data: vb }] = await Promise.all([
    supabase.from('cities').select('id, slug, name, region, latitude, longitude').eq('is_published', true).order('name'),
    supabase
      .from('venues')
      .select('id, slug, name, address, district, latitude, longitude, cover_image_url, google_place_id, published_at, opening_periods, cities(slug, name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('venue_beers').select('venue_id, status, beers(name)').neq('status', 'retirada'),
  ])

  type V = {
    id: string
    slug: string
    name: string
    address: string | null
    district: string | null
    latitude: number | null
    longitude: number | null
    cover_image_url: string | null
    google_place_id: string | null
    published_at: string | null
    opening_periods: unknown
    cities: { slug: string; name: string } | null
  }
  const list = (venues || []) as unknown as V[]
  const [scores, covers] = await Promise.all([getVenueScores(list.map((v) => v.id)), getCovers(list)])

  const beers: Record<string, string[]> = {}
  for (const r of (vb || []) as unknown as Array<{ venue_id: string; beers: { name: string } | null }>) {
    if (r.beers?.name) (beers[r.venue_id] ??= []).push(r.beers.name)
  }

  return json(
    {
      site: SITE_URL,
      cities: cities || [],
      venues: list.map((v) => ({
        id: v.id,
        slug: v.slug,
        name: v.name,
        address: v.address,
        district: v.district,
        lat: v.latitude === null ? null : Number(v.latitude),
        lng: v.longitude === null ? null : Number(v.longitude),
        city: v.cities,
        url: v.cities ? `${SITE_URL}/${v.cities.slug}/${v.slug}` : null,
        cover: abs(covers[v.id]?.url),
        coverCredit: covers[v.id]?.google?.author ?? null,
        score: scores[v.id]?.score ?? null,
        votes: scores[v.id]?.votes ?? 0,
        beers: beers[v.id] ?? ['Estrella Galicia de Bodega'],
        publishedAt: v.published_at,
        hours: v.opening_periods ?? null,
      })),
      bodega: CHAPTERS.map((c) => ({
        slug: c.slug,
        n: c.n,
        title: c.title,
        short: c.short,
        minutes: c.minutes,
        image: abs(IMG[c.image].src),
        url: `${SITE_URL}/la-bodega/${c.slug}`,
      })),
      egPage: `${SITE_URL}/estrella-galicia-de-bodega`,
    },
    { cache: 'public, s-maxage=300, stale-while-revalidate=3600' }
  )
}

export const OPTIONS = preflight
