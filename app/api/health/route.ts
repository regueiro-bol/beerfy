import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { embedText } from '@/lib/voyage/embeddings'

const OPS_TOKEN_SHA256 = '061a476b747a5fe4933e8ccb3447de31ba17ea0536e73e8078e2ff591f8f253e'

/** Las comprobaciones de pago (Claude, Voyage, Google) solo se lanzan con token de operación. */
function deepAllowed(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return false
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true
  return createHash('sha256').update(token).digest('hex') === OPS_TOKEN_SHA256
}

export async function GET(req: Request) {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('cities').select('id', { head: true, count: 'exact' })
    checks.supabase = { ok: !error, detail: error?.message }
  } catch (e) {
    checks.supabase = { ok: false, detail: (e as Error).message }
  }

  if (deepAllowed(req)) {
    try {
      const r = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Responde solo con la palabra: pong' }],
      })
      const text = r.content[0]?.type === 'text' ? r.content[0].text.toLowerCase() : ''
      checks.anthropic = { ok: text.includes('pong'), detail: text }
    } catch (e) {
      checks.anthropic = { ok: false, detail: (e as Error).message }
    }
    try {
      const emb = await embedText('Bar de prueba con cerveza de bodega')
      checks.voyage = { ok: Array.isArray(emb) && emb.length > 0, detail: `dim=${emb.length}` }
    } catch (e) {
      checks.voyage = { ok: false, detail: (e as Error).message }
    }
    try {
      const key = process.env.GOOGLE_MAPS_API_KEY
      if (!key) throw new Error('GOOGLE_MAPS_API_KEY no definida')
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id' },
        body: JSON.stringify({ textQuery: 'bar Ourense', pageSize: 1 }),
        cache: 'no-store',
      })
      const body = res.ok ? '' : (await res.text()).slice(0, 160)
      checks.google_places = { ok: res.ok, detail: res.ok ? 'ok' : `${res.status} ${body}` }
    } catch (e) {
      checks.google_places = { ok: false, detail: (e as Error).message }
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  return NextResponse.json({ ok: allOk, region: process.env.VERCEL_REGION ?? null, checks }, { status: allOk ? 200 : 503 })
}
