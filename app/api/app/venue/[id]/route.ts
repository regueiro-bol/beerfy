import { createServiceClient } from '@/lib/supabase/service'
import { getVenueCriteria, getVenueBeers } from '@/lib/supabase/queries'
import { getLivePlace } from '@/lib/google/place-live'
import { json, preflight } from '@/lib/app/http'

export const dynamic = 'force-dynamic'

/** Detalle de un bar para la app: lo mismo que muestra la ficha de la web. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'not_found' }, { status: 404 })
  const supabase = createServiceClient()
  const { data: venue } = await supabase
    .from('venues')
    .select('id, description, description_edited_by_human, address, phone, website, google_place_id, latitude, longitude, status')
    .eq('id', id)
    .maybeSingle()
  if (!venue || venue.status !== 'published') return json({ error: 'not_found' }, { status: 404 })

  // Sin fotos: la app ya tiene la portada; así no gastamos llamadas de fotos de Google.
  const [criteria, beers, live] = await Promise.all([getVenueCriteria(id), getVenueBeers(id), getLivePlace(venue.google_place_id, false)])

  const mapsUri =
    live?.googleMapsUri ??
    (venue.latitude !== null && venue.longitude !== null ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}` : null)

  return json(
    {
      description: venue.description,
      descriptionReviewed: venue.description_edited_by_human === true,
      address: venue.address ? String(venue.address).replace(/,\s*(Spain|España)$/i, '') : null,
      phone: live?.phone ?? venue.phone,
      website: live?.website ?? venue.website,
      mapsUri,
      beers: beers.map((b) => ({
        name: b.name,
        brewery: b.brewery,
        style: b.style ?? null,
        unpasteurized: b.unpasteurized === true,
        status: b.status,
        source: b.source ?? null,
        lastConfirmedAt: b.last_confirmed_at ?? null,
      })),
      criteria,
      google: live
        ? {
            openNow: live.openNow,
            weekdays: live.weekdayDescriptions,
            rating: live.rating,
            ratingCount: live.userRatingCount,
            businessStatus: live.businessStatus,
            features: live.features,
          }
        : null,
    },
    { cache: 'public, s-maxage=300, stale-while-revalidate=1800' }
  )
}

export const OPTIONS = preflight
