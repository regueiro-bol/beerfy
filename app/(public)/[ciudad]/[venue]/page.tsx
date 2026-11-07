import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVenueBySlugs, getVenueScores } from '@/lib/supabase/queries'
import { getVenueBarOrPubSchema } from '@/lib/seo/schema'
import { SiteHeader, FoamEdge, ScoreBadge } from '@/components/site/chrome'
import CityMap from '@/components/feature/city-map/CityMap'
import { MapPin, Phone, Globe, Clock } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ ciudad: string; venue: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad, venue } = await params
  const data = await getVenueBySlugs(ciudad, venue)
  if (!data) return {}
  return {
    title: `${data.venue.name}, ${data.city.name}: cerveza de bodega`,
    description: data.venue.description || `${data.venue.name} en ${data.city.name}: cómo tiran la cerveza de bodega.`,
    alternates: { canonical: `${APP_URL}/${data.city.slug}/${data.venue.slug}` },
  }
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { ciudad, venue: venueSlug } = await params
  const data = await getVenueBySlugs(ciudad, venueSlug)
  if (!data) notFound()

  const { venue, city } = data
  const schema = getVenueBarOrPubSchema(venue, city)
  const { score, votes } = (await getVenueScores([venue.id]))[venue.id] ?? { score: null, votes: 0 }
  const mapCenter = {
    lat: venue.latitude ? Number(venue.latitude) : Number(city.latitude),
    lng: venue.longitude ? Number(venue.longitude) : Number(city.longitude),
  }
  const hours = venue.hours_json as { weekdayDescriptions?: string[] } | null
  const weekdays = hours?.weekdayDescriptions

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative min-h-[560px] overflow-hidden bg-ink text-cream">
        {venue.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.cover_image_url} alt={`Foto de ${venue.name}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,#4A3414,#0D0B08_60%)]" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/70" aria-hidden="true" />
        <SiteHeader variant="overlay" />
        <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-8 px-5 pb-14 pt-24 md:px-8 md:pt-40">
          <div className="max-w-[820px]">
            <nav aria-label="Migas de pan" className="mb-5 flex flex-wrap gap-2 text-sm text-sand">
              <Link href="/ciudades" className="underline-offset-4 hover:underline">Ciudades</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/${city.slug}`} className="underline-offset-4 hover:underline">{city.name}</Link>
            </nav>
            <h1 className="font-display text-[52px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[96px]">{venue.name}</h1>
            <p className="mt-4 text-lg text-sand">
              {[venue.district, city.name].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {venue.serves_eg_bodega && (
                <span className="rounded-full bg-bottle px-3.5 py-2 text-sm font-semibold">Estrella Galicia de Bodega en tanque</span>
              )}
              {venue.highlights?.map((h) => (
                <span key={h} className="rounded-full bg-cream/15 px-3.5 py-2 text-sm font-semibold backdrop-blur">{h}</span>
              ))}
            </div>
          </div>
          <div className="rotate-3 rounded-3xl bg-amber p-1 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
            <ScoreBadge score={score} size="lg" />
            <p className="px-3 pb-2 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
              {votes > 0 ? `Nota de tirada · ${votes} votos` : 'Sin puntuaciones aún'}
            </p>
          </div>
        </div>
      </section>
      <FoamEdge />

      <section className="mx-auto flex max-w-[1320px] flex-wrap gap-10 px-5 pb-20 pt-6 md:px-8">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-8">
          <div>
            <h2 className="mb-4 font-display text-[34px] font-extrabold tracking-[-0.02em]">Sobre este bar</h2>
            <p className="font-serif text-[21px] leading-relaxed text-[#26231C]">{venue.description || 'Descripción en preparación.'}</p>
            {venue.description && (
              <p className="mt-3 text-xs text-stone">Descripción redactada con asistencia de IA y revisada por el equipo de Beerfy.</p>
            )}
          </div>
          {(venue.latitude !== null || city.latitude !== null) && (
            <div className="overflow-hidden rounded-[28px]">
              <CityMap venues={[venue]} center={mapCenter} citySlug={city.slug} zoom={16} />
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-[28px] bg-ink p-7 text-cream">
            <h2 className="font-display text-2xl font-extrabold">Cómo llegar</h2>
            {venue.address && (
              <p className="flex gap-3 text-[15px]"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden="true" />{venue.address}</p>
            )}
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="flex gap-3 text-[15px] hover:underline"><Phone className="h-5 w-5 shrink-0 text-amber" aria-hidden="true" />{venue.phone}</a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex gap-3 break-all text-[15px] hover:underline">
                <Globe className="h-5 w-5 shrink-0 text-amber" aria-hidden="true" />Web del local
              </a>
            )}
            {venue.latitude !== null && venue.longitude !== null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 rounded-full bg-amber px-5 py-3.5 text-center font-bold text-ink"
              >
                Abrir en Google Maps
              </a>
            )}
          </div>
          {weekdays && weekdays.length > 0 && (
            <div className="rounded-[28px] border-[1.5px] border-line bg-white p-7">
              <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-extrabold"><Clock className="h-5 w-5 text-copper" aria-hidden="true" />Horario</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {weekdays.map((d, i) => {
                  const k = d.indexOf(':')
                  return (
                    <li key={i} className="flex justify-between gap-3 border-b border-line pb-1.5 last:border-0">
                      <span className="font-medium capitalize">{d.substring(0, k)}</span>
                      <span className="text-right text-stone">{d.substring(k + 1)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <div className="rounded-[28px] bg-[#F3EEE2] p-7">
            <p className="font-display text-xl font-extrabold">Puntuar la tirada</p>
            <p className="mt-2 text-sm text-stone">Muy pronto podrás puntuar temperatura, espuma, vaso y frescura en 30 segundos, sin registro.</p>
          </div>
        </aside>
      </section>
    </main>
  )
}
