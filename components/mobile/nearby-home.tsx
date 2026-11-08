'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { distanceM, formatDistance, isTouchDevice } from '@/lib/geo/distance'
import { formatScore } from '@/components/site/chrome'

export type NearbyItem = {
  id: string
  name: string
  href: string
  lat: number
  lng: number
  score: number | null
  votes: number
  cover: string | null
}

const ASKED_KEY = 'bfy-geo-asked'

/**
 * En móvil, la home empieza por los bares más cercanos. Si ya hay permiso de ubicación se listan solos;
 * si no, se ofrece activarlo con un toque (no se lanza el aviso del navegador sin que el usuario lo pida).
 * La ubicación se usa solo en el móvil para ordenar; no se envía a Beerfy.
 */
export function NearbyHome({ items }: { items: NearbyItem[] }) {
  const [mobile, setMobile] = useState(false)
  const [perm, setPerm] = useState<'unknown' | 'granted' | 'prompt' | 'denied'>('unknown')
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    try {
      localStorage.setItem(ASKED_KEY, '1')
    } catch {}
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude })
        setPerm('granted')
        setLocating(false)
      },
      (e) => {
        setLocating(false)
        if (e.code === e.PERMISSION_DENIED) setPerm('denied')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
    )
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setMobile(isTouchDevice()), 0)
    if (!navigator.permissions) {
      // Safari antiguo: si ya lo pidió antes, volvemos a pedir (el sistema recuerda la respuesta).
      let asked = false
      try {
        asked = localStorage.getItem(ASKED_KEY) === '1'
      } catch {}
      const t2 = window.setTimeout(() => (asked ? locate() : setPerm('prompt')), 0)
      return () => {
        window.clearTimeout(t)
        window.clearTimeout(t2)
      }
    }
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((st) => {
        if (st.state === 'granted') locate()
        else setPerm(st.state as 'prompt' | 'denied')
      })
      .catch(() => setPerm('prompt'))
    return () => window.clearTimeout(t)
  }, [locate])

  const nearest = useMemo(() => {
    if (!me) return []
    return items
      .map((i) => ({ ...i, d: distanceM(me, { lat: i.lat, lng: i.lng }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
  }, [me, items])

  if (!mobile || perm === 'denied' || perm === 'unknown') return null

  if (!me) {
    return (
      <div className="relative z-10 mx-5 mt-2 flex items-center gap-4 rounded-[22px] border border-white/15 bg-ink/80 p-4 backdrop-blur">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-amber text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 text-[15px] leading-snug text-sand">
          <strong className="block text-cream">¿Qué bares tienes cerca?</strong>
          Usamos tu ubicación solo en tu móvil.
        </span>
        <button type="button" onClick={locate} disabled={locating} className="min-h-11 flex-none rounded-full bg-amber px-4 text-sm font-bold text-ink">
          {locating ? 'Buscando…' : 'Ver'}
        </button>
      </div>
    )
  }

  const first = nearest[0]
  return (
    <section aria-label="Bares cerca de ti" className="relative z-10 px-5 pt-2">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-[26px] font-extrabold">Cerca de ti</h2>
        <Link href="/cerca" className="text-sm font-semibold text-amber">
          Ver mapa →
        </Link>
      </div>
      {first && first.d > 25000 ? (
        <p className="rounded-[20px] bg-white/10 p-4 text-[15px] text-sand">
          Aún no hay bares en tu zona: el más cercano está a {formatDistance(first.d)}.{' '}
          <Link href="/sugerir" className="font-semibold text-amber underline underline-offset-4">Sugiere uno</Link>.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {nearest.map((n) => (
            <li key={n.id}>
              <Link href={n.d <= 200 ? `${n.href}/puntuar` : n.href} className="flex items-center gap-3 rounded-[20px] bg-white/[0.08] p-2.5 pr-4 backdrop-blur">
                {n.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.cover} alt="" className="h-14 w-14 flex-none rounded-2xl object-cover" />
                ) : (
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[#2A2419] font-display text-xl font-extrabold text-amber">
                    {n.name.charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-extrabold leading-tight">{n.name}</span>
                  <span className="block text-[13px] text-sand">
                    {formatDistance(n.d)} · {n.score !== null ? `${formatScore(n.score)} de tirada` : n.votes > 0 ? 'En calibración' : 'Sin notas aún'}
                  </span>
                </span>
                {n.d <= 200 ? (
                  <span className="flex-none rounded-full bg-amber px-3 py-1.5 text-xs font-extrabold text-ink">Puntuar</span>
                ) : (
                  <span aria-hidden="true" className="text-xl text-sand">›</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
