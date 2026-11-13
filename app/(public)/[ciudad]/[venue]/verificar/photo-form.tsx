'use client'

import Link from 'next/link'
import { useState } from 'react'
import { track } from '@/lib/analytics'
import { shrink } from '@/lib/client/shrink-image'

type Result = { ok: boolean; status?: 'confirmada' | 'revisar' | 'rechazada'; message: string }

export function PhotoForm({ venueId, venueName, path }: { venueId: string; venueName: string; path: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [step, setStep] = useState<'idle' | 'locating' | 'sending'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const item_id = path.split('/').pop()

  function pick(f: File | null) {
    setFile(f)
    setError(null)
    setResult(null)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function send() {
    if (!file) return
    if (!('geolocation' in navigator)) {
      setError('Tu navegador no permite comprobar la ubicación, así que no podemos verificar la foto.')
      return
    }
    setStep('locating')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStep('sending')
        try {
          const fd = new FormData()
          fd.append('photo', await shrink(file), 'tanque.jpg')
          fd.append('venue_id', venueId)
          fd.append('lat', String(pos.coords.latitude))
          fd.append('lng', String(pos.coords.longitude))
          fd.append('acc', String(Math.round(pos.coords.accuracy)))
          const r = await fetch('/api/photo-check', { method: 'POST', body: fd })
          const json = (await r.json()) as Result
          setResult(json)
          track('photo_check', { item_id, status: json.status ?? 'error' })
          if (!json.ok && json.status !== 'rechazada') setError(json.message)
        } catch {
          setError('No hemos podido enviar la foto. Revisa tu conexión e inténtalo de nuevo.')
        } finally {
          setStep('idle')
        }
      },
      (err) => {
        setStep('idle')
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Sin permiso de ubicación no podemos comprobar que estás en el bar. Actívalo en los ajustes del navegador para esta web.'
            : 'No hemos podido obtener tu ubicación. Comprueba que el GPS está activado.'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  if (result && result.status !== 'rechazada' && result.ok) {
    return (
      <div className="flex flex-col gap-5 rounded-[28px] bg-ink p-7 text-cream">
        <p className="font-display text-[34px] font-extrabold leading-none">{result.status === 'confirmada' ? '¡Confirmado!' : '¡Gracias!'}</p>
        <p className="text-[17px] leading-relaxed text-sand">{result.message}</p>
        <Link href={path} className="inline-flex h-14 items-center justify-center rounded-2xl bg-amber px-6 font-bold text-ink">
          Volver a {venueName}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-2 text-[16px] leading-relaxed text-stone">
        <li>1. Haz una foto en la que se vea bien <strong className="text-ink">el tanque</strong> o <strong className="text-ink">el grifo con el rótulo de bodega</strong>.</li>
        <li>2. Envíala desde el bar: comprobamos con tu ubicación que estás allí.</li>
      </ol>

      <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[28px] border-2 border-dashed border-sand bg-white p-4 text-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Tu foto" className="max-h-[360px] rounded-2xl object-contain" />
        ) : (
          <>
            <span className="font-display text-[22px] font-extrabold">Hacer o elegir foto</span>
            <span className="text-sm text-stone">Del tanque o del grifo de bodega</span>
          </>
        )}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>

      {result?.status === 'rechazada' ? <p className="rounded-2xl bg-[#FBE3DC] p-4 font-semibold text-[#8A2A12]">{result.message}</p> : null}
      {error ? <p className="rounded-2xl bg-[#FBE3DC] p-4 font-semibold text-[#8A2A12]">{error}</p> : null}

      <button
        type="button"
        onClick={send}
        disabled={!file || step !== 'idle'}
        className="h-14 rounded-2xl bg-ink font-bold text-cream disabled:opacity-40"
      >
        {step === 'locating' ? 'Comprobando que estás en el bar…' : step === 'sending' ? 'Revisando la foto…' : 'Enviar foto'}
      </button>
      <p className="text-sm leading-relaxed text-stone">
        La foto solo la ve el equipo de Beerfy para verificar el bar: no se publica. Le quitamos la ubicación y los datos de la cámara. Una IA comprueba si se ve el tanque; si hay dudas, la revisa una persona.
      </p>
    </div>
  )
}
