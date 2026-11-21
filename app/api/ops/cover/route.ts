import { NextResponse } from 'next/server'
import { opsAuthorized } from '@/lib/ops/auth'
import { saveVenueCover } from '@/lib/venues/cover'

export const maxDuration = 60

/** Solo equipo (clave de operaciones): portada de un bar a partir de una foto. multipart: venue_id, photo. */
export async function POST(req: Request) {
  if (!opsAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const form = await req.formData().catch(() => null)
  const id = String(form?.get('venue_id') || '')
  const photo = form?.get('photo')
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(photo instanceof Blob) || photo.size === 0) return NextResponse.json({ error: 'Petición no válida' }, { status: 400 })
  if (photo.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'La foto es demasiado grande' }, { status: 413 })
  const r = await saveVenueCover(id, await photo.arrayBuffer())
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: r.status })
}
