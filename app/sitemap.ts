import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/ciudades`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/sugerir`, lastModified: new Date(), priority: 0.5 },
    { url: `${base}/sobre-beerfy`, lastModified: new Date(), priority: 0.5 },
  ]
}
