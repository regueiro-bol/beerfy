import { RATING_KEYS, saveRating } from '@/lib/ratings/submit'
import { clientHashFrom, json, preflight, readJson } from '@/lib/app/http'

export const dynamic = 'force-dynamic'

/** Puntuar desde la app: mismas reglas que la web (GPS en el bar, límites diarios, avalanchas). */
export async function POST(req: Request) {
  const body = await readJson(req)
  if (!body) return json({ ok: false, error: 'Petición no válida.' }, { status: 400 })
  const scores: Record<string, unknown> = {}
  for (const k of RATING_KEYS) scores[k] = body[k]
  const res = await saveRating(
    {
      venueId: String(body.venue_id || ''),
      scores,
      comment: typeof body.comment === 'string' ? body.comment : null,
      lat: Number(body.lat),
      lng: Number(body.lng),
      acc: Number(body.acc),
    },
    clientHashFrom(req),
    `app ${req.headers.get('user-agent') || ''}`
  )
  return json(res, { status: res.ok ? 200 : 422 })
}

export const OPTIONS = preflight
