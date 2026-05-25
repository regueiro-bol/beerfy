import type { City } from '@/lib/types/database'

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
