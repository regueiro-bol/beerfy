import type { Metadata } from 'next'
import { getPublishedCities } from '@/lib/supabase/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'

export const metadata: Metadata = {
  title: 'Bares con Estrella Galicia de Bodega por ciudad',
  description: 'Descubre dónde te tiran bien la Estrella Galicia de Bodega en Ourense, Vigo y Madrid.',
  alternates: {
    canonical: `${APP_URL}/ciudades`,
  },
}

export default async function CitiesPage() {
  const cities = await getPublishedCities()

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ciudades Beerfy
        </h1>
        <p className="text-muted-foreground text-lg">
          Descubre los locales de Estrella Galicia de Bodega en tu ciudad.
        </p>
      </section>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {cities.map((city) => {
          const trimmedIntro = city.intro_html
            ? city.intro_html.length > 100
              ? `${city.intro_html.substring(0, 100)}...`
              : city.intro_html
            : 'Descubre dónde te tiran bien la Estrella Galicia de Bodega.'

          return (
            <Link key={city.id} href={`/${city.slug}`} className="block group">
              <Card className="h-full transition-shadow duration-200 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors duration-200">
                    {city.name}
                  </CardTitle>
                  <CardDescription>{city.region || ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{trimmedIntro}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
