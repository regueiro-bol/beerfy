import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVenueBySlugs, getVenueScores, getVenueCriteria, getVenueBeers, timeAgo, MIN_VOTES } from '@/lib/supabase/queries'
import { getLivePlace } from '@/lib/google/place-live'
import { formatScore } from '@/components/site/chrome'
import { getVenueBarOrPubSchema, getBreadcrumbSchema } from '@/lib/seo/schema'
import { SiteHeader, FoamEdge, ScoreBadge } from '@/components/site/chrome'
import CityMap from '@/components/feature/city-map/CityMap'
import { MapPin, Phone, Globe, Clock } from 'lucide-react'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

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
  const [scores, criteria, live, beers] = await Promise.all([
    getVenueScores([venue.id]),
    getVenueCriteria(venue.id),
    getLivePlace(venue.google_place_id, !venue.cover_image_url),
    getVenueBeers(venue.id),
  ])
  const { score, votes } = scores[venue.id] ?? { score: null, votes: 0 }
  const ratePath = `/${city.slug}/${venue.slug}/puntuar`
  const phone = live?.phone ?? venue.phone
  const website = live?.website ?? venue.website
  const CRIT = [
    { name: 'Temperatura', v: criteria.temperature },
    { name: 'Espuma', v: criteria.foam },
    { name: 'Vaso', v: criteria.glass },
    { name: 'Tanque / frescura', v: criteria.freshness },
  ]
  const mapCenter = {
    lat: venue.latitude ? Number(venue.latitude) : Number(city.latitude),
    lng: venue.longitude ? Number(venue.longitude) : Number(city.longitude),
  }
  const weekdays = live?.weekdayDescriptions
  const gPhotos = live?.photos ?? []
  const heroGoogle = !venue.cover_image_url && gPhotos.length > 0 ? gPhotos[0] : null
  const heroSrc = venue.cover_image_url ?? heroGoogle?.url ?? null
  const closed = live?.businessStatus && live.businessStatus !== 'OPERATIONAL' ? live.businessStatus : null

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getBreadcrumbSchema([
              { name: 'Ciudades', path: '/ciudades' },
              { name: city.name, path: `/${city.slug}` },
              { name: venue.name, path: `/${city.slug}/${venue.slug}` },
            ])
          ),
        }}
      />

      <section className="relative min-h-[560px] overflow-hidden bg-ink text-cream">
        {heroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroSrc} alt={`Foto de ${venue.name}`} className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,#4A3414,#0D0B08_60%)]" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/70" aria-hidden="true" />
        <SiteHeader variant="overlay" />
        {heroGoogle && (
          <p className="absolute bottom-3 right-4 z-10 text-[11px] text-sand/90">
            Foto:{' '}
            {heroGoogle.authorUri ? (
              <a href={heroGoogle.authorUri} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{heroGoogle.author ?? 'usuario de Google'}</a>
            ) : (heroGoogle.author ?? 'usuario de Google')}{' '}
            · <span translate="no">Google Maps</span>
          </p>
        )}
        <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-8 px-5 pb-14 pt-24 md:px-8 md:pt-40">
          <div className="max-w-[820px]">
            <nav aria-label="Migas de pan" className="mb-5 flex flex-wrap gap-2 text-sm text-sand">
              <Link href="/ciudades" className="underline-offset-4 hover:underline">Ciudades</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/${city.slug}`} className="underline-offset-4 hover:underline">{city.name}</Link>
            </nav>
            {closed && (
              <p className="mb-4 inline-block rounded-full bg-[#FBE3DC] px-4 py-1.5 text-sm font-bold text-[#8A2A12]">
                {closed === 'CLOSED_PERMANENTLY' ? 'Google indica que ha cerrado definitivamente' : 'Google indica que está cerrado temporalmente'}
              </p>
            )}
            <h1 className="font-display text-[52px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[96px]">{venue.name}</h1>
            <p className="mt-4 text-lg text-sand">
              {[venue.district, city.name].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {beers.map((b) => (
                <span key={b.id} className="rounded-full bg-bottle px-3.5 py-2 text-sm font-semibold">
                  {b.name} en tanque
                </span>
              ))}
              {venue.highlights?.map((h) => (
                <span key={h} className="rounded-full bg-cream/15 px-3.5 py-2 text-sm font-semibold backdrop-blur">{h}</span>
              ))}
            </div>
          </div>
          <div className="rotate-3 rounded-3xl bg-amber p-1 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
            <ScoreBadge score={score} size="lg" />
            <p className="px-3 pb-2 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
              {score !== null ? `Nota de tirada · ${votes} votos` : votes > 0 ? `En calibración · ${votes} de ${MIN_VOTES} votos` : 'Sin puntuaciones aún'}
            </p>
          </div>
        </div>
      </section>
      <FoamEdge />

      <section className="mx-auto flex max-w-[1320px] flex-wrap gap-10 px-5 pb-20 pt-6 md:px-8">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-8">
          {beers.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-[34px] font-extrabold tracking-[-0.02em]">En tanque</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                {beers.map((b) => (
                  <div key={b.id} className="relative flex flex-col gap-3 overflow-hidden rounded-[26px] border-[1.5px] border-[#16140F] bg-[#FFF8E6] p-6">
                    <svg width="90" height="120" viewBox="0 0 30 40" aria-hidden="true" className="absolute -right-3 -top-3 opacity-25">
                      <rect x="6" y="2" width="18" height="30" rx="9" fill="#C8763A" />
                      <path d="M6 12h18M6 24h18" stroke="#8E4E22" strokeWidth="1.5" />
                    </svg>
                    <div className="flex flex-wrap gap-2">
                      {b.unpasteurized && (
                        <span className="rounded-full bg-bottle px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-cream">Sin pasteurizar</span>
                      )}
                      <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink">Tanque</span>
                    </div>
                    <div>
                      <p className="font-display text-[26px] font-extrabold leading-tight">{b.name}</p>
                      <p className="text-sm text-stone">
                        {b.brewery}
                        {b.style ? ` · ${b.style}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-stone">
                      {b.status === 'confirmada' ? 'Confirmada' : 'Por confirmar'}
                      {b.last_confirmed_at ? ` ${timeAgo(b.last_confirmed_at)}` : ''}
                      {b.source === 'equipo' ? ' por el equipo de Beerfy' : b.source === 'bar' ? ' por el propio bar' : ' por la comunidad'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5 rounded-[32px] bg-ink p-7 text-cream md:p-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[32px] font-extrabold leading-none tracking-[-0.02em] md:text-[40px]">Cómo la tiran</h2>
              <span className="text-sm text-sand">{votes > 0 ? `${votes} ${votes === 1 ? 'puntuación' : 'puntuaciones'} de la comunidad` : 'Aún nadie la ha puntuado'}</span>
            </div>
            {score !== null ? (
              <div className="flex flex-col gap-4">
                {CRIT.map((c) => (
                  <div key={c.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[15px] font-semibold">
                      <span>{c.name}</span>
                      <span className="text-amber">{c.v !== null ? formatScore(c.v) : '–'}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#2E281E]">
                      <div className="h-2.5 rounded-full bg-amber" style={{ width: `${((c.v ?? 0) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sand">
                {votes > 0
                  ? `La nota se publica a partir de ${MIN_VOTES} puntuaciones hechas desde el bar. Faltan ${MIN_VOTES - votes}.`
                  : 'Sé el primero: temperatura, espuma, vaso y frescura en 30 segundos, desde el propio bar.'}
              </p>
            )}
            <Link href={ratePath} className="self-start rounded-2xl bg-amber px-6 py-4 text-[17px] font-extrabold text-ink transition hover:brightness-95">
              Puntuar mi tirada
            </Link>
          </div>

          {criteria.comments.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-[28px] font-extrabold">Últimas tiradas</h2>
              <ul className="flex flex-col gap-3">
                {criteria.comments.map((c, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl border-[1.5px] border-line bg-white p-4">
                    <span className="h-fit rounded-lg bg-amber px-2 py-1 text-sm font-extrabold text-ink">{formatScore(c.score)}</span>
                    <div>
                      <p className="text-[15px] leading-relaxed text-[#26231C]">{c.comment}</p>
                      <p className="mt-1 text-xs text-stone">{new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="mb-4 font-display text-[34px] font-extrabold tracking-[-0.02em]">Sobre este bar</h2>
            <p className="font-serif text-[21px] leading-relaxed text-[#26231C]">{venue.description || 'Descripción en preparación.'}</p>
            {venue.description && (
              <p className="mt-3 text-xs text-stone">
                {venue.description_edited_by_human
                  ? 'Descripción redactada con asistencia de IA y revisada por el equipo de Beerfy.'
                  : 'Descripción redactada con asistencia de IA a partir de fuentes públicas; pendiente de revisión.'}
              </p>
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
              <p className="flex gap-3 text-[15px]"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden="true" />{venue.address.replace(/,\s*(Spain|España)$/i, '')}</p>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="flex gap-3 text-[15px] hover:underline"><Phone className="h-5 w-5 shrink-0 text-amber" aria-hidden="true" />{phone}</a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex gap-3 break-all text-[15px] hover:underline">
                <Globe className="h-5 w-5 shrink-0 text-amber" aria-hidden="true" />Web del local
              </a>
            )}
            {(live?.googleMapsUri || (venue.latitude !== null && venue.longitude !== null)) && (
              <a
                href={live?.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 rounded-full bg-amber px-5 py-3.5 text-center font-bold text-ink"
              >
                Abrir en Google Maps
              </a>
            )}
          </div>
          {live && live.features.length > 0 && (
            <div className="rounded-[28px] border-[1.5px] border-line bg-white p-7">
              <h2 className="mb-4 font-display text-2xl font-extrabold">El local</h2>
              <ul className="flex flex-wrap gap-2">
                {live.features.map((f) => (
                  <li key={f} className="rounded-full bg-cream px-3.5 py-1.5 text-sm font-semibold text-[#26231C]">{f}</li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-snug text-stone">
                Datos de <span translate="no" className="font-[Roboto,Arial,sans-serif] text-[13px] font-medium text-[#5E5E5E]">Google Maps</span>. Pueden no estar al día.
              </p>
            </div>
          )}
          {live && (live.rating !== null || (weekdays && weekdays.length > 0)) && (
            <div className="rounded-[28px] border-[1.5px] border-line bg-white p-7">
              {live.businessStatus && live.businessStatus !== 'OPERATIONAL' && (
                <p className="mb-4 rounded-xl bg-[#FBE3DC] px-3 py-2 text-sm font-semibold text-[#8A2A12]">
                  {live.businessStatus === 'CLOSED_PERMANENTLY' ? 'Cerrado permanentemente' : 'Cerrado temporalmente'}
                </p>
              )}
              {live.rating !== null && (
                <div className="mb-5 flex items-center gap-3 border-b border-line pb-5">
                  <span className="font-display text-[34px] font-extrabold leading-none">{live.rating.toFixed(1).replace('.', ',')}</span>
                  <span className="text-sm text-stone">
                    sobre 5 en Google
                    {live.userRatingCount ? <><br />{live.userRatingCount.toLocaleString('es-ES')} reseñas</> : null}
                  </span>
                </div>
              )}
              {weekdays && weekdays.length > 0 && (
                <>
                  <h2 className="mb-4 flex items-center justify-between gap-2 font-display text-2xl font-extrabold">
                    <span className="flex items-center gap-2"><Clock className="h-5 w-5 text-copper" aria-hidden="true" />Horario</span>
                    {live.openNow !== null && (
                      <span className={`rounded-full px-3 py-1 font-sans text-xs font-bold ${live.openNow ? 'bg-[#DDF3E5] text-[#1F6B3E]' : 'bg-[#F3EEE2] text-stone'}`}>
                        {live.openNow ? 'Abierto ahora' : 'Cerrado ahora'}
                      </span>
                    )}
                  </h2>
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
                </>
              )}
              <p className="mt-5 text-[11px] leading-snug text-stone">
                Horario y puntuación de{' '}
                <span translate="no" className="font-[Roboto,Arial,sans-serif] text-[13px] font-medium text-[#5E5E5E]">Google Maps</span>
                . No son valoraciones de Beerfy ni miden la tirada.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
