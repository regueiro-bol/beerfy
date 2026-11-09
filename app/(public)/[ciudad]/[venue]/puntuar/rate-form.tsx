'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { submitRating, type RateState } from './actions'
import { ShareSheet } from '@/components/share/share-sheet'
import { SITE_URL } from '@/lib/site'
import { track } from '@/lib/analytics'

const CRITERIA = [
  { key: 'score_temperature', n: '01', name: 'Temperatura', hint: 'Fría, pero que sepa', tint: 'bg-bottle text-cream' },
  { key: 'score_foam', n: '02', name: 'Espuma', hint: 'Dos dedos, cremosa y que aguante', tint: 'bg-[#FFF8E6] text-ink' },
  { key: 'score_glass', n: '03', name: 'Vaso', hint: 'Limpio, frío y enjuagado', tint: 'bg-amber text-ink' },
  { key: 'score_freshness', n: '04', name: 'Frescura', hint: '¿Sabe a recién llegada del tanque?', tint: 'bg-copper text-ink' },
] as const
const LABELS = ['Mal', 'Flojo', 'Bien', 'Muy bien', 'Top']

type Key = (typeof CRITERIA)[number]['key']

export function RateForm({ venueId, venueName, path }: { venueId: string; venueName: string; path: string }) {
  const [state, action, pending] = useActionState<RateState, FormData>(submitRating, { ok: false })
  const [v, setV] = useState<Record<Key, number>>({ score_temperature: 0, score_foam: 0, score_glass: 0, score_freshness: 0 })
  const [geo, setGeo] = useState<'idle' | 'locating' | 'error'>('idle')
  const [geoMsg, setGeoMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const latRef = useRef<HTMLInputElement>(null)
  const lngRef = useRef<HTMLInputElement>(null)
  const accRef = useRef<HTMLInputElement>(null)
  const done = Object.values(v).every((x) => x > 0)

  useEffect(() => {
    const item_id = path.split('/').pop()
    if (state.ok) track('rate_submit', { item_id, score: state.score ?? null, pending: !!state.pending })
    else if (state.error) track('rate_error', { item_id, reason: state.error.slice(0, 60) })
  }, [state, path])

  function locateAndSubmit() {
    if (!('geolocation' in navigator)) {
      setGeo('error')
      setGeoMsg('Tu navegador no permite comprobar la ubicación, así que no podemos verificar la nota.')
      return
    }
    setGeo('locating')
    setGeoMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (latRef.current) latRef.current.value = String(pos.coords.latitude)
        if (lngRef.current) lngRef.current.value = String(pos.coords.longitude)
        if (accRef.current) accRef.current.value = String(Math.round(pos.coords.accuracy))
        setGeo('idle')
        formRef.current?.requestSubmit()
      },
      (err) => {
        track('rate_error', { reason: err.code === err.PERMISSION_DENIED ? 'geo_denied' : 'geo_unavailable', item_id: path.split('/').pop() })
        setGeo('error')
        setGeoMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Sin permiso de ubicación no podemos comprobar que estás en el bar. Actívalo en los ajustes del navegador para esta web y vuelve a intentarlo.'
            : 'No hemos podido obtener tu ubicación. Comprueba que el GPS está activado e inténtalo de nuevo.'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }
  const filled = Object.values(v).filter((x) => x > 0)
  const score = filled.length ? (filled.reduce((a, b) => a + b, 0) / filled.length) * 2 : 0
  const fillY = 132 - (98 * score) / 10
  const foamH = 6 + v.score_foam * 3

  if (state.ok) {
    const score = (state.score ?? 0).toFixed(1).replace('.', ',')
    const story = state.ratingId ? `/api/card/tirada/${state.ratingId}` : null
    return (
      <div className="flex flex-col gap-6 rounded-[32px] bg-ink p-7 text-cream md:flex-row md:items-center md:gap-10 md:p-12">
        <div className="flex flex-1 flex-col gap-4">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-amber">¡Gracias!</p>
          <p className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-0.03em]">
            Tu tirada en {venueName}: <span className="text-amber">{score}</span>
          </p>
          <p className="text-[15px] text-sand">{state.pending ? 'La revisaremos antes de publicarla.' : 'Ya cuenta en la Nota de tirada.'}</p>
          {story && (
            <div className="hidden md:block">
              <ShareSheet
                url={`${SITE_URL}${path}`}
                title={venueName}
                text={`Mi tirada en ${venueName}: ${score} de 10. ¿Y a ti, cómo te la tiran?`}
                storyImg={story}
                fileBase={`mi-tirada-${path.split('/').pop()}`}
                heading="Comparte tu tirada"
                sub="Tu nota y tus criterios en una historia lista para subir."
                campaign="tirada"
                trigger="tirada"
              />
            </div>
          )}
          <Link href={path} className="hidden self-start rounded-full border-[1.5px] border-cream/40 px-6 py-3 font-semibold md:inline-block">
            Volver a la ficha
          </Link>
        </div>
        {story && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story}
            alt={`Historia «Mi tirada» en ${venueName} con nota ${score}`}
            className="mx-auto w-[210px] -rotate-3 rounded-[18px] shadow-[0_30px_50px_-20px_rgba(0,0,0,.8)] md:w-[240px]"
          />
        )}
        <div className="flex flex-col gap-2.5 md:hidden">
          {story && (
            <ShareSheet
              url={`${SITE_URL}${path}`}
              title={venueName}
              text={`Mi tirada en ${venueName}: ${score} de 10. ¿Y a ti, cómo te la tiran?`}
              storyImg={story}
              fileBase={`mi-tirada-${path.split('/').pop()}`}
              heading="Comparte tu tirada"
              sub="Tu nota y tus criterios en una historia lista para subir."
              campaign="tirada"
              trigger="tirada"
            />
          )}
          <Link href={path} className="flex h-12 items-center justify-center rounded-[18px] border-[1.5px] border-cream/40 font-semibold">
            Volver a la ficha
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-8">
      <input type="hidden" name="venue_id" value={venueId} />
      <input ref={latRef} type="hidden" name="geo_lat" defaultValue="" />
      <input ref={lngRef} type="hidden" name="geo_lng" defaultValue="" />
      <input ref={accRef} type="hidden" name="geo_acc" defaultValue="" />
      <input type="hidden" name="path" value={path} />
      <div className="hidden" aria-hidden="true">
        <label>No rellenar<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="flex items-center gap-5 rounded-[28px] bg-ink p-5 text-cream md:p-6">
        <svg viewBox="0 0 104 140" width="78" height="105" role="img" aria-label={`Vaso lleno según tu nota: ${score.toFixed(1)}`}>
          <defs>
            <clipPath id="pg"><path d="M14 34 L90 34 L82 132 L22 132 Z" /></clipPath>
            <linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F7C858" /><stop offset="1" stopColor="#C9761A" /></linearGradient>
          </defs>
          <g clipPath="url(#pg)">
            <rect x="0" y={fillY} width="104" height="140" fill="url(#pb)" style={{ transition: 'y .4s' }} />
            {score > 0 && <rect x="0" y={fillY - foamH + 4} width="104" height={foamH} fill="#FFF8E6" style={{ transition: 'all .4s' }} />}
          </g>
          <path d="M14 34 L90 34 L82 132 L22 132 Z" fill="none" stroke="#F6F1E4" strokeOpacity="0.6" strokeWidth="2.5" />
        </svg>
        <div>
          <p className="text-sm text-sand">Tu Nota de tirada</p>
          <p className="font-display text-[56px] font-extrabold leading-none text-amber" aria-live="polite">
            {score ? score.toFixed(1).replace('.', ',') : '–'}
          </p>
        </div>
      </div>

      {CRITERIA.map((c) => (
        <fieldset key={c.key} className="flex flex-col gap-3">
          <legend className="mb-3 flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl font-display text-[15px] font-extrabold ${c.tint}`}>{c.n}</span>
            <span>
              <strong className="font-display text-[22px]">{c.name}</strong>
              <br />
              <span className="text-sm text-stone">{c.hint}</span>
            </span>
          </legend>
          <input type="hidden" name={c.key} value={v[c.key] || ''} />
          <div className="grid grid-cols-5 gap-1.5">
            {LABELS.map((l, i) => {
              const on = v[c.key] === i + 1
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setV((s) => ({ ...s, [c.key]: i + 1 }))}
                  className={`h-[52px] rounded-[14px] border-[1.5px] text-[13px] font-bold transition ${
                    on ? 'border-ink bg-ink text-amber' : 'border-[#CFC9BC] bg-white text-[#16140F] hover:border-ink'
                  }`}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-col gap-2">
        <label htmlFor="comment" className="font-display text-[22px] font-extrabold">
          Un comentario <span className="font-sans text-sm font-normal text-stone">(opcional)</span>
        </label>
        <textarea id="comment" name="comment" rows={3} maxLength={500} placeholder="¿Qué tal la espuma? ¿Y el vaso?" className="resize-none rounded-2xl border-[1.5px] border-[#CFC9BC] bg-white px-4 py-3 text-base outline-none focus:border-ink" />
        <p className="text-xs text-stone">Se publica junto a tu nota, de forma anónima.</p>
      </div>

      {geo === 'error' && geoMsg && (
        <p role="alert" className="rounded-2xl bg-[#FBE3DC] px-4 py-3 text-[15px] font-medium text-[#8A2A12]">{geoMsg}</p>
      )}
      {state.error && geo !== 'error' && (
        <p role="alert" className="rounded-2xl bg-[#FBE3DC] px-4 py-3 text-[15px] font-medium text-[#8A2A12]">{state.error}</p>
      )}

      <button
        type="button"
        onClick={locateAndSubmit}
        disabled={!done || pending || geo === 'locating'}
        className="h-[58px] rounded-[18px] bg-amber text-[17px] font-extrabold text-ink transition hover:brightness-95 disabled:opacity-50"
      >
        {geo === 'locating' ? 'Comprobando que estás en el bar…' : pending ? 'Enviando…' : done ? `Enviar mi nota · ${score.toFixed(1).replace('.', ',')}` : 'Puntúa los cuatro criterios'}
      </button>
      <p className="text-xs leading-relaxed text-stone">
        Solo se puntúa desde el bar: al enviar te pediremos la ubicación para comprobar que estás allí. No la guardamos. Sin registro, una nota por bar y
        persona al día.{' '}
        <Link href="/como-puntuamos" className="underline underline-offset-2">Cómo funcionan las notas</Link>
      </p>
    </form>
  )
}
