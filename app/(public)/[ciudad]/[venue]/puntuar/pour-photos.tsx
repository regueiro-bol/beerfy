'use client'

import { useEffect, useRef, useState } from 'react'
import { shrink } from '@/lib/client/shrink-image'
import { track } from '@/lib/analytics'

export type Served = { file: File; takenAt: number; preview: string }

async function upload(file: File, takenAt: number, ratingId: string, token: string, kind: 'servida' | 'encaje') {
  const fd = new FormData()
  fd.append('photo', await shrink(file), `${kind}.jpg`)
  fd.append('rating_id', ratingId)
  fd.append('token', token)
  fd.append('kind', kind)
  fd.append('taken_at', String(takenAt))
  const r = await fetch('/api/rating-photo', { method: 'POST', body: fd })
  const j = (await r.json().catch(() => null)) as { ok: boolean; message: string } | null
  track('pour_photo', { kind, ok: !!j?.ok })
  return j ?? { ok: false, message: 'No hemos podido enviar la foto.' }
}

/** Paso 1 del formulario: foto de la caña nada más servirla (opcional). */
export function ServedPhotoPicker({ value, onChange }: { value: Served | null; onChange: (s: Served | null) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] border-[1.5px] border-dashed border-sand bg-white p-5">
      <div>
        <p className="font-display text-[22px] font-extrabold">
          Foto de la caña recién servida <span className="font-sans text-sm font-normal text-stone">(opcional)</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-stone">
          Hazla en cuanto te la pongan, antes del primer trago: la espuma lo dice todo. Luego cátala y puntúa.
        </p>
      </div>
      {value ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.preview} alt="Tu caña" className="h-28 w-20 rounded-xl object-cover" />
          <button type="button" onClick={() => onChange(null)} className="text-sm font-semibold text-stone underline">
            Quitar foto
          </button>
        </div>
      ) : (
        <label className="inline-flex h-12 cursor-pointer items-center justify-center self-start rounded-2xl bg-ink px-5 font-bold text-cream">
          Hacer foto de la caña
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onChange({ file: f, takenAt: f.lastModified || Date.now(), preview: URL.createObjectURL(f) })
            }}
          />
        </label>
      )}
    </div>
  )
}

/** Tras puntuar: sube la foto de la caña servida y ofrece la del encaje de Bruselas. */
export function PourPhotoUploads({ ratingId, token, served }: { ratingId: string; token: string; served: Served | null }) {
  const [servedMsg, setServedMsg] = useState<string | null>(null)
  const [laceMsg, setLaceMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const sent = useRef(false)

  useEffect(() => {
    if (!served || sent.current) return
    sent.current = true
    upload(served.file, served.takenAt, ratingId, token, 'servida').then((r) => setServedMsg(r.message))
  }, [served, ratingId, token])

  return (
    <div className="flex flex-col gap-3 rounded-[24px] bg-cream/10 p-5">
      {served ? <p className="text-sm text-sand">{servedMsg ?? 'Enviando la foto de tu caña…'}</p> : null}
      <p className="font-display text-[22px] font-extrabold text-cream">¿Vas por la mitad? Enséñanos el encaje</p>
      <p className="text-sm leading-relaxed text-sand">
        Los aros de espuma que quedan en el vaso con cada trago (el «encaje de Bruselas») delatan un vaso limpio y una buena cerveza. Haz la foto cuando vayas por la mitad.
      </p>
      {laceMsg ? (
        <p className="font-semibold text-amber">{laceMsg}</p>
      ) : (
        <label className="inline-flex h-12 cursor-pointer items-center justify-center self-start rounded-2xl bg-amber px-5 font-bold text-ink">
          {busy ? 'Enviando…' : 'Foto del encaje'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setBusy(true)
              const r = await upload(f, f.lastModified || Date.now(), ratingId, token, 'encaje')
              setBusy(false)
              setLaceMsg(r.message)
            }}
          />
        </label>
      )}
      <p className="text-xs text-sand/80">Las fotos no se publican: solo las ve el equipo de Beerfy.</p>
    </div>
  )
}
