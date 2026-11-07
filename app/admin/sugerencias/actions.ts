'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getPlaceDetails } from '@/lib/google/places'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

  const { data: dup } = await supabase.from('venues').select('id').eq('google_place_id', placeId).maybeSingle()
  if (dup) {
    await supabase
      .from('venue_suggestions')
      .update({ status: 'duplicate', google_place_id: placeId, reviewed_at: new Date().toISOString(), review_notes: 'Ya existe en la guía' })
      .eq('id', suggestionId)
    revalidatePath('/admin/sugerencias')
    return
  }

  const place = await getPlaceDetails(placeId)

  // Slug único dentro de la ciudad.
  const base = slugify(name) || 'bar'
  let slug = base
  for (let i = 2; i < 20; i++) {
    const { data: taken } = await supabase.from('venues').select('id').eq('city_id', sug.city_id).eq('slug', slug).maybeSingle()
    if (!taken) break
    slug = `${base}-${i}`
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('venues').insert({
    city_id: sug.city_id,
    slug,
    name,
    google_place_id: placeId,
    address: place.formattedAddress || sug.address,
    latitude: place.location.lat || null,
    longitude: place.location.lng || null,
    coords_source: 'google',
    coords_updated_at: now,
    serves_eg_bodega: servesBodega,
    status: 'published',
    published_at: now,
  })
  if (error) throw new Error(`No se pudo publicar: ${error.message}`)

  await supabase
    .from('venue_suggestions')
    .update({ status: 'approved', google_place_id: placeId, reviewed_at: now })
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
