import { createServiceClient } from '@/lib/supabase/service'
import { formatScore } from '@/lib/format'
import { deletePhoto, reviewPhoto, reviewRating } from './actions'
import { ConfirmButton } from '../bares/confirm-button'

export const dynamic = 'force-dynamic'

type PendingRating = {
  id: string
  comment: string | null
  created_at: string
  rating: number
  score_temperature: number | null
  score_foam: number | null
  score_glass: number | null
  score_freshness: number | null
  moderation_reason: string | null
  venues: { name: string } | null
}
type Photo = {
  id: string
  status: string
  storage_path: string
  decision_reason: string | null
  distance_m: number | null
  created_at: string
  venue_id: string | null
  ai_result: { muestra?: string; marca?: string; producto?: string; confianza?: number; hay_caras?: boolean } | null
  venues: { name: string } | null
  venue_suggestions: { venue_name: string } | null
}

/** Hace 30 días (fuera del render). */
function monthAgoIso() {
  return new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
}

const fecha = (iso: string) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })

export default async function ModerationPage() {
  const supabase = createServiceClient()
  const [{ data: ratings }, { data: photos }, { data: recent }, { data: beers }, { data: cost }] = await Promise.all([
    supabase
      .from('ratings')
      .select('id, comment, created_at, rating, score_temperature, score_foam, score_glass, score_freshness, moderation_reason, venues(name)')
      .eq('status', 'pendiente')
      .order('created_at'),
    supabase
      .from('photo_checks')
      .select('id, status, storage_path, decision_reason, distance_m, created_at, venue_id, ai_result, venues(name), venue_suggestions(venue_name)')
      .eq('status', 'revisar')
      .order('created_at'),
    supabase
      .from('photo_checks')
      .select('id, status, storage_path, decision_reason, distance_m, created_at, venue_id, ai_result, venues(name), venue_suggestions(venue_name)')
      .neq('status', 'revisar')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('beers').select('id, name').order('name'),
    supabase
      .from('ai_usage_log')
      .select('estimated_cost_usd')
      .in('function_name', ['rating_moderation', 'tank_photo_check'])
      .gte('created_at', monthAgoIso()),
  ])
  const pending = (ratings || []) as unknown as PendingRating[]
  const toReview = (photos || []) as unknown as Photo[]
  const done = (recent || []) as unknown as Photo[]
  const spent = (cost || []).reduce((a, r) => a + Number(r.estimated_cost_usd || 0), 0)

  // Enlaces temporales (1 h) para ver las fotos privadas.
  const paths = [...toReview, ...done].map((p) => p.storage_path)
  const signed = paths.length ? (await supabase.storage.from('verificaciones').createSignedUrls(paths, 3600)).data ?? [] : []
  const url = (path: string) => signed.find((s) => s.path === path)?.signedUrl ?? undefined

  const avg = (r: PendingRating) => {
    const xs = [r.score_temperature, r.score_foam, r.score_glass, r.score_freshness].filter((x): x is number => x !== null)
    return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length) * 2 : r.rating * 2
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Moderación</h1>
        <p className="mt-1 text-sm text-muted-foreground">Coste de la IA de moderación y fotos en los últimos 30 días: {spent.toFixed(3)} US$</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Notas pendientes ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-muted-foreground">Nada pendiente.</p> : null}
        {pending.map((r) => (
          <div key={r.id} className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-bold">
                {r.venues?.name ?? 'Bar'} · <span className="rounded bg-amber px-1.5">{formatScore(avg(r))}</span>
              </p>
              <p className="text-xs text-muted-foreground">{fecha(r.created_at)}</p>
            </div>
            {r.comment ? <p className="mt-2 whitespace-pre-wrap">«{r.comment}»</p> : <p className="mt-2 text-muted-foreground">Sin comentario</p>}
            <p className="mt-2 text-sm text-muted-foreground">Motivo: {r.moderation_reason ?? '—'}</p>
            <div className="mt-3 flex gap-2">
              <form action={reviewRating}>
                <input type="hidden" name="rating_id" value={r.id} />
                <input type="hidden" name="decision" value="visible" />
                <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Publicar</button>
              </form>
              <form action={reviewRating}>
                <input type="hidden" name="rating_id" value={r.id} />
                <input type="hidden" name="decision" value="hidden" />
                <button className="rounded-lg border px-4 py-2 text-sm font-semibold">Ocultar</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Fotos para revisar ({toReview.length})</h2>
        {toReview.length === 0 ? <p className="text-muted-foreground">Nada pendiente.</p> : null}
        {toReview.map((p) => (
          <PhotoCard key={p.id} p={p} src={url(p.storage_path)} beers={beers || []} actionable />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Últimas decisiones automáticas y del equipo</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {done.map((p) => (
            <PhotoCard key={p.id} p={p} src={url(p.storage_path)} beers={[]} />
          ))}
        </div>
      </section>
    </div>
  )
}

function PhotoCard({ p, src, beers, actionable }: { p: Photo; src?: string; beers: Array<{ id: string; name: string }>; actionable?: boolean }) {
  const ai = p.ai_result
  return (
    <div className="flex gap-4 rounded-xl border bg-background p-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-40 w-32 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="h-40 w-32 shrink-0 rounded-lg bg-muted" />
      )}
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="font-bold">
          {p.venues?.name ?? `Sugerencia: ${p.venue_suggestions?.venue_name ?? '—'}`}{' '}
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold uppercase">{p.status}</span>
        </p>
        <p className="text-muted-foreground">
          {fecha(p.created_at)}
          {p.distance_m !== null ? ` · a ${p.distance_m} m del bar` : ''}
        </p>
        {ai ? (
          <p>
            IA: {ai.muestra} · {ai.marca}
            {ai.producto ? ` (${ai.producto})` : ''} · confianza {Math.round((ai.confianza ?? 0) * 100)} %{ai.hay_caras ? ' · hay caras' : ''}
          </p>
        ) : null}
        <p className="text-muted-foreground">{p.decision_reason}</p>
        {actionable ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {p.venue_id ? (
              <form action={reviewPhoto} className="flex gap-2">
                <input type="hidden" name="photo_id" value={p.id} />
                <input type="hidden" name="decision" value="confirmada" />
                <select name="beer_id" className="rounded-lg border px-2 py-2 text-sm">
                  {beers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Confirmar</button>
              </form>
            ) : (
              <form action={reviewPhoto}>
                <input type="hidden" name="photo_id" value={p.id} />
                <input type="hidden" name="decision" value="confirmada" />
                <button className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Se ve el tanque</button>
              </form>
            )}
            <form action={reviewPhoto}>
              <input type="hidden" name="photo_id" value={p.id} />
              <input type="hidden" name="decision" value="rechazada" />
              <button className="rounded-lg border px-4 py-2 font-semibold">Rechazar</button>
            </form>
          </div>
        ) : null}
        <form action={deletePhoto} className="pt-1">
          <input type="hidden" name="photo_id" value={p.id} />
          <ConfirmButton message="¿Eliminar esta foto? Se borra el archivo y su registro. No cambia la cerveza confirmada del bar." className="text-xs font-semibold text-red-800 underline">
            Eliminar foto
          </ConfirmButton>
        </form>
      </div>
    </div>
  )
}
