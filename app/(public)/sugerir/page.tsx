import type { Metadata } from 'next'
import Image from 'next/image'
import { SiteHeader } from '@/components/site/chrome'
import { getPublishedCities } from '@/lib/supabase/queries'
import { IMG } from '@/lib/content/images'
import { SuggestForm } from './suggest-form'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sugerir un bar con cerveza de bodega',
  description: '¿Conoces un bar donde tiren bien la cerveza de bodega? Sugiérelo y lo revisaremos para añadirlo a Beerfy.',
  alternates: { canonical: `${APP_URL}/sugerir` },
}

interface PageProps {
  searchParams: Promise<{ ciudad?: string }>
}

export default async function SuggestPage({ searchParams }: PageProps) {
  const { ciudad } = await searchParams
  const cities = await getPublishedCities()

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto flex max-w-[1320px] flex-wrap gap-12 px-5 py-14 md:px-8 md:py-20">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
          <h1 className="font-display text-[52px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[84px]">
            ¿Dónde la tiran <span className="font-serif font-normal italic text-bottle">de diez</span>?
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-stone">
            Cuéntanos qué bar sirve cerveza de bodega y por qué merece estar en la guía. Lo revisamos antes de publicarlo.
          </p>
          <div className="relative mt-2 hidden h-[420px] overflow-hidden rounded-[32px] md:block">
            <Image src={IMG.pour} alt="" fill sizes="45vw" className="object-cover" placeholder="blur" />
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_440px]">
          <SuggestForm cities={cities.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} defaultCity={ciudad} />
        </div>
      </section>
    </main>
  )
}
