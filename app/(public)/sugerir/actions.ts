'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { autoValidateSuggestion } from '@/lib/venues/auto-validate'

export type SuggestState = { ok: boolean; error?: string }

const clean = (v: FormDataEntryValue | null, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

export async function submitSuggestion(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  // Campo trampa para bots: si viene relleno, fingimos éxito y no guardamos nada.
  if (clean(formData.get('website'), 200)) return { ok: true }

  const venueName = clean(formData.get('venue_name'), 120)
  const cityId = clean(formData.get('city_id'), 64)
  const cityFree = clean(formData.get('city_name'), 80)
  const address = clean(formData.get('address'), 200)
  const notes = clean(formData.get('notes'), 1000)
  const notify = formData.get('notify') === 'on'
  const email = clean(formData.get('email'), 160)

  if (venueName.length < 2) return { ok: false, error: 'Indica el nombre del bar.' }
  if (!cityId && !cityFree) return { ok: false, error: 'Indica la ciudad.' }
  if (notify && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Para avisarte necesitamos un email válido.' }
  }

  const supabase = createServiceClient()
  const { data: inserted, error } = await supabase.from('venue_suggestions').insert({
    venue_name: venueName,
    city_id: cityId && cityId !== 'otra' ? cityId : null,
    city_name_freetext: cityId === 'otra' || !cityId ? cityFree : null,
    address: address || null,
    notes: notes || null,
    // Solo guardamos el email si la persona pide expresamente que la avisemos.
    submitter_email: notify ? email : null,
    notify_when_published: notify,
  }).select('id').single()

  if (error) {
    console.error('Error saving suggestion:', error)
    return { ok: false, error: 'No hemos podido guardar la sugerencia. Inténtalo de nuevo en un momento.' }
  }
  // Validación automática contra Google (si la coincidencia es clara, se publica al momento).
  try {
    if (inserted?.id) await autoValidateSuggestion(inserted.id)
  } catch (e) {
    console.error('Auto-validation failed:', e)
  }
  return { ok: true }
}
