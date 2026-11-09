import { getVenueBySlugs, getVenueScores, getVenueBeers } from '@/lib/supabase/queries'
import { loadImage, type VenueCardData } from './cards'

export async function getVenueCardData(citySlug: string, venueSlug: string): Promise<VenueCardData | null> {
  const found = await getVenueBySlugs(citySlug, venueSlug)
  if (!found) return null
  const { venue, city } = found
  const [scores, beers, img] = await Promise.all([
    getVenueScores([venue.id]),
    getVenueBeers(venue.id),
    loadImage(venue.cover_image_url),
  ])
  const street = venue.address?.split(',')[0]?.trim()
  return {
    name: venue.name,
    place: [city.name, venue.district || street].filter(Boolean).join(' · '),
    score: scores[venue.id]?.score ?? null,
    votes: scores[venue.id]?.votes ?? 0,
    img,
    url: `beerfy.es/${city.slug}/${venue.slug}`,
    beer: beers[0]?.name ?? null,
  }
}
