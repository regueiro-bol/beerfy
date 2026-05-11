import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { embedText } from '@/lib/voyage/embeddings'

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('_health').select('*').limit(1)
    checks.supabase = { ok: error?.code === '42P01' || !error, detail: error?.message }
  } catch (e) {
    checks.supabase = { ok: false, detail: (e as Error).message }
  }
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
    const emb = await embedText('Bar de prueba con Estrella Galicia de bodega')
    checks.voyage = { ok: Array.isArray(emb) && emb.length > 0, detail: `dim=${emb.length}` }
  } catch (e) {
    checks.voyage = { ok: false, detail: (e as Error).message }
  }
  const allOk = Object.values(checks).every(c => c.ok)
  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 503 })
}
