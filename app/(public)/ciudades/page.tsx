import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPublishedCities, getVenueCountsByCity } from '@/lib/supabase/queries'
import { SiteHeader } from '@/components/site/chrome'
import { BAR_AMBIENCE, IMG } from '@/lib/content/images'
import { SITE_URL } from '@/lib/site'
const IMG_FALLBACK = IMG.bar1

const APP_URL = SITE_URL

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cerveza de bodega por ciudad',
  description: 'Bares con cerveza de bodega (Estrella Galicia de Bodega y otras de tanque) en Ourense, Vigo, Madrid y más ciudades.',
  alternates: { canonical: `${APP_URL}/ciudades` },
}

export default async function CitiesPage() {
  const [cities, counts] = await Promise.all([getPublishedCities(), getVenueCountsByCity()])

  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-cream">
        <Image src={BAR_AMBIENCE[0]} alt="" fill preload sizes="100vw" className="object-cover opacity-45" placeholder="blur" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" aria-hidden="true" />
        <SiteHeader variant="overlay" current="/ciudades" />
        <div className="relative mx-auto max-w-[1320px] px-5 pb-20 pt-20 md:px-8 md:pt-28">
          <h1 className="font-display text-[56px] font-extrabold leading-[0.88] tracking-[-0.05em] md:text-[104px]">
            ¿Dónde la tiran
            <br />
            <span className="font-serif font-normal italic text-amber">bien</span> en tu ciudad?
          </h1>
          <p className="mt-6 max-w-[560px] text-lg text-sand">Elige ciudad y encuentra los bares con cerveza de bodega, con su Nota de tirada.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1320px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 px-5 py-16 md:px-8 md:py-20">
        {cities.map((city, i) => {
          const n = counts[city.id] || 0
          return (
            <Link key={city.id} href={`/${city.slug}`} className="group relative block h-[340px] overflow-hidden rounded-[32px]">
              <Image
                src={BAR_AMBIENCE[i % 3] ?? IMG_FALLBACK}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                placeholder="blur"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/30 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-6 bottom-6 text-cream">
                <p className="text-sm font-semibold text-amber">
                  {n === 0 ? 'Próximamente' : n === 1 ? '1 bar' : `${n} bares`}
                  {city.region ? ` · ${city.region}` : ''}
                </p>
                <p className="font-display text-[52px] font-extrabold leading-none tracking-[-0.03em]">{city.name}</p>
              </div>
            </Link>
          )
        })}
        <Link href="/sugerir" className="flex h-[340px] flex-col justify-between rounded-[32px] border-[1.5px] border-dashed border-stone/50 p-7 hover:border-[#16140F]">
          <span className="text-sm font-semibold text-stone">¿No está tu ciudad?</span>
          <span className="font-display text-[44px] font-extrabold leading-none tracking-[-0.03em]">Sugiere el primer bar →</span>
        </Link>
      </section>
    </main>
  )
}
