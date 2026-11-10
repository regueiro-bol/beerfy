import type { City, Venue } from "@/lib/types/database";
import { SITE_URL } from "@/lib/site";

/**
 * Generates Schema.org Place JSON-LD metadata for a city.
 */
export function getCityPlaceSchema(city: City) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: city.name,
  };

  if (city.latitude !== null && city.longitude !== null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
    };
  }

  return schema;
}

/**
 * Generates Schema.org BarOrPub JSON-LD metadata for a venue.
 */
export function getVenueBarOrPubSchema(venue: Venue, city: City) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: venue.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address || "",
      addressLocality: city.name,
      addressRegion: city.region || "",
    },
  };

  if (venue.latitude !== null && venue.longitude !== null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(venue.latitude),
      longitude: Number(venue.longitude),
    };
  }

  if (venue.phone) {
    schema.telephone = venue.phone;
  }

  if (venue.website) {
    schema.url = venue.website;
  }

  const hours = venue.hours_json as { weekdayDescriptions?: string[] } | null;
  if (hours?.weekdayDescriptions) {
    schema.openingHours = hours.weekdayDescriptions;
  }

  return schema;
}

/** BreadcrumbList para rich results y para que los LLM entiendan la jerarquía. */
export function getBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
) {
  const base = SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}${it.path}`,
    })),
  };
}

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Organización Beerfy: entidad única referenciada por @id desde el resto de páginas. */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Beerfy",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      "Guía independiente y colaborativa de bares que sirven cerveza de bodega (sin pasteurizar, servida desde tanque). La comunidad puntúa la tirada con la Nota de tirada de 0 a 10.",
    knowsAbout: [
      "Cerveza de bodega",
      "Cerveza de tanque",
      "Cerveza sin pasteurizar",
      "Estrella Galicia de Bodega",
      "Cómo tirar una caña",
    ],
    areaServed: { "@type": "Country", name: "España" },
  };
}

/** WebSite con publisher → Organization. */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: "Beerfy",
    alternateName: "Beerfy — La guía de la cerveza de bodega",
    url: SITE_URL,
    inLanguage: "es-ES",
    publisher: { "@id": ORG_ID },
  };
}

/** Página «Sobre» enlazada a la organización. */
export function getAboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/sobre-beerfy`,
    name: "Sobre Beerfy",
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    mainEntity: { "@id": ORG_ID },
  };
}

/** ItemList de bares (orden = el que ve el usuario). */
export function getVenueListSchema(
  name: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${SITE_URL}${it.path}`,
    })),
  };
}

/** Serializa JSON-LD escapando «<» para que no pueda cerrar el <script>. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
