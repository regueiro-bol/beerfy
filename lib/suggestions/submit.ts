import { createServiceClient } from '@/lib/supabase/service'
import { autoValidateSuggestion } from '@/lib/venues/auto-validate'

/** Lógica común para sugerir un bar (web y app). */

export type SuggestInput = {
  venueName: string
  cityId?: string
  cityName?: string
  address?: string
  notes?: string
  notify?: boolean
  email?: string
}

export type SuggestResult = { ok: boolean; error?: string; id?: string }

const cut = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function saveSuggestion(input: SuggestInput): Promise<SuggestResult> {
  const venueName = cut(input.venueName, 120)
  const cityId = cut(input.cityId, 64)
  const cityFree = cut(input.cityName, 80)
  const address = cut(input.address, 200)
  const notes = cut(input.notes, 1000)
  const notify = input.notify === true
  const email = cut(input.email, 160)

  if (venueName.length < 2) return { ok: false, error: 'Indica el nombre del bar.' }
  if (!cityId && !cityFree) return { ok: false, error: 'Indica la ciudad.' }
  if (notify && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Para avisarte necesitamos un email válido.' }
  }

  const supabase = createServiceClient()
  const { data: inserted, error } = await supabase
    .from('venue_suggestions')
    .insert({
      venue_name: venueName,
      city_id: cityId && cityId !== 'otra' ? cityId : null,
      city_name_freetext: cityId === 'otra' || !cityId ? cityFree : null,
      address: address || null,
      notes: notes || null,
      // Solo guardamos el email si la persona pide expresamente que la avisemos.
      submitter_email: notify ? email : null,
      notify_when_published: notify,
    })
    .select('id')
    .single()

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
  return { ok: true, id: inserted?.id as string | undefined }
}
