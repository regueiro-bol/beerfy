import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Inter, Newsreader } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import { SITE_URL, GTM_ID, CONSENT_KEY } from '@/lib/site'
import { CookieBanner } from '@/components/consent/cookie-banner'
import { RegisterSW } from '@/components/mobile/pwa'

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
      <body className="min-h-screen antialiased">
        <Script id="consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
try{if(localStorage.getItem('${CONSENT_KEY}')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}`}
        </Script>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
        <CookieBanner />
        <RegisterSW />
      </body>
    </html>
  )
}
