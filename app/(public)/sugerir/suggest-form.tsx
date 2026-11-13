'use client'

import { useActionState, useEffect, useState } from 'react'
import { track } from '@/lib/analytics'
import { shrink } from '@/lib/client/shrink-image'
import { submitSuggestion, type SuggestState } from './actions'

type City = { id: string; name: string; slug: string }

const field =
  'w-full rounded-2xl border-[1.5px] border-[#CFC9BC] bg-white px-4 py-3.5 text-base text-[#16140F] outline-none focus:border-[#16140F]'

export function SuggestForm({ cities, defaultCity }: { cities: City[]; defaultCity?: string }) {
  const [state, action, pending] = useActionState<SuggestState, FormData>(submitSuggestion, { ok: false })
  const initialId = cities.find((c) => c.slug === defaultCity)?.id ?? ''
  const [cityId, setCityId] = useState(initialId)
  const [notify, setNotify] = useState(false)

  useEffect(() => {
    if (state.ok) track('suggest_submit', {})
  }, [state.ok])

  if (state.ok) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[28px] bg-bottle p-8 text-cream">
          <p className="font-display text-[36px] font-extrabold leading-tight">¡Gracias! Sugerencia recibida.</p>
          <p className="mt-3 text-lg text-sand">La revisaremos antes de publicar el bar. Si nos dejaste tu email, te avisaremos.</p>
        </div>
        {state.id ? <SuggestionPhoto suggestionId={state.id} /> : null}
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="hidden" aria-hidden="true">
        <label>
          No rellenar
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="venue_name" className="font-display text-lg font-bold">Nombre del bar</label>
        <input id="venue_name" name="venue_name" required maxLength={120} className={field} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="city_id" className="font-display text-lg font-bold">Ciudad</label>
        <select id="city_id" name="city_id" value={cityId} onChange={(e) => setCityId(e.target.value)} className={field}>
          <option value="">Elige una ciudad</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value="otra">Otra ciudad</option>
        </select>
      </div>

      {(cityId === 'otra' || cityId === '') && (
        <div className="flex flex-col gap-2">
          <label htmlFor="city_name" className="font-display text-lg font-bold">
            {cityId === 'otra' ? '¿Qué ciudad?' : 'O escribe la ciudad'}
          </label>
          <input id="city_name" name="city_name" maxLength={80} className={field} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="address" className="font-display text-lg font-bold">
          Dirección o zona <span className="font-sans text-sm font-normal text-stone">(opcional)</span>
        </label>
        <input id="address" name="address" maxLength={200} className={field} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="font-display text-lg font-bold">
          ¿Por qué lo recomiendas? <span className="font-sans text-sm font-normal text-stone">(opcional)</span>
        </label>
        <textarea id="notes" name="notes" rows={4} maxLength={1000} placeholder="Cómo la tiran, la espuma, el vaso…" className={`${field} resize-none`} />
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
        <input type="checkbox" name="notify" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-5 w-5 accent-[#134236]" />
        Avisadme cuando publiquéis el bar
      </label>
      {notify && (
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-display text-lg font-bold">Tu email</label>
          <input id="email" name="email" type="email" required maxLength={160} className={field} />
          <p className="text-xs text-stone">Solo lo usaremos para avisarte de este bar.</p>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-2xl bg-[#FBE3DC] px-4 py-3 text-[15px] font-medium text-[#8A2A12]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-2xl bg-amber px-6 py-4 text-[17px] font-extrabold text-ink transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? 'Enviando…' : 'Enviar sugerencia'}
      </button>
      <p className="text-xs text-stone">Revisamos cada sugerencia a mano antes de publicarla.</p>
    </form>
  )
}

/** Foto opcional del tanque para la sugerencia: acelera la verificación. */
function SuggestionPhoto({ suggestionId }: { suggestionId: string }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('photo', await shrink(file), 'tanque.jpg')
      fd.append('suggestion_id', suggestionId)
      const r = await fetch('/api/photo-check', { method: 'POST', body: fd })
      const json = (await r.json()) as { message: string; status?: string }
      setMsg(json.message)
      track('photo_check', { item_id: 'sugerencia', status: json.status ?? 'error' })
    } catch {
      setMsg('No hemos podido enviar la foto. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[24px] border-[1.5px] border-dashed border-sand bg-white p-6">
      <p className="font-display text-[22px] font-extrabold">¿Tienes una foto del tanque?</p>
      <p className="mt-1 text-[15px] text-stone">Si estás en el bar, una foto del tanque o del grifo de bodega nos ayuda a verificarlo antes. No se publica.</p>
      {msg ? (
        <p className="mt-4 font-semibold text-bottle">{msg}</p>
      ) : (
        <label className="mt-4 inline-flex h-12 cursor-pointer items-center rounded-2xl bg-ink px-5 font-bold text-cream">
          {busy ? 'Enviando…' : 'Añadir foto'}
          <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  )
}
