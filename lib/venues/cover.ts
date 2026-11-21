import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

/** Guarda una portada propia del bar: 2000 px máx., sin metadatos (sin ubicación EXIF), depósito público «portadas». */
export async function saveVenueCover(id: string, file: ArrayBuffer): Promise<{ ok: true; url: string } | { ok: false; error: string; status: number }> {
  let jpeg: Buffer
  try {
    jpeg = await sharp(Buffer.from(file)).rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
  } catch {
    return { ok: false, error: 'No se ha podido leer la imagen', status: 415 }
  }
  const supabase = createServiceClient()
  const { data: venue } = await supabase.from('venues').select('slug, cities(slug)').eq('id', id).maybeSingle()
  if (!venue) return { ok: false, error: 'Bar no encontrado', status: 404 }
  const path = `${id}/${randomUUID()}.jpg`
  const { error } = await supabase.storage.from('portadas').upload(path, jpeg, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) return { ok: false, error: error.message, status: 500 }
  const url = supabase.storage.from('portadas').getPublicUrl(path).data.publicUrl
  await supabase.from('venues').update({ cover_image_url: url }).eq('id', id)
  const city = (venue.cities as unknown as { slug: string } | null)?.slug
  revalidatePath(`/admin/bares/${id}`)
  revalidatePath('/')
  if (city) {
    revalidatePath(`/${city}`)
    revalidatePath(`/${city}/${venue.slug}`)
  }
  return { ok: true, url }
}
