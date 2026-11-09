'use client'

import { useEffect, useState } from 'react'
import { isTouchDevice } from '@/lib/geo/distance'
import { track } from '@/lib/analytics'

const DISMISS_KEY = 'bfy-install-dismissed'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Registra el service worker (necesario para instalar Beerfy como app). */
export function RegisterSW() {
  useEffect(() => {
    const onInstalled = () => track('pwa_installed', {})
    window.addEventListener('appinstalled', onInstalled)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])
  return null
}

/** Tarjeta «Lleva Beerfy en el móvil»: botón de instalar en Android, instrucciones en iPhone. */
export function InstallApp() {
  const [mode, setMode] = useState<'none' | 'android' | 'ios'>('none')
  const [evt, setEvt] = useState<BIPEvent | null>(null)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    } catch {}
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
    if (dismissed || standalone || !isTouchDevice()) return
    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    const t = isIOS ? window.setTimeout(() => setMode('ios'), 0) : undefined
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as BIPEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      if (t) window.clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  function dismiss() {
    track('pwa_dismiss', { platform: mode })
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    setMode('none')
  }

  if (mode === 'none') return null
  return (
    <section aria-label="Instalar Beerfy" className="mx-auto max-w-[1320px] px-5 pt-8 md:px-8">
      <div className="flex flex-col gap-3 rounded-[26px] bg-bottle p-6 text-cream">
        <p className="font-display text-2xl font-extrabold leading-tight">Lleva Beerfy en el móvil</p>
        {mode === 'android' ? (
          <p className="text-[15px] text-sand">Instálala como una app: se abre al momento y la tienes a mano para puntuar en el bar.</p>
        ) : (
          <p className="text-[15px] text-sand">
            En Safari, pulsa{' '}
            <svg className="inline h-5 w-5 align-[-3px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Compartir">
              <path d="M12 3v12M8 7l4-4 4 4" />
              <path d="M6 11v9h12v-9" />
            </svg>{' '}
            <strong className="text-cream">Compartir</strong> y luego <strong className="text-cream">Añadir a pantalla de inicio</strong>.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {mode === 'android' && evt && (
            <button
              type="button"
              onClick={async () => {
                track('pwa_install', { platform: 'android' })
                await evt.prompt()
                await evt.userChoice.catch(() => null)
                setMode('none')
              }}
              className="min-h-11 rounded-full bg-amber px-6 font-bold text-ink"
            >
              Instalar Beerfy
            </button>
          )}
          <button type="button" onClick={dismiss} className="min-h-11 rounded-full border border-cream/40 px-5 font-semibold">
            Ahora no
          </button>
        </div>
      </div>
    </section>
  )
}
