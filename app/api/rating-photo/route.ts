import { submitRatingPhoto } from '@/lib/verification/pour'
import { clientHashFrom, json, preflight } from '@/lib/app/http'
import { readPhotoRequest } from '@/lib/app/photo-request'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Foto de la caña de una nota: «servida» (recién tirada) o «encaje» (a medio beber). Web: multipart; app: JSON base64. */
export async function POST(req: Request) {
  const r = await readPhotoRequest(req)
  if (!r) return json({ ok: false, message: 'Petición no válida.' }, { status: 400 })
  if (!r.photo) return json({ ok: false, message: 'Falta la foto.' }, { status: 400 })
  if (r.photo.byteLength > 4 * 1024 * 1024) return json({ ok: false, message: 'La foto es demasiado grande.' }, { status: 413 })
  const ratingId = r.fields.rating_id ?? ''
  const kind = r.fields.kind ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(ratingId) || !['servida', 'encaje'].includes(kind)) return json({ ok: false, message: 'Petición no válida.' }, { status: 400 })
  const takenAt = Number(r.fields.taken_at)
  const res = await submitRatingPhoto({
    file: r.photo,
    ratingId,
    kind: kind as 'servida' | 'encaje',
    takenAt: Number.isFinite(takenAt) && takenAt > 0 ? takenAt : null,
    token: r.fields.token ?? '',
    clientHash: clientHashFrom(req),
  })
  return json(res, { status: res.ok ? 200 : 422 })
}

export const OPTIONS = preflight
