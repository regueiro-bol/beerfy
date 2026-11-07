import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPlaceLocation } from '@/lib/google/place-live'

/**
 * Cron diario (vercel.json). Refresca las coordenadas de origen Google antes de que
 * superen los 30 días de caché permitidos por los términos de Google Maps Platform.
 * Las coordenadas 'manual' (verificadas por el equipo) no se tocan.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const limitDate = new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('venues')
    .select('id, google_place_id, coords_updated_at')
    .eq('coords_source', 'google')
    .not('google_place_id', 'is', null)
    .or(`coords_updated_at.is.null,coords_updated_at.lt.${limitDate}`)
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let refreshed = 0
  let cleared = 0
  for (const v of (data || []) as Array<{ id: string; google_place_id: string }>) {
    const loc = await getPlaceLocation(v.google_place_id)
    // Si Google no devuelve ubicación, se borra la caché caducada en lugar de conservarla.
    const { error: upErr } = await supabase
      .from('venues')
      .update(
        loc
          ? { latitude: loc.lat, longitude: loc.lng, coords_updated_at: new Date().toISOString() }
          : { latitude: null, longitude: null, coords_updated_at: new Date().toISOString() }
      )
      .eq('id', v.id)
    if (!upErr) {
      if (loc) refreshed++
      else cleared++
    }
  }

  return NextResponse.json({ checked: data?.length ?? 0, refreshed, cleared })
}
