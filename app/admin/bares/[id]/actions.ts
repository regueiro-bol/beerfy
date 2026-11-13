'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max)

async function revalidateVenue(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase.from('venues').select('slug, cities(slug)').eq('id', id).maybeSingle()
  const city = (data?.cities as unknown as { slug: string } | null)?.slug
  revalidatePath('/admin/bares')
  revalidatePath(`/admin/bares/${id}`)
  revalidatePath('/')
  if (city && data) {
    revalidatePath(`/${city}`)
    revalidatePath(`/${city}/${data.slug}`)
  }
}

/** Guarda los datos editables de la ficha. El slug (la dirección web) no cambia para no romper enlaces. */
export async function saveVenue(formData: FormData) {
  const id = str(formData, 'venue_id', 64)
  if (!/^[0-9a-f-]{36}$/i.test(id)) return
  const supabase = createServiceClient()
  const { data: current } = await supabase.from('venues').select('description, latitude, longitude, city_id, slug, phone, website').eq('id', id).maybeSingle()
  if (!current) return

  const name = str(formData, 'name', 120)
  if (name.length < 2) redirect(`/admin/bares/${id}?error=${encodeURIComponent('El nombre es obligatorio.')}`)
  const website = str(formData, 'website', 300)
  if (website && !/^https?:\/\//i.test(website)) redirect(`/admin/bares/${id}?error=${encodeURIComponent('La web debe empezar por http:// o https://')}`)

  const lat = Number(str(formData, 'latitude', 30).replace(',', '.'))
  const lng = Number(str(formData, 'longitude', 30).replace(',', '.'))
  const coordsOk = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
  if (!coordsOk) redirect(`/admin/bares/${id}?error=${encodeURIComponent('Revisa la latitud y la longitud (ejemplo: 42.3304, -7.8616).')}`)
  const coordsChanged = Math.abs(lat - Number(current.latitude)) > 1e-7 || Math.abs(lng - Number(current.longitude)) > 1e-7

  const description = String(formData.get('description') ?? '').trim().slice(0, 3000)
  const descChanged = description !== (current.description ?? '')
  const highlights = String(formData.get('highlights') ?? '')
    .split('\n')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 12)
  const cityId = str(formData, 'city_id', 64)

  const update: Record<string, unknown> = {
    name,
    address: str(formData, 'address', 200) || null,
    district: str(formData, 'district', 80) || null,
    phone: str(formData, 'phone', 40) || null,
    website: website || null,
    description: description || null,
    highlights: highlights.length ? highlights : null,
    latitude: lat,
    longitude: lng,
    updated_at: new Date().toISOString(),
  }
  if (/^[0-9a-f-]{36}$/i.test(cityId) && cityId !== current.city_id) update.city_id = cityId
  // Teléfono o web corregidos a mano: tienen prioridad sobre los de Google.
  if ((update.phone ?? null) !== (current.phone ?? null) || (update.website ?? null) !== (current.website ?? null)) update.contact_manual = true
  // Descripción tocada a mano: deja de mostrarse como «pendiente de revisión».
  if (descChanged) update.description_edited_by_human = true
  // Coordenadas corregidas a mano: el cron de Google ya no las sobrescribe.
  if (coordsChanged) {
    update.coords_source = 'manual'
    update.coords_updated_at = new Date().toISOString()
  }

  await revalidateVenue(id) // ruta antigua (por si cambia la ciudad)
  const { error } = await supabase.from('venues').update(update).eq('id', id)
  if (error) {
    const msg = error.code === '23505' ? 'Ya hay un bar con la misma dirección web en esa ciudad.' : `No se ha podido guardar: ${error.message}`
    redirect(`/admin/bares/${id}?error=${encodeURIComponent(msg)}`)
  }
  await revalidateVenue(id)
  redirect(`/admin/bares/${id}?ok=1`)
}

/** Estado de una cerveza en el bar (o añadirla). */
export async function setVenueBeer(formData: FormData) {
  const id = str(formData, 'venue_id', 64)
  const beerId = str(formData, 'beer_id', 64)
  const status = str(formData, 'status', 20)
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(beerId) || !['confirmada', 'por_confirmar', 'retirada'].includes(status)) return
  const supabase = createServiceClient()
  const { data: existing } = await supabase.from('venue_beers').select('status').eq('venue_id', id).eq('beer_id', beerId).maybeSingle()
  const now = new Date().toISOString()
  if (existing) {
    await supabase
      .from('venue_beers')
      .update({ status, ...(status === 'confirmada' ? { last_confirmed_at: now, source: 'equipo' } : {}) })
      .eq('venue_id', id)
      .eq('beer_id', beerId)
  } else {
    await supabase
      .from('venue_beers')
      .insert({ venue_id: id, beer_id: beerId, format: 'tanque', status, source: 'equipo', ...(status === 'confirmada' ? { last_confirmed_at: now } : {}) })
  }
  await revalidateVenue(id)
  redirect(`/admin/bares/${id}?ok=1#cervezas`)
}

/** Quitar la portada propia: la ficha vuelve a usar la foto de Google. */
export async function removeCover(formData: FormData) {
  const id = str(formData, 'venue_id', 64)
  if (!/^[0-9a-f-]{36}$/i.test(id)) return
  const supabase = createServiceClient()
  await supabase.from('venues').update({ cover_image_url: null }).eq('id', id)
  await revalidateVenue(id)
  redirect(`/admin/bares/${id}?ok=1#portada`)
}
