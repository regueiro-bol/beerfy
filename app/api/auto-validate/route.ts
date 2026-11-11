import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { autoValidateSuggestion, publishProvisional } from '@/lib/venues/auto-validate'
import { opsAuthorized as authorized } from '@/lib/ops/auth'

/** Valida automáticamente todas las sugerencias pendientes. */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = createServiceClient()
  const { data } = await supabase.from('venue_suggestions').select('id').eq('status', 'pending').order('created_at').limit(25)
  const provisional = new URL(req.url).searchParams.get('provisional') === '1'
  const results = []
  for (const s of data || []) {
    results.push(provisional ? await publishProvisional(s.id) : await autoValidateSuggestion(s.id))
    if (provisional) await new Promise((r) => setTimeout(r, 1100)) // política de uso de Nominatim
  }
  return NextResponse.json({ results })
}
