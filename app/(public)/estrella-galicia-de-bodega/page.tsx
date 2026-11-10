import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site/chrome";
import { IMG } from "@/lib/content/images";
import { SITE_URL } from "@/lib/site";
import {
  getPublishedCities,
  getPublishedVenues,
  getVenueScores,
} from "@/lib/supabase/queries";
import {
  getBreadcrumbSchema,
  getVenueListSchema,
  jsonLd,
} from "@/lib/seo/schema";

export const dynamic = "force-dynamic";

const PATH = "/estrella-galicia-de-bodega";
const TITLE = "Estrella Galicia de Bodega: qué es y dónde tomarla";
const DESCRIPTION =
  "Estrella Galicia de Bodega es la versión sin pasteurizar de Estrella Galicia: llega al bar en cisterna refrigerada y se sirve desde tanque. Qué es, cómo se sirve y bares donde tomarla, ciudad a ciudad.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION },
};

/** Datos de la ficha oficial de producto (ver FUENTES). Sin cifras que no estén ahí. */
const FICHA = [
  { k: "Estilo", v: "Helles Exportbier, de baja fermentación" },
  { k: "Alcohol", v: "5,5 %" },
  { k: "Pasteurización", v: "No: sin pasteurizar" },
  {
    k: "Ingredientes",
    v: "Agua de A Coruña, maltas Pilsen y tostada, lúpulos Nugget y Perle Hallertau, levadura propia de Hijos de Rivera",
  },
  { k: "Temperatura de servicio", v: "4–5 ºC" },
  {
    k: "Cómo llega al bar",
    v: "De la fábrica al local en frío, en cisterna, y se sirve desde tanque",
  },
];

const FAQ = [
  {
    q: "¿Qué es la Estrella Galicia de Bodega?",
    a: "Es la cerveza de Estrella Galicia sin pasteurizar. En lugar de envasarse en barril, viaja refrigerada desde la fábrica de A Coruña hasta el bar y se sirve desde tanques instalados en el propio local.",
  },
  {
    q: "¿Está pasteurizada?",
    a: "No. Según la ficha oficial, es una cerveza sin pasteurizar que llega directamente de las bodegas de la fábrica al punto de venta, manteniendo la cadena de frío.",
  },
  {
    q: "¿Qué graduación tiene?",
    a: "Un 5,5 % de alcohol. Es una Helles Exportbier de baja fermentación.",
  },
  {
    q: "¿A qué temperatura se sirve?",
    a: "La marca recomienda servirla entre 4 y 5 ºC: bien fría, pero sin llegar a helada.",
  },
  {
    q: "¿En qué se diferencia de la Estrella Galicia de barril?",
    a: "La de barril se pasteuriza antes de envasarse para aguantar más tiempo fuera del frío. La de bodega no se pasteuriza, viaja en cisterna refrigerada y se descarga en tanques fijos del bar.",
  },
  {
    q: "¿Dónde se puede tomar?",
    a: "Solo en bares con tanques de cerveza de bodega. En Beerfy los tienes por ciudad, con la Nota de tirada que ponen quienes se la beben.",
  },
];

const FUENTES = [
  {
    label: "Estrella Galicia — Cerveza de Bodega (ficha de producto)",
    url: "https://estrellagalicia.es/producto/estrella-galicia-cerveza-de-bodega/",
  },
  {
    label:
      "Hijos de Rivera — Primer bar con tanques verticales de Cerveza de Bodega",
    url: "https://corporacionhijosderivera.com/en/first-pub-with-estrella-galicia-vertical-tanks-in-spain",
  },
  {
    label:
      "Alimarket — Hijos de Rivera extiende el modelo de cerveza de bodega a 1906",
    url: "https://www.alimarket.es/alimentacion/noticia/305492/hijos-de-rivera-extiende-el-modelo-de-cerveza-de-bodega-a--1906-",
  },
];

export default async function EstrellaGaliciaBodegaPage() {
  const [cities, venues] = await Promise.all([
    getPublishedCities(),
    getPublishedVenues(),
  ]);
  const egVenues = venues.filter((v) => v.serves_eg_bodega && v.cities?.slug);
  const scores = await getVenueScores(egVenues.map((v) => v.id));

  const byCity = cities
    .map((c) => ({
      city: c,
      venues: egVenues
        .filter((v) => v.cities!.slug === c.slug)
        .sort(
          (a, b) =>
            (scores[b.id]?.score ?? -1) - (scores[a.id]?.score ?? -1) ||
            a.name.localeCompare(b.name, "es"),
        ),
    }))
    .filter((g) => g.venues.length > 0)
    .sort((a, b) => b.venues.length - a.venues.length);

  const listItems = byCity.flatMap((g) =>
    g.venues.map((v) => ({
      name: `${v.name} (${g.city.name})`,
      path: `/${g.city.slug}/${v.slug}`,
    })),
  );

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    inLanguage: "es",
    about: { "@type": "Thing", name: "Estrella Galicia de Bodega" },
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}${PATH}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(pageSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          getBreadcrumbSchema([
            { name: "Estrella Galicia de Bodega", path: PATH },
          ]),
        )}
      />
      {listItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            getVenueListSchema(
              "Bares con Estrella Galicia de Bodega",
              listItems,
            ),
          )}
        />
      )}

      <section className="relative overflow-hidden bg-ink text-cream">
        <Image
          src={IMG.pour}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover opacity-50"
          placeholder="blur"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/70"
          aria-hidden="true"
        />
        <SiteHeader variant="overlay" />
        <div className="relative mx-auto max-w-[1320px] px-5 pb-16 pt-14 md:px-8 md:pt-24">
          <h1 className="max-w-[980px] font-display text-[48px] font-extrabold leading-[0.9] tracking-[-0.05em] md:text-[92px]">
            Estrella Galicia <span className="text-amber">de Bodega</span>
          </h1>
          <p className="mt-4 font-display text-2xl font-bold text-sand md:text-3xl">
            Qué es y dónde tomarla
          </p>
          <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-sand">
            Es la Estrella Galicia sin pasteurizar: no viaja en barril, sino en
            cisterna refrigerada desde la fábrica de A Coruña, y se sirve desde
            tanques instalados en el propio bar. Por eso solo la encuentras en
            algunos locales, y por eso importa tanto cómo la tiran.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#donde"
              className="rounded-full bg-amber px-6 py-3.5 font-bold text-ink"
            >
              Ver dónde tomarla
            </a>
            <Link
              href="/la-bodega/que-es-la-cerveza-de-bodega"
              className="rounded-full border border-cream/30 px-6 py-3.5 font-bold text-cream"
            >
              Qué es la cerveza de bodega
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-10 px-5 py-16 md:grid-cols-[1fr_1.1fr] md:px-8 md:py-20">
        <div className="flex flex-col gap-5 font-serif text-[20px] leading-[1.65] text-[#26231C]">
          <h2 className="font-display text-[34px] font-extrabold leading-tight tracking-[-0.02em] text-[#16140F] md:text-[44px]">
            La misma marca, otro camino hasta el vaso
          </h2>
          <p>
            La mayoría de la cerveza de barril, botella o lata se pasteuriza: se
            calienta brevemente para que aguante semanas fuera del frío. La
            Estrella Galicia de Bodega se salta ese paso. A cambio, no puede
            romper la cadena de frío en ningún momento: sale de la fábrica en
            cisterna refrigerada y se descarga en los tanques del bar.
          </p>
          <p>
            Esos tanques son la pista para reconocerla: suelen estar a la vista,
            en la barra o en una sala del local, con la imagen de Cerveza de
            Bodega. Hijos de Rivera, la empresa que la elabora, también la
            ofrece con su marca 1906.
          </p>
          <p>
            Que un bar tenga tanque no garantiza una buena caña. La copa, la
            temperatura, la limpieza de las líneas y la rotación cuentan igual.
            Eso es lo que puntúa la comunidad en Beerfy con la{" "}
            <Link
              href="/como-puntuamos"
              className="font-semibold text-bottle underline underline-offset-4"
            >
              Nota de tirada
            </Link>
            .
          </p>
          <figure className="mt-2 flex flex-col gap-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl md:aspect-[4/3]">
              <Image
                src={IMG.tanksCopper}
                alt="Dos tanques de cobre de Estrella Galicia Cerveza de Bodega apilados en un bar"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top"
                placeholder="blur"
              />
            </div>
            <figcaption className="font-sans text-sm text-stone">
              Tanques de Cerveza de Bodega a la vista en un bar. Foto: Beerfy.
            </figcaption>
          </figure>
        </div>
        <div className="self-start rounded-3xl border-[1.5px] border-[#16140F] bg-white p-6 md:p-8">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-bottle">
            Ficha
          </p>
          <dl className="flex flex-col divide-y divide-line">
            {FICHA.map((f) => (
              <div
                key={f.k}
                className="flex flex-col gap-1 py-3 md:flex-row md:gap-6"
              >
                <dt className="w-[190px] shrink-0 text-sm font-semibold text-stone">
                  {f.k}
                </dt>
                <dd className="text-base text-[#16140F]">{f.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-stone">
            Datos de la ficha oficial de producto de Estrella Galicia.
          </p>
        </div>
      </section>

      <section id="donde" className="scroll-mt-6 bg-[#F3EEE2]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-16 md:px-8 md:py-20">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-[38px] font-extrabold tracking-[-0.03em] md:text-[56px]">
              Dónde tomar Estrella Galicia de Bodega
            </h2>
            <p className="max-w-[720px] text-lg text-stone">
              {egVenues.length}{" "}
              {egVenues.length === 1 ? "bar revisado" : "bares revisados"} en{" "}
              {byCity.length} {byCity.length === 1 ? "ciudad" : "ciudades"}.
              Seguimos sumando: si conoces otro, sugiérelo.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            {byCity.map(({ city, venues: list }) => (
              <div
                key={city.id}
                className="flex flex-col gap-4 rounded-3xl bg-white p-6"
              >
                <Link
                  href={`/${city.slug}`}
                  className="font-display text-[28px] font-extrabold leading-tight hover:text-bottle"
                >
                  {city.name}{" "}
                  <span className="text-base font-semibold text-stone">
                    · {list.length}
                  </span>
                </Link>
                <ul className="flex flex-col gap-2 text-[15px]">
                  {list.map((v) => {
                    const s = scores[v.id];
                    return (
                      <li
                        key={v.id}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <Link
                          href={`/${city.slug}/${v.slug}`}
                          className="font-semibold underline-offset-4 hover:underline"
                          data-track="select_venue"
                          data-track-label={v.name}
                          data-track-location="eg_bodega"
                        >
                          {v.name}
                        </Link>
                        {s?.score !== null && s?.score !== undefined && (
                          <span className="shrink-0 rounded-full bg-amber px-2 py-0.5 text-xs font-bold text-ink">
                            {s.score.toFixed(1)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={`/${city.slug}`}
                  className="mt-auto text-sm font-semibold text-bottle underline underline-offset-4"
                >
                  Ver mapa de {city.name}
                </Link>
              </div>
            ))}
          </div>
          <Link
            href="/sugerir"
            className="self-start rounded-full bg-ink px-6 py-4 font-bold text-cream"
          >
            Sugerir un bar con Estrella Galicia de Bodega
          </Link>
        </div>
      </section>

      <section className="mx-auto flex max-w-[980px] flex-col gap-8 px-5 py-16 md:px-8 md:py-20">
        <h2 className="font-display text-[34px] font-extrabold tracking-[-0.02em] md:text-[44px]">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none font-display text-xl font-bold marker:hidden">
                {f.q}
                <span className="float-right text-stone transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[17px] leading-relaxed text-[#4A463D]">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        <section
          aria-labelledby="fuentes"
          className="rounded-3xl bg-cream p-6 text-[15px]"
        >
          <h2
            id="fuentes"
            className="mb-3 font-display text-xl font-extrabold text-[#16140F]"
          >
            Fuentes
          </h2>
          <ul className="flex flex-col gap-2">
            {FUENTES.map((src) => (
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
          <p className="mt-4 text-xs text-stone">
            Beerfy es una guía independiente, sin afiliación con Hijos de
            Rivera. Estrella Galicia es marca registrada de su titular; la
            citamos solo para identificar la cerveza.
          </p>
        </section>
      </section>
    </main>
  );
}
