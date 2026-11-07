import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCityBySlug, getPublishedVenuesForCity, getVenueScores } from '@/lib/supabase/queries'
import { getCityPlaceSchema, getBreadcrumbSchema } from '@/lib/seo/schema'
import { SiteHeader } from '@/components/site/chrome'
import { VenueCard } from '@/components/site/venue-card'
import { BAR_AMBIENCE } from '@/lib/content/images'
import CityMap from '@/components/feature/city-map/CityMap'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ ciudad: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad } = await params
  const city = await getCityBySlug(ciudad)
  if (!city) return {}

  const plainDescription = city.intro_html
    ? city.intro_html.replace(/<[^>]*>/g, '').substring(0, 155)
    : `Bares con cerveza de bodega en ${city.name}: dónde te tiran bien la Estrella Galicia de Bodega y otras cervezas de tanque.`

  return {
    title: `Cerveza de bodega en ${city.name}`,
    description: plainDescription,
    alternates: { canonical: `${APP_URL}/${city.slug}` },
  }
}

export default async function CityDetailPage({ params }: PageProps) {
  const { ciudad } = await params
  const city = await getCityBySlug(ciudad)
  if (!city) notFound()

  const venues = await getPublishedVenuesForCity(city.id)
  const scores = await getVenueScores(venues.map((v) => v.id))
  const sorted = [...venues].sort((a, b) => (scores[b.id]?.score ?? -1) - (scores[a.id]?.score ?? -1))
  const schema = getCityPlaceSchema(city)
  const mapCenter = {
    lat: city.latitude ? Number(city.latitude) : 42.3358,
    lng: city.longitude ? Number(city.longitude) : -7.8639,
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getBreadcrumbSchema([{ name: 'Ciudades', path: '/ciudades' }, { name: city.name, path: `/${city.slug}` }])),
        }}
      />

      <section className="relative overflow-hidden bg-ink text-cream">
        <Image src={BAR_AMBIENCE[2]} alt="" fill preload sizes="100vw" className="object-cover opacity-45" placeholder="blur" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" aria-hidden="true" />
        <SiteHeader variant="overlay" />
        <div className="relative mx-auto max-w-[1320px] px-5 pb-16 pt-14 md:px-8 md:pt-24">
          <nav aria-label="Migas de pan" className="mb-6 flex gap-2 text-sm text-sand">
            <Link href="/ciudades" className="underline-offset-4 hover:underline">Ciudades</Link>
            <span aria-hidden="true">/</span>
            <span className="text-cream">{city.name}</span>
          </nav>
          <h1 className="font-display text-[52px] font-extrabold leading-[0.88] tracking-[-0.05em] md:text-[100px]">
            Cerveza de bodega
            <br />
            en <span className="text-amber">{city.name}</span>
          </h1>
          {city.intro_html && (
            <div
              className="mt-6 max-w-[680px] text-lg leading-relaxed text-sand [&_a]:underline [&_p]:mb-3"
              // intro_html procede solo de semillas curadas por el equipo (sin input de usuarios).
              dangerouslySetInnerHTML={{ __html: city.intro_html }}
            />
          )}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-16 md:px-8 md:py-20">
        {sorted.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-[28px]">
              <CityMap venues={sorted} center={mapCenter} citySlug={city.slug} />
            </div>
            <h2 className="font-display text-[40px] font-extrabold tracking-[-0.03em] md:text-[56px]">
              {sorted.length === 1 ? '1 bar' : `${sorted.length} bares`} en {city.name}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
              {sorted.map((v) => (
                <VenueCard
                  key={v.id}
                  tall={false}
                  href={`/${city.slug}/${v.slug}`}
                  name={v.name}
                  place={v.district || v.address || city.name}
                  coverUrl={v.cover_image_url}
                  score={scores[v.id]?.score ?? null}
                  votes={scores[v.id]?.votes ?? 0}
                  servesBodega={v.serves_eg_bodega}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-5 rounded-[32px] bg-[#F3EEE2] p-8 md:p-14">
            <p className="font-display text-[34px] font-extrabold leading-tight md:text-[48px]">Estamos catando {city.name}.</p>
            <p className="max-w-[560px] text-lg text-stone">
              Aún no hemos publicado bares aquí. Revisamos cada local antes de añadirlo. ¿Conoces uno donde la tiren de diez?
            </p>
            <Link href={`/sugerir?ciudad=${city.slug}`} className="rounded-full bg-ink px-6 py-4 font-bold text-cream">
              Sugerir un bar en {city.name}
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
