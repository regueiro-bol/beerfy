'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { distanceM, isTouchDevice } from '@/lib/geo/distance'

/**
 * Botón fijo «Puntuar» en la ficha, solo en móvil. Si el usuario YA dio permiso de ubicación a Beerfy
 * y está a menos de 200 m, el mensaje se personaliza («¿Estás en …?»). Nunca pide el permiso por su cuenta.
 */
export function RateSticky({ venueName, lat, lng, href }: { venueName: string; lat: number | null; lng: number | null; href: string }) {
  const [show, setShow] = useState(false)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setShow(isTouchDevice()), 0)
    if (lat === null || lng === null || !navigator.permissions || !('geolocation' in navigator)) return () => window.clearTimeout(t)
    let alive = true
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((st) => {
        if (st.state !== 'granted') return
        navigator.geolocation.getCurrentPosition(
          (p) => {
            if (alive && distanceM({ lat: p.coords.latitude, lng: p.coords.longitude }, { lat, lng }) <= 200) setNear(true)
          },
          () => {},
          { maximumAge: 300000, timeout: 10000 }
        )
      })
      .catch(() => {})
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [lat, lng])

  useEffect(() => {
    if (!show) return
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = '80px'
    return () => {
      document.body.style.paddingBottom = prev
    }
  }, [show])

  if (!show) return null
  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper/95 px-4 pb-3 pt-3 backdrop-blur">
        <Link
          href={href}
          data-track="rate_cta"
          data-track-location={near ? 'sticky_near' : 'sticky'}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-amber px-4 text-center text-[16px] font-extrabold text-ink"
        >
          {near ? `¿Estás en ${venueName}? Puntúa tu caña` : 'Puntuar mi tirada'}
        </Link>
      </div>
    </>
  )
}
