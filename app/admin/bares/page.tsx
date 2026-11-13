import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { setVenueStatus } from './actions'
import { ConfirmButton } from './confirm-button'
import { ARCHIVE_REASONS } from '@/lib/venues/archive'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  updated_at: string
  cities: { name: string; slug: string } | null
  venue_beers: Array<{ status: string; beers: { name: string } | null }>
  archived_reason: string | null
  archived_note: string | null
  archived_at: string | null
}

const LABEL: Record<Row['status'], string> = { published: 'Publicado', archived: 'Desactivado', draft: 'Borrador' }
const BADGE: Record<Row['status'], string> = {
  published: 'bg-emerald-100 text-emerald-900',
  archived: 'bg-stone-200 text-stone-700',
  draft: 'bg-amber-100 text-amber-900',
}

export default async function BaresAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q = '', estado = 'todos' } = await searchParams
  const supabase = createServiceClient()
  let query = supabase
    .from('venues')
    .select('id, name, slug, status, updated_at, cities(name, slug), venue_beers(status, beers(name)), archived_reason, archived_note, archived_at')
    .order('name')
  if (estado === 'publicados') query = query.eq('status', 'published')
  if (estado === 'desactivados') query = query.eq('status', 'archived')
  if (q.trim()) query = query.ilike('name', `%${q.trim().replace(/[%_]/g, '')}%`)
  const { data } = await query
  const rows = (data || []) as unknown as Row[]
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {})

  const tab = (key: string, label: string) => (
    <Link
      href={{ pathname: '/admin/bares', query: { ...(q ? { q } : {}), estado: key } }}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${estado === key ? 'bg-foreground text-background' : 'border'}`}
    >
      {label}
    </Link>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Bares</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desactivar oculta el bar en la web, la app y el mapa sin borrar nada: sus notas, cervezas y fotos se conservan y vuelven si lo reactivas.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/bares">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre…"
          className="min-w-[220px] flex-1 rounded-lg border px-3 py-2"
          aria-label="Buscar bar por nombre"
        />
        <input type="hidden" name="estado" value={estado} />
        <button className="rounded-lg bg-foreground px-4 py-2 font-semibold text-background">Buscar</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {tab('todos', 'Todos')}
        {tab('publicados', 'Publicados')}
        {tab('desactivados', 'Desactivados')}
      </div>

      <p className="text-sm text-muted-foreground">
        {rows.length} bares · {counts.published ?? 0} publicados · {counts.archived ?? 0} desactivados
        {counts.draft ? ` · ${counts.draft} borradores` : ''}
      </p>

      <ul className="divide-y rounded-xl border bg-background">
        {rows.map((r) => {
          const beers = r.venue_beers.filter((b) => b.status !== 'retirada' && b.beers).map((b) => b.beers!.name)
          const url = r.cities ? `/${r.cities.slug}/${r.slug}` : null
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  <Link href={`/admin/bares/${r.id}`} className="underline-offset-4 hover:underline">
                    {r.name}
                  </Link>{' '}
                  <span className={`ml-1 rounded px-2 py-0.5 text-xs font-semibold ${BADGE[r.status]}`}>{LABEL[r.status]}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.cities?.name ?? 'Sin ciudad'}
                  {beers.length ? ` · ${beers.join(', ')}` : ''}
                  {url && r.status === 'published' ? (
                    <>
                      {' · '}
                      <Link href={url} target="_blank" className="underline">
                        Ver ficha
                      </Link>
                    </>
                  ) : null}
                </p>
                {r.status === 'archived' && (r.archived_reason || r.archived_at) ? (
                  <p className="mt-1 text-sm text-red-900">
                    {r.archived_reason ? ARCHIVE_REASONS[r.archived_reason as keyof typeof ARCHIVE_REASONS] ?? r.archived_reason : 'Desactivado'}
                    {r.archived_at ? ` · ${new Date(r.archived_at).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}` : ''}
                    {r.archived_note ? ` · «${r.archived_note}»` : ''}
                  </p>
                ) : null}
              </div>
              <Link href={`/admin/bares/${r.id}`} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                Editar
              </Link>
              {r.status === 'published' ? (
                <form action={setVenueStatus} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="venue_id" value={r.id} />
                  <input type="hidden" name="status" value="archived" />
                  <select name="reason" defaultValue="sin_tanque" aria-label="Motivo" className="rounded-lg border px-2 py-2 text-sm">
                    {Object.entries(ARCHIVE_REASONS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input name="note" maxLength={300} placeholder="Nota (opcional)" aria-label="Nota" className="w-44 rounded-lg border px-2 py-2 text-sm" />
                  <ConfirmButton message={`¿Desactivar «${r.name}»? Dejará de verse en la web y en la app. Podrás reactivarlo cuando quieras.`} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800">
                    Desactivar
                  </ConfirmButton>
                </form>
              ) : (
                <form action={setVenueStatus}>
                  <input type="hidden" name="venue_id" value={r.id} />
                  <input type="hidden" name="status" value="published" />
                  <ConfirmButton message={`¿Volver a publicar «${r.name}»?`} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                    Reactivar
                  </ConfirmButton>
                </form>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
