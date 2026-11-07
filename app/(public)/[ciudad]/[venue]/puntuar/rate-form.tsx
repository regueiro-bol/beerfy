'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { submitRating, type RateState } from './actions'

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
  const done = Object.values(v).every((x) => x > 0)
  const filled = Object.values(v).filter((x) => x > 0)
  const score = filled.length ? (filled.reduce((a, b) => a + b, 0) / filled.length) * 2 : 0
  const fillY = 132 - (98 * score) / 10
  const foamH = 6 + v.score_foam * 3

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-5 rounded-[32px] bg-bottle p-8 text-cream md:p-12">
        <p className="font-display text-[44px] font-extrabold leading-none">¡Gracias!</p>
        <p className="text-lg text-sand">
          Tu nota para {venueName}: <strong className="text-amber">{state.score?.toFixed(1).replace('.', ',')}</strong>. Ya cuenta en la Nota de tirada.
        </p>
        <Link href={path} className="rounded-full bg-amber px-6 py-3.5 font-bold text-ink">Volver a la ficha</Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="venue_id" value={venueId} />
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

      {state.error && (
        <p role="alert" className="rounded-2xl bg-[#FBE3DC] px-4 py-3 text-[15px] font-medium text-[#8A2A12]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={!done || pending}
        className="h-[58px] rounded-[18px] bg-amber text-[17px] font-extrabold text-ink transition hover:brightness-95 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : done ? `Enviar mi nota · ${score.toFixed(1).replace('.', ',')}` : 'Puntúa los cuatro criterios'}
      </button>
      <p className="text-xs text-stone">Sin registro. Una nota por bar y persona al día. Las notas que incumplan las normas pueden ocultarse.</p>
    </form>
  )
}
