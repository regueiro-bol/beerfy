'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export type RateState = { ok: boolean; error?: string; score?: number }

const KEYS = ['score_temperature', 'score_foam', 'score_glass', 'score_freshness'] as const

function hashIp(ip: string) {
  const salt = process.env.RATING_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'beerfy'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export async function submitRating(_prev: RateState, formData: FormData): Promise<RateState> {
  // Campo trampa para bots.
  if (typeof formData.get('website') === 'string' && (formData.get('website') as string).trim()) return { ok: true }

  const venueId = String(formData.get('venue_id') || '')
  const path = String(formData.get('path') || '')
  const scores: Record<string, number> = {}
  for (const k of KEYS) {
    const n = Number(formData.get(k))
    if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, error: 'Puntúa los cuatro criterios.' }
    scores[k] = n
  }
  const comment = String(formData.get('comment') || '').trim().slice(0, 500) || null

  const h = await headers()
  const ip = (h.get('x-forwarded-for') || '').split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const ipHash = hashIp(ip)
  const supabase = createServiceClient()

  const { data: venue } = await supabase.from('venues').select('id, status').eq('id', venueId).maybeSingle()
  if (!venue || venue.status !== 'published') return { ok: false, error: 'Este bar no está disponible.' }

  // Límite: una puntuación por bar y persona cada 24 h, y como mucho 15 al día en total.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count: sameVenue } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('venue_id', venueId)
    .gte('created_at', since)
  if ((sameVenue ?? 0) > 0) return { ok: false, error: 'Ya has puntuado este bar hoy. ¡Vuelve otro día!' }
  const { count: total } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since)
  if ((total ?? 0) >= 15) return { ok: false, error: 'Has alcanzado el límite diario de puntuaciones.' }

  const avg = (scores.score_temperature! + scores.score_foam! + scores.score_glass! + scores.score_freshness!) / 4
  const { error } = await supabase.from('ratings').insert({
    venue_id: venueId,
    rating: Math.round(avg),
    ...scores,
    comment,
    ip_hash: ipHash,
    user_agent: (h.get('user-agent') || '').slice(0, 300),
    status: 'visible',
  })
  if (error) {
    console.error('Error saving rating:', error)
    return { ok: false, error: 'No hemos podido guardar tu nota. Inténtalo de nuevo.' }
  }

  if (path.startsWith('/')) revalidatePath(path)
  return { ok: true, score: avg * 2 }
}
