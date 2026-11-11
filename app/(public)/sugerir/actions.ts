'use server'

import { saveSuggestion, type SuggestResult } from '@/lib/suggestions/submit'

export type SuggestState = SuggestResult

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '')

export async function submitSuggestion(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  // Campo trampa para bots: si viene relleno, fingimos éxito y no guardamos nada.
  if (str(formData.get('website')).trim()) return { ok: true }
  return saveSuggestion({
    venueName: str(formData.get('venue_name')),
    cityId: str(formData.get('city_id')),
    cityName: str(formData.get('city_name')),
    address: str(formData.get('address')),
    notes: str(formData.get('notes')),
    notify: formData.get('notify') === 'on',
    email: str(formData.get('email')),
  })
}
