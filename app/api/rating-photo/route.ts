import { submitRatingPhoto } from '@/lib/verification/pour'
import { clientHashFrom, json, preflight } from '@/lib/app/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Foto de la caña de una nota: «servida» (recién tirada) o «encaje» (a medio beber). Web y app. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) return json({ ok: false, message: 'Petición no válida.' }, { status: 400 })
  const photo = form.get('photo')
  if (!(photo instanceof Blob) || photo.size === 0) return json({ ok: false, message: 'Falta la foto.' }, { status: 400 })
  if (photo.size > 4 * 1024 * 1024) return json({ ok: false, message: 'La foto es demasiado grande.' }, { status: 413 })
  const ratingId = String(form.get('rating_id') || '')
  const kind = String(form.get('kind') || '')
  if (!/^[0-9a-f-]{36}$/i.test(ratingId) || !['servida', 'encaje'].includes(kind)) return json({ ok: false, message: 'Petición no válida.' }, { status: 400 })
  const takenAt = Number(form.get('taken_at'))
  const res = await submitRatingPhoto({
    file: await photo.arrayBuffer(),
    ratingId,
    kind: kind as 'servida' | 'encaje',
    takenAt: Number.isFinite(takenAt) && takenAt > 0 ? takenAt : null,
    token: String(form.get('token') || ''),
    clientHash: clientHashFrom(req),
  })
  return json(res, { status: res.ok ? 200 : 422 })
}

export const OPTIONS = preflight
