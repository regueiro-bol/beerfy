import { createServiceClient } from '@/lib/supabase/service'
import { json, preflight, readJson } from '@/lib/app/http'

export const dynamic = 'force-dynamic'

const PREF_KEYS = ['new_nearby', 'saved_changes', 'passing_by', 'bodega'] as const

/** Guarda (o borra) el token de avisos de la app y qué avisos quiere recibir. */
export async function POST(req: Request) {
  const body = await readJson(req)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  if (!/^ExponentPushToken\[[A-Za-z0-9_-]{10,80}\]$/.test(token)) return json({ ok: false, error: 'Token no válido.' }, { status: 400 })
  const supabase = createServiceClient()

  if (body?.enabled === false) {
    await supabase.from('app_push_tokens').delete().eq('token', token)
    return json({ ok: true })
  }

  const raw = (body?.prefs && typeof body.prefs === 'object' ? body.prefs : {}) as Record<string, unknown>
  const prefs: Record<string, boolean> = {}
  for (const k of PREF_KEYS) prefs[k] = raw[k] === true
  const platform = body?.platform === 'ios' || body?.platform === 'android' ? body.platform : null
  const city = typeof body?.city_slug === 'string' ? body.city_slug.slice(0, 64) : null
  const saved = Array.isArray(body?.saved) ? (body.saved as unknown[]).filter((x) => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 200) : []

  const { error } = await supabase
    .from('app_push_tokens')
    .upsert({ token, platform, prefs, city_slug: city, saved_venue_ids: saved, updated_at: new Date().toISOString() }, { onConflict: 'token' })
  if (error) {
    console.error('Error saving push token:', error)
    return json({ ok: false, error: 'No hemos podido guardar tus avisos.' }, { status: 500 })
  }
  return json({ ok: true })
}

export const OPTIONS = preflight
