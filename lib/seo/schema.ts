import type { City, Venue } from '@/lib/types/database'

/**
 * Generates Schema.org Place JSON-LD metadata for a city.
 */
export function getCityPlaceSchema(city: City) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    'name': city.name,
  }

  if (city.latitude !== null && city.longitude !== null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      'latitude': Number(city.latitude),
      'longitude': Number(city.longitude),
    }
  }

  return schema
}

/**
 * Generates Schema.org BarOrPub JSON-LD metadata for a venue.
 */
export function getVenueBarOrPubSchema(venue: Venue, city: City) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    'name': venue.name,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': venue.address || '',
      'addressLocality': city.name,
      'addressRegion': city.region || '',
    },
  }

  if (venue.latitude !== null && venue.longitude !== null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      'latitude': Number(venue.latitude),
      'longitude': Number(venue.longitude),
    }
  }

  if (venue.phone) {
    schema.telephone = venue.phone
  }

  if (venue.website) {
    schema.url = venue.website
  }

  const hours = venue.hours_json as { weekdayDescriptions?: string[] } | null
  if (hours?.weekdayDescriptions) {
    schema.openingHours = hours.weekdayDescriptions
  }

  return schema
}

/** BreadcrumbList para rich results y para que los LLM entiendan la jerarquía. */
export function getBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${base}${it.path}`,
    })),
  }
}
