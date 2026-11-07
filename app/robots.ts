import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*/puntuar'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
