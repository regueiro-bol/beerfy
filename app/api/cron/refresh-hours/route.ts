import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPlaceHours } from '@/lib/google/place-live'
import { opsAuthorized } from '@/lib/ops/auth'

export const maxDuration = 300

/**
 * Cron diario (vercel.json): guarda el horario semanal de cada bar publicado para que la app
 * y la web calculen «Abierto ahora» sin llamar a Google en cada visita (una consulta por bar al día).
 * Google permite guardar este dato como caché hasta 30 días; se refresca a diario.
 */
export async function GET(request: Request) {
  if (!opsAuthorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const dayAgo = new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('venues')
    .select('id, google_place_id')
    .eq('status', 'published')
    .not('google_place_id', 'is', null)
    .or(`opening_hours_updated_at.is.null,opening_hours_updated_at.lt.${dayAgo}`)
    .limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let withHours = 0
  let withoutHours = 0
  let failed = 0
  for (const v of (data || []) as Array<{ id: string; google_place_id: string }>) {
    const h = await getPlaceHours(v.google_place_id)
    if (!h) {
      failed++
      continue
    }
    const { error: upErr } = await supabase
      .from('venues')
      .update({ opening_periods: h.periods, opening_hours_updated_at: new Date().toISOString() })
      .eq('id', v.id)
    if (upErr) failed++
    else if (h.periods) withHours++
    else withoutHours++
  }
  return NextResponse.json({ checked: data?.length ?? 0, withHours, withoutHours, failed })
}
