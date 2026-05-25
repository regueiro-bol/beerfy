import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVenueBySlugs } from '@/lib/supabase/queries'
import { getVenueBarOrPubSchema } from '@/lib/seo/schema'
import { Card, CardContent } from '@/components/ui/card'
import CityMap from '@/components/feature/city-map/CityMap'
import { MapPin, Phone, Globe, Clock, Info } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'

interface PageProps {
  params: Promise<{ ciudad: string; venue: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad, venue } = await params
  const data = await getVenueBySlugs(ciudad, venue)

  if (!data) {
    return {}
  }

  return {
    title: `${data.venue.name} · ${data.city.name} | Estrella Galicia de Bodega`,
    description: data.venue.description || `Ficha de ${data.venue.name} en ${data.city.name}`,
    alternates: {
      canonical: `${APP_URL}/${data.city.slug}/${data.venue.slug}`,
    },
  }
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { ciudad, venue: venueSlug } = await params
  const data = await getVenueBySlugs(ciudad, venueSlug)

  if (!data) {
    notFound()
  }

  const { venue, city } = data
  const schema = getVenueBarOrPubSchema(venue, city)

  // Map center coordinates
  const mapCenter = {
    lat: venue.latitude ? Number(venue.latitude) : Number(city.latitude),
    lng: venue.longitude ? Number(venue.longitude) : Number(city.longitude),
  }

  // Formatting hours
  const hours = venue.hours_json as { weekdayDescriptions?: string[] } | null
  const weekdayDescriptions = hours?.weekdayDescriptions

  return (
    <div className="space-y-8">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Breadcrumbs */}
      <div className="space-y-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/ciudades" className="hover:underline transition-colors duration-150">
            Ciudades
          </Link>
          <span>&gt;</span>
          <Link href={`/${city.slug}`} className="hover:underline transition-colors duration-150">
            {city.name}
          </Link>
          <span>&gt;</span>
          <span className="font-medium text-foreground">{venue.name}</span>
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {venue.name}
        </h1>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Main Details (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo if available */}
          {venue.cover_image_url && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.cover_image_url}
                alt={`Foto de ${venue.name}`}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Sobre este local</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {venue.description || 'Sin descripción disponible.'}
            </p>
          </div>

          {/* Highlights */}
          {venue.highlights && venue.highlights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Destacados</h3>
              <div className="flex flex-wrap gap-2">
                {venue.highlights.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map Location */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-bold">Ubicación</h3>
            <CityMap venues={[venue]} center={mapCenter} citySlug={city.slug} />
          </div>
        </div>

        {/* Sidebar Info (Col-span 1) */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-lg">Información de Contacto</h3>
              
              <div className="space-y-4 text-sm">
                {venue.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-muted-foreground">{venue.address}</p>
                      {venue.district && (
                        <p className="text-xs text-muted-foreground mt-0.5">Barrio: {venue.district}</p>
                      )}
                    </div>
                  </div>
                )}

                {venue.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <a href={`tel:${venue.phone}`} className="text-primary hover:underline">
                        {venue.phone}
                      </a>
                    </div>
                  </div>
                )}

                {venue.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">Sitio Web</p>
                      <a
                        href={venue.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {venue.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          {weekdayDescriptions && weekdayDescriptions.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-muted-foreground" /> Horarios
                </h3>
                <ul className="space-y-2 text-sm">
                  {weekdayDescriptions.map((dayDesc, index) => {
                    const separatorIndex = dayDesc.indexOf(':')
                    const day = dayDesc.substring(0, separatorIndex + 1)
                    const hours = dayDesc.substring(separatorIndex + 1)

                    return (
                      <li key={index} className="flex justify-between border-b pb-1 last:border-0 last:pb-0">
                        <span className="font-medium">{day}</span>
                        <span className="text-muted-foreground text-right">{hours}</span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Disclaimer */}
      <footer className="border-t pt-8 text-xs text-muted-foreground flex items-start space-x-2">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p>
          Datos extraídos de fuentes públicas. La descripción ha sido generada con asistencia de IA y revisada por nuestro equipo editorial.
        </p>
      </footer>
    </div>
  )
}
