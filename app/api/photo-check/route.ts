import { submitPhotoCheck } from '@/lib/verification/photo'
import { clientHashFrom, json, preflight } from '@/lib/app/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_BYTES = 4 * 1024 * 1024

/** Foto del tanque o del grifo de bodega para verificar un bar (web y app). multipart/form-data. */
export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json({ ok: false, message: 'Petición no válida.' }, { status: 400 })
  }
  const photo = form.get('photo')
  if (!(photo instanceof Blob) || photo.size === 0) return json({ ok: false, message: 'Falta la foto.' }, { status: 400 })
  if (photo.size > MAX_BYTES) return json({ ok: false, message: 'La foto es demasiado grande. Prueba con otra.' }, { status: 413 })
  if (photo.type && !/^image\/(jpeg|png|webp|heic|heif)$/.test(photo.type)) return json({ ok: false, message: 'Formato de imagen no válido.' }, { status: 415 })

  const str = (k: string) => (typeof form.get(k) === 'string' ? (form.get(k) as string) : '')
  const uuid = (v: string) => (/^[0-9a-f-]{36}$/i.test(v) ? v : null)
  const res = await submitPhotoCheck({
    file: await photo.arrayBuffer(),
    venueId: uuid(str('venue_id')),
    suggestionId: uuid(str('suggestion_id')),
    lat: Number(str('lat')),
    lng: Number(str('lng')),
    acc: Number(str('acc')),
    clientHash: clientHashFrom(req),
  })
  return json(res, { status: res.ok || res.status === 'rechazada' ? 200 : 422 })
}

export const OPTIONS = preflight
