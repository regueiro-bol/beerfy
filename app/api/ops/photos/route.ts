import { NextResponse } from 'next/server'
import { opsAuthorized } from '@/lib/ops/auth'
import { deletePhotoChecks } from '@/lib/verification/photo'
import { createServiceClient } from '@/lib/supabase/service'

/** Solo equipo: borrar fotos de verificación por id. POST { delete: string[] } */
export async function POST(req: Request) {
  if (!opsAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { delete?: unknown; deleteRatings?: unknown }
  const ratingIds = Array.isArray(body.deleteRatings)
    ? body.deleteRatings.filter((x): x is string => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 20)
    : []
  if (ratingIds.length) {
    // Notas de prueba: borra sus fotos de caña (archivos y filas) y la nota.
    const supabase = createServiceClient()
    const { data: photos } = await supabase.from('rating_photos').select('storage_path').in('rating_id', ratingIds)
    const paths = (photos || []).map((p) => p.storage_path as string)
    if (paths.length) {
      const { error } = await supabase.storage.from('verificaciones').remove(paths)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await supabase.from('rating_photos').delete().in('rating_id', ratingIds)
    const { count, error } = await supabase.from('ratings').delete({ count: 'exact' }).in('id', ratingIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deletedRatings: count, deletedPhotos: paths.length })
  }
  const ids = Array.isArray(body.delete) ? body.delete.filter((x): x is string => typeof x === 'string').slice(0, 100) : []
  try {
    return NextResponse.json({ deleted: await deletePhotoChecks(ids) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
