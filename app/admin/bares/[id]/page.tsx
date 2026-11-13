import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ARCHIVE_REASONS } from '@/lib/venues/archive'
import { removeCover, saveVenue, setVenueBeer } from './actions'
import { CoverUpload } from './cover-upload'
import { ConfirmButton } from '../confirm-button'

export const dynamic = 'force-dynamic'

const field = 'w-full rounded-lg border bg-background px-3 py-2 text-[15px]'
const label = 'mb-1 block text-sm font-semibold'

const BEER_STATUS: Record<string, string> = { confirmada: 'Confirmada', por_confirmar: 'Por confirmar', retirada: 'Retirada' }

export default async function EditVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { id } = await params
  const { ok, error } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = createServiceClient()
  const [{ data: v }, { data: cities }, { data: beers }, { data: vb }] = await Promise.all([
    supabase
      .from('venues')
      .select(
        'id, name, slug, status, city_id, address, district, phone, website, latitude, longitude, coords_source, description, description_edited_by_human, contact_manual, highlights, cover_image_url, google_place_id, archived_reason, archived_at, cities(name, slug)'
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('cities').select('id, name').order('name'),
    supabase.from('beers').select('id, name, brewery').order('name'),
    supabase.from('venue_beers').select('beer_id, status, source, last_confirmed_at').eq('venue_id', id),
  ])
  if (!v) notFound()
  const city = v.cities as unknown as { name: string; slug: string } | null
  const url = city ? `/${city.slug}/${v.slug}` : null
  const lat = v.latitude !== null ? Number(v.latitude) : null
  const lng = v.longitude !== null ? Number(v.longitude) : null
  const listed = new Map((vb || []).map((r) => [r.beer_id as string, r]))

  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-1">
        <Link href="/admin/bares" className="text-sm text-muted-foreground underline">
          ← Bares
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">{v.name}</h1>
        <p className="text-sm text-muted-foreground">
          {v.status === 'published' ? 'Publicado' : v.status === 'archived' ? `Desactivado${v.archived_reason ? ` · ${ARCHIVE_REASONS[v.archived_reason as keyof typeof ARCHIVE_REASONS] ?? ''}` : ''}` : 'Borrador'}
          {url ? (
            <>
              {' · '}
              <Link href={url} target="_blank" className="underline">
                Ver ficha
              </Link>
            </>
          ) : null}
        </p>
      </div>

      {ok ? <p className="rounded-lg bg-emerald-50 px-4 py-3 font-semibold text-emerald-900">Cambios guardados.</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 font-semibold text-red-900">{error}</p> : null}

      <form action={saveVenue} className="space-y-6 rounded-xl border bg-background p-5">
        <input type="hidden" name="venue_id" value={v.id} />
        <h2 className="text-xl font-bold">Datos del bar</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={label}>
              Nombre
            </label>
            <input id="name" name="name" defaultValue={v.name} required maxLength={120} className={field} />
            <p className="mt-1 text-xs text-muted-foreground">
              La dirección web no cambia al renombrar (beerfy.es{url}), para no romper enlaces ni lo que ya tiene Google.
            </p>
          </div>
          <div>
            <label htmlFor="city_id" className={label}>
              Ciudad
            </label>
            <select id="city_id" name="city_id" defaultValue={v.city_id} className={field}>
              {(cities || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="district" className={label}>
              Barrio o zona
            </label>
            <input id="district" name="district" defaultValue={v.district ?? ''} maxLength={80} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={label}>
              Dirección
            </label>
            <input id="address" name="address" defaultValue={v.address ?? ''} maxLength={200} className={field} />
          </div>
          <div>
            <label htmlFor="phone" className={label}>
              Teléfono
            </label>
            <input id="phone" name="phone" defaultValue={v.phone ?? ''} maxLength={40} className={field} />
          </div>
          <div>
            <label htmlFor="website" className={label}>
              Web
            </label>
            <input id="website" name="website" type="url" defaultValue={v.website ?? ''} maxLength={300} placeholder="https://" className={field} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {v.contact_manual
            ? 'Teléfono y web corregidos a mano: la ficha muestra estos, no los de Google.'
            : 'Ahora la ficha muestra el teléfono y la web de Google si los tiene. Si cambias alguno aquí, pasarán a mandar los tuyos.'}
        </p>

        <div className="space-y-2">
          <h3 className="font-bold">Ubicación</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="latitude" className={label}>
                Latitud
              </label>
              <input id="latitude" name="latitude" defaultValue={lat ?? ''} required className={field} />
            </div>
            <div>
              <label htmlFor="longitude" className={label}>
                Longitud
              </label>
              <input id="longitude" name="longitude" defaultValue={lng ?? ''} required className={field} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Importante para el mapa y para puntuar: solo se puede puntuar a menos de 120 m de este punto.{' '}
            {lat !== null && lng !== null ? (
              <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer" className="underline">
                Ver el punto en Google Maps
              </a>
            ) : null}
            {v.coords_source === 'manual' ? ' · Ubicación corregida a mano: la actualización automática no la cambia.' : ''}
          </p>
        </div>

        <div>
          <label htmlFor="description" className={label}>
            Descripción («Sobre este bar»)
          </label>
          <textarea id="description" name="description" defaultValue={v.description ?? ''} rows={6} maxLength={3000} className={field} />
          <p className="mt-1 text-xs text-muted-foreground">
            {v.description_edited_by_human
              ? 'Revisada por el equipo: la ficha no muestra el aviso de IA pendiente de revisión.'
              : 'Redactada con IA y pendiente de revisión. Si la cambias, la ficha pasará a mostrarla como revisada por el equipo.'}
          </p>
        </div>

        <div>
          <label htmlFor="highlights" className={label}>
            Destacados (uno por línea)
          </label>
          <textarea id="highlights" name="highlights" defaultValue={(v.highlights ?? []).join('\n')} rows={4} className={field} />
        </div>

        <button className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white">Guardar cambios</button>
      </form>

      <section id="cervezas" className="space-y-3 rounded-xl border bg-background p-5">
        <h2 className="text-xl font-bold">Cervezas en tanque</h2>
        <ul className="divide-y">
          {(beers || []).map((b) => {
            const row = listed.get(b.id)
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row
                      ? `${BEER_STATUS[row.status as string] ?? row.status}${row.last_confirmed_at ? ` · última confirmación ${new Date(row.last_confirmed_at as string).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}` : ''}${row.source ? ` · ${row.source}` : ''}`
                      : 'No está en este bar'}
                  </p>
                </div>
                <form action={setVenueBeer} className="flex gap-2">
                  <input type="hidden" name="venue_id" value={v.id} />
                  <input type="hidden" name="beer_id" value={b.id} />
                  <select name="status" defaultValue={(row?.status as string) ?? 'confirmada'} aria-label={`Estado de ${b.name}`} className="rounded-lg border px-2 py-2 text-sm">
                    <option value="confirmada">Confirmada</option>
                    <option value="por_confirmar">Por confirmar</option>
                    <option value="retirada">Retirada</option>
                  </select>
                  <button className="rounded-lg border px-3 py-2 text-sm font-semibold">{row ? 'Cambiar' : 'Añadir'}</button>
                </form>
              </li>
            )
          })}
        </ul>
        <p className="text-xs text-muted-foreground">«Retirada» la quita de la ficha. Si el bar ya no tiene ninguna, mejor desactívalo desde la lista de bares.</p>
      </section>

      <section id="portada" className="space-y-3 rounded-xl border bg-background p-5">
        <h2 className="text-xl font-bold">Portada</h2>
        {v.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.cover_image_url} alt="" className="max-h-72 rounded-lg object-cover" />
        ) : (
          <p className="text-sm text-muted-foreground">Sin portada propia: la ficha usa la foto de Google{v.google_place_id ? '' : ' (no tiene ficha de Google enlazada)'}.</p>
        )}
        <CoverUpload venueId={v.id} />
        <p className="text-xs text-muted-foreground">Solo fotos reales del local, nunca imágenes generadas con IA. Comprueba que no se reconocen caras de clientes o empleados.</p>
        {v.cover_image_url ? (
          <form action={removeCover}>
            <input type="hidden" name="venue_id" value={v.id} />
            <ConfirmButton message="¿Quitar la portada propia? La ficha volverá a usar la foto de Google." className="text-sm font-semibold text-red-800 underline">
              Quitar portada propia
            </ConfirmButton>
          </form>
        ) : null}
      </section>
    </div>
  )
}
