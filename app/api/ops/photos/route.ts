import { NextResponse } from 'next/server'
import { opsAuthorized } from '@/lib/ops/auth'
import { deletePhotoChecks } from '@/lib/verification/photo'

/** Solo equipo: borrar fotos de verificación por id. POST { delete: string[] } */
export async function POST(req: Request) {
  if (!opsAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { delete?: unknown }
  const ids = Array.isArray(body.delete) ? body.delete.filter((x): x is string => typeof x === 'string').slice(0, 100) : []
  try {
    return NextResponse.json({ deleted: await deletePhotoChecks(ids) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
