import { saveSuggestion } from '@/lib/suggestions/submit'
import { json, preflight, readJson } from '@/lib/app/http'

export const dynamic = 'force-dynamic'

/** Sugerir un bar desde la app (misma validación automática que la web). */
export async function POST(req: Request) {
  const body = await readJson(req)
  if (!body) return json({ ok: false, error: 'Petición no válida.' }, { status: 400 })
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true })
  const s = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '')
  const res = await saveSuggestion({
    venueName: s('venue_name'),
    cityId: s('city_id'),
    cityName: s('city_name'),
    address: s('address'),
    notes: s('notes'),
    notify: body.notify === true,
    email: s('email'),
  })
  return json(res, { status: res.ok ? 200 : 422 })
}

export const OPTIONS = preflight
