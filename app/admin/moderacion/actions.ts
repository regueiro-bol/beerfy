'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

const now = () => new Date().toISOString()

/** Publicar u ocultar una nota pendiente. */
export async function reviewRating(formData: FormData) {
  const id = String(formData.get('rating_id') || '')
  const decision = String(formData.get('decision') || '')
  if (!id || !['visible', 'hidden'].includes(decision)) return
  const supabase = createServiceClient()
  await supabase.from('ratings').update({ status: decision, reviewed_at: now() }).eq('id', id)
  revalidatePath('/admin/moderacion')
  revalidatePath('/', 'layout')
}

/** Confirmar (con la cerveza elegida) o rechazar una foto en revisión. */
export async function reviewPhoto(formData: FormData) {
  const id = String(formData.get('photo_id') || '')
  const decision = String(formData.get('decision') || '')
  const beerId = String(formData.get('beer_id') || '')
  if (!id || !['confirmada', 'rechazada'].includes(decision)) return
  const supabase = createServiceClient()
  const { data: check } = await supabase.from('photo_checks').select('id, venue_id').eq('id', id).maybeSingle()
  if (!check) return
  if (decision === 'confirmada' && check.venue_id && /^[0-9a-f-]{36}$/i.test(beerId)) {
    const { data: existing } = await supabase.from('venue_beers').select('status').eq('venue_id', check.venue_id).eq('beer_id', beerId).maybeSingle()
    if (existing) {
      await supabase
        .from('venue_beers')
        .update({ status: 'confirmada', last_confirmed_at: now(), ...(existing.status !== 'confirmada' ? { source: 'comunidad' } : {}) })
        .eq('venue_id', check.venue_id)
        .eq('beer_id', beerId)
    } else {
      await supabase
        .from('venue_beers')
        .insert({ venue_id: check.venue_id, beer_id: beerId, format: 'tanque', status: 'confirmada', source: 'comunidad', last_confirmed_at: now() })
    }
  }
  await supabase
    .from('photo_checks')
    .update({ status: decision, reviewed_at: now(), decision_reason: decision === 'confirmada' ? 'Confirmada por el equipo' : 'Rechazada por el equipo' })
    .eq('id', id)
  revalidatePath('/admin/moderacion')
  revalidatePath('/', 'layout')
}
