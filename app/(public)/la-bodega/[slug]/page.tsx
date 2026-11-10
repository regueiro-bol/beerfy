import type { Metadata } from "next";
import Link from "next/link";
import { BrandTile } from "@/components/brand/mark";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/chrome";
import { VenueCard } from "@/components/site/venue-card";
import { IMG } from "@/lib/content/images";
import { CHAPTERS, getChapter } from "@/lib/content/bodega";
import { getRankedVenues } from "@/lib/supabase/queries";
import { getCovers } from "@/lib/google/place-live";
import { getBreadcrumbSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

const APP_URL = SITE_URL;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Dinámica: las fotos de Google de las tarjetas no se pueden guardar en el HTML estático.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = getChapter(slug);
  if (!c) return {};
  return {
    title: c.metaTitle ?? c.title,
    description: c.metaDescription ?? c.lead,
    alternates: { canonical: `${APP_URL}/la-bodega/${c.slug}` },
    openGraph: {
      type: "article",
      title: c.metaTitle ?? c.title,
      description: c.metaDescription ?? c.lead,
    },
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { slug } = await params;
  const c = getChapter(slug);
  if (!c) notFound();

  const idx = CHAPTERS.findIndex((x) => x.slug === c.slug);
  const prev = CHAPTERS[idx - 1];
  const next = CHAPTERS[idx + 1];
  const venues = await getRankedVenues(3);
  const covers = await getCovers(venues);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.lead,
    inLanguage: "es",
    author: {
      "@type": "Organization",
      name: "Redacción Beerfy",
      parentOrganization: { "@id": `${APP_URL}/#organization` },
    },
    publisher: { "@id": `${APP_URL}/#organization` },
    mainEntityOfPage: `${APP_URL}/la-bodega/${c.slug}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getBreadcrumbSchema([
              { name: "La Bodega", path: "/la-bodega" },
              { name: c.title, path: `/la-bodega/${c.slug}` },
            ]),
          ),
        }}
      />
      <SiteHeader current="/la-bodega" />

      <article>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 pt-10 md:px-8 md:pt-12">
          <nav
            aria-label="Migas de pan"
            className="flex flex-wrap gap-2 text-sm text-stone"
          >
            <Link
              href="/la-bodega"
              className="underline-offset-4 hover:underline"
            >
              La Bodega
            </Link>
            <span aria-hidden="true">/</span>
            <span>{c.category}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber px-3 py-1.5 text-[13px] font-semibold text-ink">
              Capítulo {c.n} · {c.category}
            </span>
            <span className="text-sm text-stone">
              {c.minutes} min de lectura
            </span>
          </div>
          <h1 className="max-w-[980px] font-display text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] md:text-[72px]">
            {c.title}
          </h1>
          <p className="max-w-[760px] font-serif text-xl leading-snug text-[#4A463D] md:text-2xl">
            {c.lead}
          </p>
          <div className="relative h-[300px] overflow-hidden rounded-[28px] md:h-[520px]">
            <Image
              src={IMG[c.image]}
              alt={c.imageAlt ?? ""}
              fill
              preload
              sizes="(max-width: 1240px) 100vw, 1240px"
              className="object-cover"
              placeholder="blur"
            />
            <span className="absolute bottom-3 right-4 text-xs text-cream/80">
              {c.imageCaption ?? "Imagen de ambiente generada con IA"}
            </span>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-16 px-5 pb-10 pt-14 md:px-8">
          <aside className="flex min-w-0 flex-[0_1_260px] flex-col gap-4 md:sticky md:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">
              En este artículo
            </p>
            <ol className="flex flex-col gap-1 text-[15px]">
              {c.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block border-l-[3px] border-line px-3.5 py-2.5 text-stone hover:border-[#16140F] hover:text-[#16140F]"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="min-w-0 max-w-[720px] flex-[1_1_560px] font-serif text-[20px] leading-[1.65] text-[#26231C] md:text-[21px]">
            <div className="mb-10 rounded-3xl border-[1.5px] border-[#16140F] bg-white p-6 font-sans md:p-7">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-bottle">
                En resumen
              </p>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-base leading-relaxed">
                {c.summary.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            {c.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mb-10 scroll-mt-6">
                <h2 className="mb-4 font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-[#16140F] md:text-[36px]">
                  {s.title}
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} className="mb-5">
                    {p}
                  </p>
                ))}
                {i === 1 && (
                  <aside className="my-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-bottle p-7 font-sans text-cream">
                    <div className="flex-[1_1_280px]">
                      <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-amber">
                        Ponlo en práctica
                      </p>
                      <p className="font-display text-2xl font-bold leading-tight">
                        Busca un bar con cerveza de bodega cerca y fíjate en la
                        tirada.
                      </p>
                    </div>
                    <Link
                      href="/ciudades"
                      className="rounded-full bg-amber px-6 py-3.5 font-bold text-ink"
                    >
                      Ver ciudades
                    </Link>
                  </aside>
                )}
              </section>
            ))}

            {c.sources && c.sources.length > 0 && (
              <section
                aria-labelledby="fuentes"
                className="mb-10 rounded-3xl bg-cream p-6 font-sans text-[15px]"
              >
                <h2
                  id="fuentes"
                  className="mb-3 font-display text-xl font-extrabold text-[#16140F]"
                >
                  Fuentes
                </h2>
                <ul className="flex flex-col gap-2">
                  {c.sources.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-bottle underline underline-offset-4"
                      >
                        {src.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex items-center gap-3.5 border-t border-line pt-6 font-sans text-sm">
              <BrandTile size={44} />
              <div>
                <strong>Redacción Beerfy</strong>
                <br />
                <span className="text-stone">
                  Contenido divulgativo. Si detectas un error, escríbenos.
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {venues.length > 0 && (
        <section className="bg-ink text-cream">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-16 md:px-8">
            <h2 className="font-display text-[36px] font-extrabold tracking-[-0.03em] md:text-[48px]">
              Dónde probarla bien tirada
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
              {venues.map((v) => (
                <VenueCard
                  key={v.id}
                  tall={false}
                  href={`/${v.cities?.slug}/${v.slug}`}
                  name={v.name}
                  place={[v.cities?.name, v.district]
                    .filter(Boolean)
                    .join(" · ")}
                  coverUrl={covers[v.id]?.url ?? null}
                  coverCredit={covers[v.id]?.google ?? null}
                  score={v.score}
                  votes={v.votes}
                  servesBodega={v.serves_eg_bodega}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <nav
        aria-label="Capítulos"
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 px-5 py-16 md:grid-cols-2 md:px-8"
      >
        {prev ? (
          <Link
            href={`/la-bodega/${prev.slug}`}
            className="rounded-3xl border-[1.5px] border-line bg-white p-6 hover:border-[#16140F]"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-bottle">
              ← Capítulo {prev.n}
            </span>
            <p className="mt-2 font-display text-[22px] font-bold">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/la-bodega/${next.slug}`}
            className="rounded-3xl border-[1.5px] border-line bg-white p-6 text-right hover:border-[#16140F]"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-bottle">
              Capítulo {next.n} →
            </span>
            <p className="mt-2 font-display text-[22px] font-bold">
              {next.title}
            </p>
          </Link>
        )}
      </nav>
    </main>
  );
}
