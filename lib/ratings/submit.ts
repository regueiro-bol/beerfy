import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

/** Lógica común para puntuar una tirada (web y app). */

export type RateInput = {
  venueId: string
  scores: Record<string, unknown>
  comment?: string | null
  lat: number
  lng: number
  acc?: number
}

export type RateResult = { ok: boolean; error?: string; score?: number; pending?: boolean; ratingId?: string }

export const RATING_KEYS = ['score_temperature', 'score_foam', 'score_glass', 'score_freshness'] as const

/** Radio base (m) alrededor del bar dentro del que se puede puntuar; se suma la precisión del GPS (máx. 150 m). */
const RADIUS_M = 120
/** Si un bar recibe más de estas notas en una hora, las siguientes quedan pendientes de revisión. */
const BURST_PER_HOUR = 6

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function hashClient(id: string) {
  const salt = process.env.RATING_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'beerfy'
  return createHash('sha256').update(`${salt}:${id}`).digest('hex')
}

/**
 * `clientHash`: huella anónima de quien puntúa (IP en la web; IP + identificador de instalación en la app).
 * Sirve para los límites diarios; la ubicación solo se usa para comprobar la distancia y no se guarda.
 */
export async function saveRating(input: RateInput, clientHash: string, userAgent: string): Promise<RateResult> {
  const scores: Record<string, number> = {}
  for (const k of RATING_KEYS) {
    const n = Number(input.scores[k])
    if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, error: 'Puntúa los cuatro criterios.' }
    scores[k] = n
  }
  const comment = String(input.comment || '').trim().slice(0, 500) || null

  const { lat, lng, acc } = input
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) {
    return { ok: false, error: 'Necesitamos comprobar que estás en el bar. Permite la ubicación e inténtalo de nuevo.' }
  }

  const supabase = createServiceClient()
  const { data: venue } = await supabase.from('venues').select('id, status, latitude, longitude').eq('id', input.venueId).maybeSingle()
  if (!venue || venue.status !== 'published') return { ok: false, error: 'Este bar no está disponible.' }
  if (venue.latitude === null || venue.longitude === null) {
    return { ok: false, error: 'Aún no tenemos la ubicación exacta de este bar, así que no podemos verificar tu nota.' }
  }
  const dist = distanceM({ lat, lng }, { lat: Number(venue.latitude), lng: Number(venue.longitude) })
  const allowed = RADIUS_M + Math.min(Number.isFinite(acc) && (acc as number) > 0 ? (acc as number) : 0, 150)
  if (dist > allowed) {
    return { ok: false, error: 'Parece que no estás en el bar. Solo se puede puntuar desde el propio local, con la caña delante.' }
  }

  // Límite: una puntuación por bar y persona cada 24 h, y como mucho 15 al día en total.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count: sameVenue } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', clientHash)
    .eq('venue_id', input.venueId)
    .gte('created_at', since)
  if ((sameVenue ?? 0) > 0) return { ok: false, error: 'Ya has puntuado este bar hoy. ¡Vuelve otro día!' }
  const { count: total } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', clientHash)
    .gte('created_at', since)
  if ((total ?? 0) >= 15) return { ok: false, error: 'Has alcanzado el límite diario de puntuaciones.' }

  // Avalancha: muchas notas en poco tiempo → las nuevas quedan pendientes de revisión.
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
  const { count: lastHour } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', input.venueId)
    .gte('created_at', hourAgo)
  const status = (lastHour ?? 0) >= BURST_PER_HOUR ? 'pendiente' : 'visible'

  const avg = (scores.score_temperature! + scores.score_foam! + scores.score_glass! + scores.score_freshness!) / 4
  const { data: inserted, error } = await supabase
    .from('ratings')
    .insert({
      venue_id: input.venueId,
      rating: Math.round(avg),
      ...scores,
      comment,
      ip_hash: clientHash,
      user_agent: userAgent.slice(0, 300),
      status,
    })
    .select('id')
    .single()
  if (error) {
    console.error('Error saving rating:', error)
    return { ok: false, error: 'No hemos podido guardar tu nota. Inténtalo de nuevo.' }
  }
  return { ok: true, score: avg * 2, pending: status === 'pendiente', ratingId: inserted?.id as string | undefined }
}
