'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import CityMap from '@/components/feature/city-map/CityMap'
import { ScoreBadge } from '@/components/site/chrome'
import { distanceM, formatDistance } from '@/lib/geo/distance'
import type { Venue } from '@/lib/types/database'

export type NearVenue = { venue: Venue; citySlug: string; score: number | null; votes: number }

/** La ubicación se usa solo en el navegador para ordenar por distancia: no se envía a Beerfy. */
export function NearMe({ venues }: { venues: NearVenue[] }) {
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)
  const [state, setState] = useState<'idle' | 'locating' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState('error')
      setMsg('Tu navegador no permite usar la ubicación.')
      return
    }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude })
        setState('idle')
      },
      (e) => {
        setState('error')
        setMsg(
          e.code === e.PERMISSION_DENIED
            ? 'Sin permiso de ubicación no podemos saber qué bares tienes cerca. Puedes activarlo en los ajustes del navegador o buscar por ciudad.'
            : 'No hemos podido obtener tu ubicación. Comprueba que el GPS está activado.'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
    )
  }, [])

  useEffect(() => {
    const t = window.setTimeout(locate, 0)
    return () => window.clearTimeout(t)
  }, [locate])

  const sorted = useMemo(() => {
    if (!me) return []
    return venues
      .map((n) => ({ ...n, d: distanceM(me, { lat: Number(n.venue.latitude), lng: Number(n.venue.longitude) }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 20)
  }, [me, venues])

  const mapVenues = useMemo(() => sorted.map((s) => s.venue), [sorted])

  const hrefFor = useCallback(
    (v: Venue) => {
      const n = venues.find((x) => x.venue.id === v.id)
      return n ? `/${n.citySlug}/${v.slug}` : '/ciudades'
    },
    [venues]
  )

  if (!me) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-[28px] bg-ink p-7 text-cream">
        <p className="text-sand">
          {state === 'locating'
            ? 'Buscando tu ubicación…'
            : state === 'error'
              ? msg
              : 'Usamos tu ubicación solo en tu móvil para ordenar los bares por cercanía. No se envía ni se guarda.'}
        </p>
        <div className="flex flex-wrap gap-3">
          {state !== 'locating' && (
            <button type="button" onClick={locate} className="min-h-12 rounded-full bg-amber px-6 font-bold text-ink">
              Usar mi ubicación
            </button>
          )}
          <Link href="/ciudades" className="flex min-h-12 items-center rounded-full border border-cream/40 px-6 font-semibold">
            Buscar por ciudad
          </Link>
        </div>
      </div>
    )
  }

  const nearest = sorted[0]
  return (
    <div className="flex flex-col gap-6">
      {nearest && nearest.d > 25000 && (
        <p className="rounded-2xl bg-[#F3EEE2] px-4 py-3 text-[15px]">
          Aún no tenemos bares cerca de ti: el más próximo está a {formatDistance(nearest.d)}.{' '}
          <Link href="/sugerir" className="font-semibold underline underline-offset-4">Sugiere uno de tu zona</Link>.
        </p>
      )}
      <div className="overflow-hidden rounded-[28px]">
        <CityMap venues={mapVenues} center={me} zoom={15} citySlug="" venueHref={hrefFor} me={me} fit={false} />
      </div>
      <ul className="flex flex-col gap-3">
        {sorted.map((n) => (
          <li key={n.venue.id}>
            <Link href={`/${n.citySlug}/${n.venue.slug}`} className="flex items-center gap-4 rounded-2xl border-[1.5px] border-line bg-white p-4 transition hover:border-ink">
              <ScoreBadge score={n.score} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-xl font-extrabold">{n.venue.name}</span>
                <span className="block truncate text-sm text-stone">{n.venue.address?.replace(/,\s*(Spain|España)$/i, '')}</span>
              </span>
              <span className="flex-none text-sm font-bold text-bottle">{formatDistance(n.d)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
