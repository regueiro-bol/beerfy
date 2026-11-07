import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Inter, Newsreader } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' })
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-newsreader', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'Beerfy — La guía de la cerveza de bodega bien tirada', template: '%s · Beerfy' },
  description:
    'Encuentra los bares que sirven cerveza de bodega (sin pasteurizar, directa del tanque) y descubre cómo la tiran. Guía colaborativa con Estrella Galicia de Bodega y otras cervezas de tanque.',
  openGraph: { type: 'website', locale: 'es_ES', siteName: 'Beerfy', images: ['/og-default.jpg'] },
  twitter: { card: 'summary_large_image', images: ['/og-default.jpg'] },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D0B08',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
