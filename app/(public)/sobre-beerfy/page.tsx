import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site/chrome'
import { IMG } from '@/lib/content/images'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

export const metadata: Metadata = {
  title: 'Sobre Beerfy',
  description: 'Beerfy es una guía independiente y colaborativa de bares con cerveza de bodega. Así trabajamos.',
  alternates: { canonical: `${APP_URL}/sobre-beerfy` },
}

const PRINCIPLES = [
  { t: 'Puntuamos la tirada', d: 'No el bar en general: temperatura, espuma, vaso y frescura del tanque.' },
  { t: 'Bares reales, revisados', d: 'Cada local se revisa antes de publicarse. Nunca inventamos bares.' },
  { t: 'IA con criterio', d: 'Nos ayuda a redactar y ordenar, pero todo lo revisa una persona antes de publicarse.' },
  { t: 'Independientes', d: 'Sin afiliación con ninguna cervecera. Citamos marcas solo para identificar la cerveza.' },
]

export default function AboutPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-cream">
        <Image src={IMG.foam} alt="" fill preload sizes="100vw" className="object-cover opacity-60" placeholder="blur" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" aria-hidden="true" />
        <SiteHeader variant="overlay" current="/sobre-beerfy" />
        <div className="relative mx-auto max-w-[1320px] px-5 pb-20 pt-20 md:px-8 md:pt-28">
          <h1 className="max-w-[900px] font-display text-[52px] font-extrabold leading-[0.9] tracking-[-0.05em] md:text-[96px]">
            Una guía hecha por gente que <span className="font-serif font-normal italic text-amber">mira la espuma</span>.
          </h1>
        </div>
      </section>
      <section className="mx-auto flex max-w-[1320px] flex-col gap-12 px-5 py-16 md:px-8 md:py-20">
        <p className="max-w-[780px] font-serif text-2xl leading-snug text-[#26231C] md:text-[28px]">
          Beerfy nace para responder a una pregunta sencilla: ¿dónde te sirven bien la cerveza de bodega? Empezamos con la
          Estrella Galicia de Bodega y queremos abrirnos a otras cervezas de tanque.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {PRINCIPLES.map((p, i) => (
            <div key={p.t} className={`flex min-h-[220px] flex-col justify-between rounded-[30px] p-7 ${['bg-ink text-cream', 'bg-[#F3EEE2]', 'bg-amber', 'bg-bottle text-cream'][i]}`}>
              <span className="font-display text-xl font-extrabold opacity-70">0{i + 1}</span>
              <div>
                <h2 className="font-display text-[28px] font-extrabold leading-tight">{p.t}</h2>
                <p className="mt-2 text-[15px] leading-relaxed opacity-85">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sugerir" className="rounded-full bg-amber px-6 py-4 font-bold text-ink">Sugerir un bar</Link>
          <Link href="/la-bodega" className="rounded-full border-[1.5px] border-[#16140F] px-6 py-4 font-bold">Leer La Bodega</Link>
        </div>
      </section>
    </main>
  )
}
