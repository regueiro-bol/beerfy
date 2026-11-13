'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { shrink } from '@/lib/client/shrink-image'

/** Subir una portada propia (se reduce en el navegador antes de enviarla). */
export function CoverUpload({ venueId }: { venueId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function upload(file: File | null) {
    if (!file) return
    setBusy(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('photo', await shrink(file), 'portada.jpg')
      const r = await fetch(`/api/admin/venues/${venueId}/cover`, { method: 'POST', body: fd })
      const j = (await r.json()) as { ok?: boolean; error?: string }
      if (!r.ok || !j.ok) setMsg(j.error ?? 'No se ha podido subir')
      else {
        setMsg('Portada actualizada')
        router.refresh()
      }
    } catch {
      setMsg('No se ha podido subir')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
        {busy ? 'Subiendo…' : 'Subir foto nueva'}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0] ?? null)} />
      </label>
      {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
    </div>
  )
}
