import type { Metadata } from 'next'
import { getPublishedVenues, getVenueScores } from '@/lib/supabase/queries'
import { SiteHeader } from '@/components/site/chrome'
import { NearMe, type NearVenue } from './near-me'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bares con cerveza de bodega cerca de ti',
  description: 'Encuentra los bares con cerveza de bodega más cercanos a donde estás.',
  robots: { index: false },
}

export default async function NearPage() {
  const venues = await getPublishedVenues()
  const withCoords = venues.filter((v) => v.latitude !== null && v.longitude !== null && v.cities?.slug)
  const scores = await getVenueScores(withCoords.map((v) => v.id))
  const list: NearVenue[] = withCoords.map((v) => ({
    venue: v,
    citySlug: v.cities!.slug,
    score: scores[v.id]?.score ?? null,
    votes: scores[v.id]?.votes ?? 0,
  }))

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-10 md:px-8 md:py-14">
        <h1 className="font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.04em] md:text-[64px]">
          Cerveza de bodega <span className="font-serif font-normal italic text-bottle">cerca de ti</span>
        </h1>
        <NearMe venues={list} />
      </section>
    </main>
  )
}
