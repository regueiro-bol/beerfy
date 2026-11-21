import { NextResponse } from 'next/server'
import { saveVenueCover } from '@/lib/venues/cover'

export const maxDuration = 60

/** Admin (protegido por la autenticación del proxy en /api/admin): sube una portada propia del bar. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bar no válido' }, { status: 400 })
  const form = await req.formData().catch(() => null)
  const photo = form?.get('photo')
  if (!(photo instanceof Blob) || photo.size === 0) return NextResponse.json({ error: 'Falta la foto' }, { status: 400 })
  if (photo.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'La foto es demasiado grande' }, { status: 413 })
  const r = await saveVenueCover(id, await photo.arrayBuffer())
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: r.status })
}
