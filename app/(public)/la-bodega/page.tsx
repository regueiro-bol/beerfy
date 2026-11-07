import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site/chrome'
import { IMG, BAR_AMBIENCE } from '@/lib/content/images'
import { CHAPTERS, FAQ } from '@/lib/content/bodega'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

export const metadata: Metadata = {
  title: 'La Bodega: guía de la cerveza de bodega (sin pasteurizar y de tanque)',
  description:
    'Qué es la cerveza de bodega, cómo se fabrica sin pasteurizar, cómo viaja en frío hasta el bar, cómo se cuida en el tanque y cómo se tira una buena caña.',
  alternates: { canonical: `${APP_URL}/la-bodega` },
}

const SPANS = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7']

export default function BodegaHubPage() {
  const first = CHAPTERS[0]!
  const rest = CHAPTERS.slice(1)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative flex min-h-[720px] flex-col overflow-hidden bg-ink text-cream md:min-h-[820px]">
        <Image src={IMG.tanks} alt="Tanques de cobre en una bodega con paredes de piedra" fill preload sizes="100vw" className="object-cover" placeholder="blur" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#0D0B08_6%,rgba(13,11,8,0.35)_55%,rgba(13,11,8,0.75)_100%)]" aria-hidden="true" />
        <SiteHeader variant="overlay" current="/la-bodega" />
        <div className="relative mx-auto mt-auto flex w-full max-w-[1320px] flex-wrap items-end justify-between gap-10 px-5 pb-16 md:px-8 md:pb-20">
          <div className="flex max-w-[820px] flex-col gap-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-amber">La Bodega · guía Beerfy</p>
            <h1 className="font-display text-[56px] font-extrabold leading-[0.86] tracking-[-0.05em] md:text-[110px]">
              Todo lo que pasa <span className="font-serif font-normal italic">antes</span> de tu caña.
            </h1>
            <p className="max-w-[640px] font-serif text-xl leading-snug text-[#E4DCC8] md:text-2xl">
              Cerveza sin pasteurizar, viva y con fecha corta. Cómo se hace, cómo viaja en frío hasta el bar y por qué la
              tirada lo cambia todo.
            </p>
          </div>
          <div className="flex max-w-[340px] flex-col gap-2.5 rounded-3xl border border-cream/20 bg-ink/60 p-6 backdrop-blur-md">
            <p className="text-[13px] font-bold text-amber">En 20 segundos</p>
            <p className="text-[15px] leading-relaxed text-[#E4DCC8]">
              No se pasteuriza. Sale de fábrica en cisternas refrigeradas, se guarda en tanques en el propio bar y se sirve
              sin pasar por barril.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1320px] flex-col gap-9 px-5 py-20 md:px-8 md:py-24">
        <h2 className="font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.04em] md:text-[72px]">
          El viaje, <span className="font-serif font-normal italic text-copper">capítulo a capítulo</span>
        </h2>

        <Link href={`/la-bodega/${first.slug}`} className="group relative block h-[420px] overflow-hidden rounded-[34px]">
          <Image src={IMG[first.image]} alt="" fill sizes="100vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" placeholder="blur" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,11,8,0.9)_25%,rgba(13,11,8,0.1)_75%)]" aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex max-w-[640px] flex-col justify-center gap-3 p-8 text-cream md:p-12">
            <span className="font-display text-xl font-extrabold text-amber">{first.n} · Empieza aquí</span>
            <p className="font-display text-[40px] font-extrabold leading-none md:text-[56px]">{first.title}</p>
            <p className="text-lg text-sand">{first.short}</p>
          </div>
        </Link>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {rest.map((c, i) => (
            <Link key={c.slug} href={`/la-bodega/${c.slug}`} className={`group relative block h-[440px] overflow-hidden rounded-[34px] md:h-[520px] ${SPANS[i]}`}>
              <Image
                src={IMG[c.image]}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                placeholder="blur"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-transparent" aria-hidden="true" />
              {c.category === 'Degustación' && (
                <span className="absolute right-6 top-6 rounded-full bg-amber px-3.5 py-2 text-[13px] font-extrabold text-ink">Imprescindible</span>
              )}
              <div className="absolute inset-x-7 bottom-7 text-cream">
                <span className="font-display text-xl font-extrabold text-amber">
                  {c.n} · {c.category}
                </span>
                <p className="mt-1.5 font-display text-[34px] font-extrabold leading-none md:text-[42px]">{c.title}</p>
                <p className="mt-2.5 text-base text-sand">
                  {c.short} · {c.minutes} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1320px] flex-wrap gap-10 px-5 pb-24 md:px-8">
        <div className="min-w-0 flex-[1_1_560px]">
          <h2 className="mb-5 font-display text-[40px] font-extrabold tracking-[-0.03em] md:text-[44px]">Preguntas frecuentes</h2>
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className={`border-t-[1.5px] border-[#16140F] py-5 ${i === FAQ.length - 1 ? 'border-b-[1.5px]' : ''}`}>
              <summary className="min-h-11 cursor-pointer font-display text-[22px] font-bold">{f.q}</summary>
              <p className="mt-3 text-[17px] leading-relaxed text-[#4A463D]">{f.a}</p>
            </details>
          ))}
        </div>
        <Link href="/ciudades" className="group relative block min-h-[460px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[34px]">
          <Image src={BAR_AMBIENCE[1]} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" placeholder="blur" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(13,11,8,0.95)_25%,rgba(13,11,8,0.1)_75%)]" aria-hidden="true" />
          <div className="absolute inset-x-8 bottom-8 flex flex-col gap-4 text-cream">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-amber">De la teoría a la barra</p>
            <p className="font-display text-[36px] font-extrabold leading-none md:text-[40px]">Ya sabes qué mirar. Ahora, pruébala bien tirada.</p>
            <span className="self-start rounded-full bg-amber px-6 py-3.5 font-extrabold text-ink">Buscar bares →</span>
          </div>
        </Link>
      </section>
    </main>
  )
}
