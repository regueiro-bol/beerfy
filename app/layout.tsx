import type { Metadata, Viewport } from 'next'
import './globals.css'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beerfy.bar'
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'Beerfy — Bares con Estrella Galicia de Bodega', template: '%s · Beerfy' },
  description: 'Guía colaborativa de bares y cervecerías donde te tiran bien la Estrella Galicia de Bodega.',
  openGraph: { type: 'website', locale: 'es_ES', siteName: 'Beerfy', images: ['/og-default.png'] },
  twitter: { card: 'summary_large_image', images: ['/og-default.png'] },
  robots: { index: true, follow: true },
}
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0f0f',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body className="min-h-screen antialiased">{children}</body></html>)
}
