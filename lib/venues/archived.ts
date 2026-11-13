import { createServiceClient } from '@/lib/supabase/service'

/** Bar desactivado (archivado) por su ciudad y slug, para mostrar «ya no está en la guía» en vez de un error. */
export async function getArchivedVenue(citySlug: string, venueSlug: string) {
  const supabase = createServiceClient()
  const { data: city } = await supabase.from('cities').select('id, name, slug').eq('slug', citySlug).maybeSingle()
  if (!city) return null
  const { data: venue } = await supabase.from('venues').select('name').eq('city_id', city.id).eq('slug', venueSlug).eq('status', 'archived').maybeSingle()
  return venue ? { name: venue.name as string, city: city as { name: string; slug: string } } : null
}
