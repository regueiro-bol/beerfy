import { createServiceClient } from '@/lib/supabase/service'
import { getVenueCriteria, getVenueBeers } from '@/lib/supabase/queries'
import { json, preflight } from '@/lib/app/http'

export const dynamic = 'force-dynamic'

/** Detalle de un bar: descripción, cervezas y desglose de la nota. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'not_found' }, { status: 404 })
  const supabase = createServiceClient()
  const { data: venue } = await supabase
    .from('venues')
    .select('id, description, phone, website, hours_json, highlights, status')
    .eq('id', id)
    .maybeSingle()
  if (!venue || venue.status !== 'published') return json({ error: 'not_found' }, { status: 404 })
  const [criteria, beers] = await Promise.all([getVenueCriteria(id), getVenueBeers(id)])
  return json(
    {
      description: venue.description,
      phone: venue.phone,
      website: venue.website,
      highlights: venue.highlights,
      beers: beers.map((b) => ({ name: b.name, brewery: b.brewery, status: b.status })),
      criteria,
    },
    { cache: 'public, s-maxage=60, stale-while-revalidate=600' }
  )
}

export const OPTIONS = preflight
