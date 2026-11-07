'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { publishVenueFromPlace } from '@/lib/venues/auto-validate'

/**
 * Publica un bar a partir de una sugerencia y del lugar de Google elegido por el admin.
 * Guarda place_id (permitido sin límite) y coordenadas como caché temporal de Google (cron <30 días).
 * Horario, teléfono, web y puntuación de Google NO se guardan: la ficha los pide en vivo.
 */
export async function publishFromSuggestion(formData: FormData) {
  const suggestionId = String(formData.get('suggestion_id') || '')
  const placeId = String(formData.get('place_id') || '')
  const name = String(formData.get('name') || '').trim()
  const servesBodega = formData.get('serves_eg_bodega') === 'on'
  if (!suggestionId || !placeId || !name) throw new Error('Faltan datos')

  const supabase = createServiceClient()
  const { data: sug, error: sErr } = await supabase.from('venue_suggestions').select('*').eq('id', suggestionId).single()
  if (sErr || !sug) throw new Error('Sugerencia no encontrada')
  if (!sug.city_id) throw new Error('La sugerencia no tiene una ciudad de la guía; créala antes o usa el asistente.')

  const pub = await publishVenueFromPlace({ cityId: sug.city_id, placeId, name, servesBodega, fallbackAddress: sug.address })
  const now = new Date().toISOString()
  await supabase
    .from('venue_suggestions')
    .update({ status: pub.created ? 'approved' : 'duplicate', google_place_id: placeId, reviewed_at: now })
    .eq('id', suggestionId)
  revalidatePath('/admin/sugerencias')
  revalidatePath('/')
}
export async function rejectSuggestion(formData: FormData) {
  const suggestionId = String(formData.get('suggestion_id') || '')
  const notes = String(formData.get('review_notes') || '').slice(0, 300) || null
  if (!suggestionId) return
  const supabase = createServiceClient()
  await supabase
    .from('venue_suggestions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), review_notes: notes })
    .eq('id', suggestionId)
  revalidatePath('/admin/sugerencias')
}
