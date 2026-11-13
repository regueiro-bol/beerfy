'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Desactivar (archivar) o reactivar un bar. No se borra nada: notas, cervezas y fotos se conservan
 * y vuelven tal cual al reactivarlo. Un bar desactivado desaparece de la web, la app y el mapa.
 */
export async function setVenueStatus(formData: FormData) {
  const id = String(formData.get('venue_id') || '')
  const status = String(formData.get('status') || '')
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['published', 'archived'].includes(status)) return
  const supabase = createServiceClient()
  const { data: v } = await supabase.from('venues').select('slug, published_at, cities(slug)').eq('id', id).maybeSingle()
  if (!v) return
  await supabase
    .from('venues')
    .update({ status, ...(status === 'published' && !v.published_at ? { published_at: new Date().toISOString() } : {}) })
    .eq('id', id)
  const city = (v.cities as unknown as { slug: string } | null)?.slug
  revalidatePath('/admin/bares')
  revalidatePath('/')
  if (city) {
    revalidatePath(`/${city}`)
    revalidatePath(`/${city}/${v.slug}`)
  }
  revalidatePath('/sitemap.xml')
}
