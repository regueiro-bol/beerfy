import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export const maxDuration = 60

/**
 * Admin (protegido por la autenticación del proxy en /api/admin): sube una portada propia del bar.
 * Se reduce a 2000 px, sin metadatos (se quita la ubicación EXIF), y se guarda en el depósito público «portadas».
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bar no válido' }, { status: 400 })
  const form = await req.formData().catch(() => null)
  const photo = form?.get('photo')
  if (!(photo instanceof Blob) || photo.size === 0) return NextResponse.json({ error: 'Falta la foto' }, { status: 400 })
  if (photo.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'La foto es demasiado grande' }, { status: 413 })

  let jpeg: Buffer
  try {
    jpeg = await sharp(Buffer.from(await photo.arrayBuffer())).rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'No se ha podido leer la imagen' }, { status: 415 })
  }

  const supabase = createServiceClient()
  const { data: venue } = await supabase.from('venues').select('slug, cities(slug)').eq('id', id).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'Bar no encontrado' }, { status: 404 })
  const path = `${id}/${randomUUID()}.jpg`
  const { error } = await supabase.storage.from('portadas').upload(path, jpeg, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const url = supabase.storage.from('portadas').getPublicUrl(path).data.publicUrl
  await supabase.from('venues').update({ cover_image_url: url }).eq('id', id)

  const city = (venue.cities as unknown as { slug: string } | null)?.slug
  revalidatePath(`/admin/bares/${id}`)
  revalidatePath('/')
  if (city) {
    revalidatePath(`/${city}`)
    revalidatePath(`/${city}/${venue.slug}`)
  }
  return NextResponse.json({ ok: true, url })
}
