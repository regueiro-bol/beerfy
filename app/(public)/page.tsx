import Link from 'next/link'
import { InstallApp } from '@/components/mobile/pwa'
import Image from 'next/image'
import { getPublishedCities, getRankedVenues, getVenueCountsByCity, getPublishedVenues, getVenueScores } from '@/lib/supabase/queries'
import { NearbyHome, type NearbyItem } from '@/components/mobile/nearby-home'
import { getCovers } from '@/lib/google/place-live'
import { SiteHeader, Marquee } from '@/components/site/chrome'
import { VenueCard } from '@/components/site/venue-card'
import { IMG } from '@/lib/content/images'
import { CHAPTERS } from '@/lib/content/bodega'

export const dynamic = 'force-dynamic'

const CRITERIA = [
  { n: '01', name: 'Temperatura', text: 'Fría, pero sin anestesiar el sabor.' },
  { n: '02', name: 'Espuma', text: 'Dos dedos, cremosa, que aguante.' },
  { n: '03', name: 'Vaso', text: 'Limpio, frío y enjuagado.' },
  { n: '04', name: 'Tanque', text: 'Fresca de verdad: rotación y sabor.' },
]

const JOURNEY = [
  { chapter: CHAPTERS[1]!, img: IMG.tanks, pos: 'center', label: 'Fabricación' },
  { chapter: CHAPTERS[2]!, img: IMG.truck, pos: '40% center', label: 'Transporte' },
  { chapter: CHAPTERS[3]!, img: IMG.pour, pos: '70% center', label: 'En el bar' },
  { chapter: CHAPTERS[4]!, img: IMG.hero, pos: 'center 40%', label: 'Degustación' },
]

export default async function HomePage() {
  const [cities, ranked, counts] = await Promise.all([getPublishedCities(), getRankedVenues(3), getVenueCountsByCity()])
  const covers = await getCovers(ranked)
  const allVenues = (await getPublishedVenues()).filter((v) => v.latitude !== null && v.longitude !== null && v.cities?.slug)
  const allScores = await getVenueScores(allVenues.map((v) => v.id))
  const nearbyItems: NearbyItem[] = allVenues.map((v) => ({
    id: v.id,
    name: v.name,
    href: `/${v.cities!.slug}/${v.slug}`,
    lat: Number(v.latitude),
    lng: Number(v.longitude),
    score: allScores[v.id]?.score ?? null,
    votes: allScores[v.id]?.votes ?? 0,
    cover: v.cover_image_url,
  }))
  const totalVenues = Object.values(counts).reduce((a, b) => a + b, 0)
  const hasScores = ranked.some((v) => v.score !== null)

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-cream md:min-h-[860px]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[58%]">
          <Image
            src={IMG.hero}
            alt="Caña recién tirada con la espuma desbordando el vaso"
            fill
            preload
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover object-[center_30%]"
            placeholder="blur"
          />
        </div>
        <div
          className="absolute inset-0 bg-[linear-gradient(0deg,#0D0B08_20%,rgba(13,11,8,0.55)_60%,rgba(13,11,8,0.8)_100%)] md:bg-[linear-gradient(90deg,#0D0B08_38%,rgba(13,11,8,0.75)_52%,rgba(13,11,8,0)_75%)]"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />

        <SiteHeader variant="overlay" />
        <NearbyHome items={nearbyItems} />

        <div className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-24 md:px-8 md:pb-32 md:pt-16">
          <div className="flex max-w-[640px] flex-col gap-7">
            <p className="inline-flex items-center gap-2.5 self-start rounded-full border border-cream/25 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#5BD18B]" />
              Guía colaborativa de cerveza de tanque
            </p>
            <h1 className="font-display text-[64px] font-extrabold leading-[0.86] tracking-[-0.05em] md:text-[124px]">
              La de <span className="text-amber">bodega</span>,<br />
              <span className="font-serif font-normal italic tracking-[-0.03em]">bien</span> tirada.
            </h1>
            <p className="max-w-[520px] text-lg leading-relaxed text-[#D8CFBC] md:text-[21px]">
              Encuentra los bares que sirven cerveza sin pasteurizar directa del tanque y mira cómo la tiran, puntuada por
              quien se la bebe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ciudades"
                className="rounded-2xl bg-amber px-7 py-4 text-[17px] font-bold text-ink shadow-[0_30px_80px_-20px_rgba(242,179,61,0.55)] transition hover:brightness-95"
              >
                Buscar por ciudad
              </Link>
              <Link
                href="/cerca"
                className="hidden items-center gap-2 rounded-2xl border border-amber/70 px-7 py-4 text-[17px] font-bold text-amber transition hover:bg-amber/10 md:flex"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                Bares cerca de mí
              </Link>
              <Link href="/la-bodega" className="rounded-2xl border border-cream/40 px-7 py-4 text-[17px] font-bold transition hover:bg-cream/10">
                ¿Qué es la de bodega?
              </Link>
            </div>
            <dl className="mt-2 flex flex-wrap items-center gap-7">
              {totalVenues > 0 && (
                <>
                  <div>
                    <dt className="sr-only">Bares publicados</dt>
                    <dd className="font-display text-[40px] font-extrabold leading-none">{totalVenues}</dd>
                    <dd className="text-[13px] text-[#A99F8B]">bares con tanque</dd>
                  </div>
                  <div className="h-11 w-px bg-[#3A3428]" aria-hidden="true" />
                </>
              )}
              <div>
                <dt className="sr-only">Ciudades</dt>
                <dd className="font-display text-[40px] font-extrabold leading-none">{cities.length}</dd>
                <dd className="text-[13px] text-[#A99F8B]">ciudades</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bfy-float absolute right-[9%] top-[210px] hidden -rotate-[5deg] rounded-3xl bg-amber px-5 py-4 text-ink shadow-[0_30px_60px_-16px_rgba(0,0,0,0.7)] lg:block">
          <div className="font-display text-[60px] font-extrabold leading-[0.9]">0–10</div>
          <div className="text-xs font-bold uppercase tracking-[0.08em]">Nota de tirada</div>
        </div>
      </section>
      <InstallApp />

      {/* ESPUMA + CINTA */}
      <div className="relative h-[180px] bg-ink md:h-[260px]" aria-hidden="true">
        <Image src={IMG.foam} alt="" fill sizes="100vw" className="object-cover object-[center_40%]" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink to-transparent" />
      </div>
      <Marquee />

      {/* CÓMO PUNTUAMOS */}
      <section id="como" className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-14 px-5 py-20 md:px-8 md:py-24">
        <div className="relative min-w-0 flex-[1_1_520px]">
          <div className="relative h-[420px] overflow-hidden rounded-[36px] md:h-[620px]">
            <Image
              src={IMG.pour}
              alt="Manos de un camarero tirando una caña desde el grifo con el vaso inclinado"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              placeholder="blur"
            />
          </div>
          <div className="absolute -left-2 bottom-10 -rotate-3 rounded-[22px] bg-ink px-5 py-4 text-cream shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)] md:-left-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber">El gesto</p>
            <p className="mt-1 font-display text-2xl font-extrabold">Inclinar y enderezar al final</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-7">
          <h2 className="font-display text-[48px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[76px]">
            No puntuamos el bar.{' '}
            <span className="font-serif font-normal italic text-bottle">Puntuamos la tirada.</span>
          </h2>
          <p className="text-lg leading-relaxed text-stone">
            Cuatro criterios y sin registro. La media de la comunidad es la Nota de tirada, de 0 a 10.
          </p>
          <ol className="flex flex-col">
            {CRITERIA.map((c, i) => (
              <li
                key={c.n}
                className={`flex items-baseline gap-5 border-t-[1.5px] border-[#16140F] py-4 ${i === CRITERIA.length - 1 ? 'border-b-[1.5px]' : ''}`}
              >
                <span className="font-display text-[22px] font-extrabold text-copper">{c.n}</span>
                <span className="flex-1">
                  <strong className="font-display text-[28px] md:text-[30px]">{c.name}</strong>
                  <br />
                  <span className="text-stone">{c.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* RANKING */}
      <section className="bg-ink text-cream">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-20 md:px-8 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[48px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[76px]">
              {hasScores ? (
                <>
                  Mejor tirada
                  <br />
                  <span className="text-amber">ahora mismo</span>
                </>
              ) : (
                <>
                  Recién llegados
                  <br />
                  <span className="text-amber">a la guía</span>
                </>
              )}
            </h2>
            <Link href="/ciudades" className="rounded-full border-[1.5px] border-cream/40 px-6 py-3.5 font-bold transition hover:bg-cream/10">
              Ver todas las ciudades →
            </Link>
          </div>
          {ranked.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
              {ranked.map((v, i) => (
                <VenueCard
                  key={v.id}
                  href={`/${v.cities?.slug}/${v.slug}`}
                  name={v.name}
                  place={[v.cities?.name, v.district].filter(Boolean).join(' · ')}
                  coverUrl={covers[v.id]?.url ?? null}
                  coverCredit={covers[v.id]?.google ?? null}
                  score={v.score}
                  votes={v.votes}
                  rank={hasScores ? i + 1 : undefined}
                  servesBodega={v.serves_eg_bodega}
                />
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[32px]">
              <Image src={IMG.bar2} alt="" fill sizes="100vw" className="object-cover opacity-50" />
              <div className="relative flex flex-col items-start gap-5 p-8 md:p-14">
                <p className="max-w-[620px] font-display text-[32px] font-extrabold leading-tight md:text-[44px]">
                  Estamos catando los primeros bares. Muy pronto, aquí.
                </p>
                <p className="max-w-[520px] text-lg text-sand">
                  Publicamos cada local tras revisarlo. Si conoces uno donde la tiren de diez, cuéntanoslo.
                </p>
                <Link href="/sugerir" className="rounded-full bg-amber px-6 py-3.5 font-bold text-ink">
                  Sugerir un bar
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LA BODEGA */}
      <section className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-20 md:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[680px]">
            <p className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-copper">La Bodega · guía</p>
            <h2 className="font-display text-[48px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[76px]">
              Del tanque de la fábrica a tu caña.
            </h2>
          </div>
          <Link href="/la-bodega" className="rounded-full bg-ink px-6 py-4 font-bold text-cream">
            Entrar en la guía →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
          {JOURNEY.map(({ chapter, img, pos, label }) => (
            <Link
              key={chapter.slug}
              href={`/la-bodega/${chapter.slug}`}
              className="group relative block h-[380px] overflow-hidden rounded-[30px] md:h-[440px]"
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                style={{ objectPosition: pos }}
                placeholder="blur"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-transparent" aria-hidden="true" />
              <span className="absolute left-5 top-4 font-display text-[56px] font-extrabold leading-none text-amber">{chapter.n}</span>
              <div className="absolute inset-x-5 bottom-5 text-cream">
                <p className="font-display text-[30px] font-extrabold">{label}</p>
                <p className="mt-1.5 text-[15px] leading-snug text-sand">{chapter.short}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CIUDADES */}
      <section className="mx-auto flex max-w-[1320px] flex-col gap-7 px-5 pb-12 md:px-8">
        <h2 className="font-display text-[44px] font-extrabold tracking-[-0.04em] md:text-[64px]">Explora por ciudad</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {cities.map((city, i) => {
            const n = counts[city.id] || 0
            const tone = ['bg-ink text-cream', 'bg-bottle text-cream', 'bg-copper text-ink'][i % 3]
            return (
              <Link
                key={city.id}
                href={`/${city.slug}`}
                className={`relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[30px] p-6 transition hover:-translate-y-0.5 ${tone}`}
              >
                <span className="text-sm font-semibold opacity-80">{n === 0 ? 'Próximamente' : n === 1 ? '1 bar' : `${n} bares`}</span>
                <span className="font-display text-[44px] font-extrabold leading-none tracking-[-0.03em]">{city.name}</span>
              </Link>
            )
          })}
          <Link href="/sugerir" className="flex min-h-[210px] flex-col justify-between rounded-[30px] bg-[#F3EEE2] p-6 transition hover:-translate-y-0.5">
            <span className="text-sm font-semibold text-stone">Sugiere el primer bar</span>
            <span className="font-display text-[44px] font-extrabold leading-none tracking-[-0.03em]">+ Tu ciudad</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1320px] px-5 pb-24 pt-10 md:px-8">
        <div className="relative flex min-h-[420px] items-center overflow-hidden rounded-[44px]">
          <Image src={IMG.foam} alt="" fill sizes="100vw" className="object-cover object-[center_70%]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,11,8,0.88)_30%,rgba(13,11,8,0.1)_85%)]" aria-hidden="true" />
          <div className="relative flex max-w-[680px] flex-col gap-5 p-8 text-cream md:p-14">
            <h2 className="font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[72px]">
              ¿Conoces un bar que la tire <span className="text-amber">bien</span>?
            </h2>
            <p className="text-lg text-sand">Sugiérelo y el equipo editorial lo revisa antes de publicarlo. Sin registro.</p>
            <Link href="/sugerir" className="self-start rounded-full bg-amber px-7 py-4 font-extrabold text-ink">
              Sugerir un bar
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
