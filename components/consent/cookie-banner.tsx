'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CONSENT_KEY } from '@/lib/site'

type Choice = 'granted' | 'denied'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function applyConsent(choice: Choice) {
  const v = choice
  window.gtag?.('consent', 'update', {
    analytics_storage: v,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.dataLayer?.push({ event: 'consent_update', consent_analytics: v })
}

/** Banner de cookies: analítica solo con permiso (Consent Mode v2). */
export function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(CONSENT_KEY)
    } catch {}
    const first = window.setTimeout(() => {
      if (stored !== 'granted' && stored !== 'denied') setOpen(true)
    }, 0)
    const reopen = () => setOpen(true)
    window.addEventListener('bfy:cookies', reopen)
    return () => {
      window.clearTimeout(first)
      window.removeEventListener('bfy:cookies', reopen)
    }
  }, [])

  function choose(choice: Choice) {
    try {
      localStorage.setItem(CONSENT_KEY, choice)
    } catch {}
    applyConsent(choice)
    setOpen(false)
  }

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-3xl bg-ink p-5 text-cream shadow-2xl md:inset-x-auto md:right-6 md:bottom-6"
    >
      <p className="mb-4 text-[15px] leading-relaxed">
        Usamos cookies de analítica (Google Analytics) para saber qué páginas se leen y mejorar la guía. Solo se activan si aceptas.{' '}
        <Link href="/privacidad#cookies" className="font-semibold text-amber underline underline-offset-4">
          Más información
        </Link>
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => choose('granted')} className="min-h-11 rounded-full bg-amber px-6 font-bold text-ink">
          Aceptar
        </button>
        <button type="button" onClick={() => choose('denied')} className="min-h-11 rounded-full border border-cream/40 px-6 font-semibold text-cream">
          Rechazar
        </button>
      </div>
    </div>
  )
}

/** Enlace para reabrir el banner (pie de página). */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('bfy:cookies'))} className={className}>
      Cookies
    </button>
  )
}
