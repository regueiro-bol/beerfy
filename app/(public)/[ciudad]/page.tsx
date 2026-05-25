import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCityBySlug, getPublishedVenuesForCity } from '@/lib/supabase/queries'
import { getCityPlaceSchema } from '@/lib/seo/schema'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Beer, MapPin } from 'lucide-react'
import CityMap from '@/components/feature/city-map/CityMap'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'

interface PageProps {
  params: Promise<{ ciudad: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad } = await params
  const city = await getCityBySlug(ciudad)

  if (!city) {
    return {}
  }

  const plainDescription = city.intro_html
    ? city.intro_html.replace(/<[^>]*>/g, '').substring(0, 155)
    : `Descubre los mejores bares con Estrella Galicia de Bodega en ${city.name}.`

  return {
    title: `Estrella Galicia de Bodega en ${city.name}`,
    description: plainDescription,
    alternates: {
      canonical: `${APP_URL}/${city.slug}`,
    },
  }
}

export default async function CityDetailPage({ params }: PageProps) {
  const { ciudad } = await params
  const city = await getCityBySlug(ciudad)

  if (!city) {
    notFound()
  }

  const venues = await getPublishedVenuesForCity(city.id)
  const schema = getCityPlaceSchema(city)

  // Map center coordinates
  const mapCenter = {
    lat: city.latitude ? Number(city.latitude) : 42.3358,
    lng: city.longitude ? Number(city.longitude) : -7.8639,
  }

  return (
    <div className="space-y-8">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="space-y-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/ciudades" className="hover:underline transition-colors duration-150">
            Ciudades
          </Link>
          <span>&gt;</span>
          <span className="font-medium text-foreground">{city.name}</span>
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Estrella Galicia de Bodega en {city.name}
        </h1>
      </div>

      {/* 
        dangerouslySetInnerHTML is safe to use here because:
        1. The content originates entirely from our own curated, hardcoded seeds (cities_initial.sql).
        2. There is no user-submitted input in the intro_html field.
      */}
      <div
        className="prose dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: city.intro_html || '' }}
      />

      {venues.length > 0 ? (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Bares en {city.name}</h2>
          
          {/* Interactive Google Map */}
          <CityMap venues={venues} center={mapCenter} citySlug={city.slug} />

          {/* List of Venues */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {venues.map((venue) => (
              <Link key={venue.id} href={`/${city.slug}/${venue.slug}`} className="block group">
                <Card className="h-full transition-shadow duration-200 group-hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="group-hover:text-primary transition-colors duration-200 text-xl font-bold">
                      {venue.name}
                    </CardTitle>
                    {venue.district && (
                      <CardDescription className="flex items-center text-xs">
                        <MapPin className="mr-1 h-3..5 w-3.5 text-muted-foreground" />
                        {venue.district}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {venue.description || 'Sin descripción disponible.'}
                    </p>
                    {venue.highlights && venue.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {venue.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Bares en {city.name}</h2>
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="rounded-full bg-muted p-3">
                <Beer className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="font-semibold text-lg">Próximamente</h3>
                <p className="text-sm text-muted-foreground">
                  Pronto añadiremos los primeros bares. ¿Conoces uno donde la tiren de muerte? Sugiérelo.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="text-center py-4 border-t">
        <Link
          href="/sugerir"
          className={buttonVariants({ variant: 'default', size: 'lg' })}
        >
          Sugerir un bar en {city.name}
        </Link>
      </section>
    </div>
  )
}
