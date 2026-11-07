import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVenueBySlugs } from '@/lib/supabase/queries'
import { SiteHeader } from '@/components/site/chrome'
import QRCode from 'qrcode'
import { SITE_URL } from '@/lib/site'
import { RateForm } from './rate-form'
import { MobileGate } from './mobile-gate'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ ciudad: string; venue: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad, venue } = await params
  const data = await getVenueBySlugs(ciudad, venue)
  if (!data) return {}
  return { title: `Puntuar la tirada en ${data.venue.name}`, robots: { index: false } }
}

export default async function RatePage({ params }: PageProps) {
  const { ciudad, venue: venueSlug } = await params
  const data = await getVenueBySlugs(ciudad, venueSlug)
  if (!data) notFound()
  const { venue, city } = data
  const path = `/${city.slug}/${venue.slug}`
  const qrSvg = await QRCode.toString(`${SITE_URL}${path}/puntuar`, { type: 'svg', margin: 0, color: { dark: '#0D0B08', light: '#F6F1E4' } })

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto flex max-w-[760px] flex-col gap-8 px-5 py-12 md:py-16">
        <div>
          <Link href={path} className="text-sm font-semibold text-stone underline-offset-4 hover:underline">← {venue.name}</Link>
          <h1 className="mt-3 font-display text-[48px] font-extrabold leading-[0.92] tracking-[-0.04em] md:text-[72px]">
            ¿Cómo te la han <span className="font-serif font-normal italic text-bottle">tirado</span>?
          </h1>
          <p className="mt-3 text-lg text-stone">{venue.name} · {city.name}</p>
        </div>
        <MobileGate qrSvg={qrSvg}>
          <RateForm venueId={venue.id} venueName={venue.name} path={path} />
        </MobileGate>
      </section>
    </main>
  )
}
