import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { searchPlaces, type PlaceSearchResult } from '@/lib/google/places'
import { publishFromSuggestion, rejectSuggestion } from './actions'

export const dynamic = 'force-dynamic'

type Suggestion = {
  id: string
  venue_name: string
  address: string | null
  notes: string | null
  city_id: string | null
  city_name_freetext: string | null
  created_at: string
  cities: { name: string; slug: string } | null
}

export default async function SuggestionsAdminPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('venue_suggestions')
    .select('id, venue_name, address, notes, city_id, city_name_freetext, created_at, cities(name, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  const suggestions = (data || []) as unknown as Suggestion[]

  // Candidatos de Google para cada sugerencia (nombre + dirección + ciudad).
  const candidates = await Promise.all(
    suggestions.map(async (s) => {
      const q = [s.venue_name, s.address].filter(Boolean).join(', ')
      try {
        return { ok: true as const, list: (await searchPlaces(q, s.cities?.name || s.city_name_freetext || undefined)).slice(0, 3) }
      } catch (e) {
        return { ok: false as const, error: (e as Error).message, list: [] as PlaceSearchResult[] }
      }
    })
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">← Admin</Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Sugerencias pendientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige el local correcto de Google: se publica con su ubicación exacta y su ficha de Google enlazada (horario y puntuación en vivo).
        </p>
      </div>

      {suggestions.length === 0 && <p className="rounded-xl border bg-background p-6">No hay sugerencias pendientes.</p>}

      {suggestions.map((s, i) => {
        const c = candidates[i]!
        return (
          <section key={s.id} className="rounded-2xl border bg-background p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{s.venue_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {s.address || 'Sin dirección'} · {s.cities?.name || s.city_name_freetext || 'Sin ciudad'} ·{' '}
                  {new Date(s.created_at).toLocaleString('es-ES')}
                </p>
                {s.notes && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">“{s.notes}”</p>}
                {!s.city_id && <p className="mt-2 text-sm font-semibold text-red-700">Ciudad fuera de la guía: no se puede publicar desde aquí.</p>}
              </div>
              <form action={rejectSuggestion} className="flex gap-2">
                <input type="hidden" name="suggestion_id" value={s.id} />
                <input name="review_notes" placeholder="Motivo (opcional)" className="rounded-md border px-2 py-1 text-sm" />
                <button className="rounded-md border px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">Rechazar</button>
              </form>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coincidencias en Google</p>
              {!c.ok && <p className="text-sm text-red-700">Error de Google: {c.error}</p>}
              {c.ok && c.list.length === 0 && <p className="text-sm">Sin resultados. Prueba con el asistente de alta.</p>}
              {c.list.map((p, j) => (
                <form key={p.id} action={publishFromSuggestion} className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
                  <input type="hidden" name="suggestion_id" value={s.id} />
                  <input type="hidden" name="place_id" value={p.id} />
                  <div className="min-w-[240px] flex-1">
                    <p className="font-semibold">
                      {j === 0 && <span className="mr-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs">Mejor coincidencia</span>}
                      {p.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{p.formattedAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.primaryType || 'sin tipo'} · {p.location.lat.toFixed(5)}, {p.location.lng.toFixed(5)}
                      {p.googleMapsUri && (
                        <>
                          {' · '}
                          <a href={p.googleMapsUri} target="_blank" rel="noopener noreferrer" className="underline">Ver en Google Maps</a>
                        </>
                      )}
                    </p>
                  </div>
                  <label className="flex flex-col text-xs">
                    Nombre en Beerfy
                    <input name="name" defaultValue={p.name || s.venue_name} className="mt-1 rounded-md border px-2 py-1 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="serves_eg_bodega" defaultChecked /> EG de Bodega
                  </label>
                  <button disabled={!s.city_id} className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                    Publicar este
                  </button>
                </form>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
