import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { autoValidateSuggestion } from '@/lib/venues/auto-validate'

// Hash (no el token) del token de operación. Alternativa: CRON_SECRET en Vercel.
const OPS_TOKEN_SHA256 = '061a476b747a5fe4933e8ccb3447de31ba17ea0536e73e8078e2ff591f8f253e'

function authorized(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return false
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true
  return createHash('sha256').update(token).digest('hex') === OPS_TOKEN_SHA256
}

/** Valida automáticamente todas las sugerencias pendientes. */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = createServiceClient()
  const { data } = await supabase.from('venue_suggestions').select('id').eq('status', 'pending').order('created_at').limit(25)
  const results = []
  for (const s of data || []) results.push(await autoValidateSuggestion(s.id))
  return NextResponse.json({ results })
}
