'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { ARCHIVE_REASONS } from '@/lib/venues/archive'

/**
 * Desactivar (archivar) o reactivar un bar. No se borra nada: notas, cervezas y fotos se conservan
 * y vuelven tal cual al reactivarlo. Un bar desactivado desaparece de la web, la app y el mapa;
 * su ficha antigua muestra un aviso con bares cercanos (sin indexar).
 */
export async function setVenueStatus(formData: FormData) {
  const id = String(formData.get('venue_id') || '')
  const status = String(formData.get('status') || '')
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['published', 'archived'].includes(status)) return
  const reasonRaw = String(formData.get('reason') || '')
  const reason = reasonRaw in ARCHIVE_REASONS ? reasonRaw : 'otro'
  const note = String(formData.get('note') || '').trim().slice(0, 300) || null

  const supabase = createServiceClient()
  const { data: v } = await supabase.from('venues').select('slug, published_at, cities(slug)').eq('id', id).maybeSingle()
  if (!v) return
  const update =
    status === 'archived'
      ? { status, archived_reason: reason, archived_note: note, archived_at: new Date().toISOString() }
      : {
          status,
          archived_reason: null,
          archived_note: null,
          archived_at: null,
          ...(!v.published_at ? { published_at: new Date().toISOString() } : {}),
        }
  await supabase.from('venues').update(update).eq('id', id)
  const city = (v.cities as unknown as { slug: string } | null)?.slug
  revalidatePath('/admin/bares')
  revalidatePath('/')
  if (city) {
    revalidatePath(`/${city}`)
    revalidatePath(`/${city}/${v.slug}`)
  }
  revalidatePath('/sitemap.xml')
}
