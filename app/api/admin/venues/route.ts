import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      city_id,
      name,
      google_place_id,
      address,
      district,
      latitude,
      longitude,
      phone,
      website,
      hours_json,
      description,
      description_ai_version,
      description_edited_by_human,
      highlights,
      cover_image_url,
      status,
    } = body

    if (!city_id || !name) {
      return NextResponse.json({ error: 'Missing city_id or name parameters' }, { status: 400 })
    }

    const slug = slugify(name)

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('venues')
      .insert({
        city_id,
        slug,
        name,
        google_place_id: google_place_id || null,
        address: address || null,
        district: district || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        phone: phone || null,
        website: website || null,
        hours_json: hours_json || null,
        description: description || null,
        description_ai_version: description_ai_version || null,
        description_edited_by_human: !!description_edited_by_human,
        highlights: highlights || null,
        cover_image_url: cover_image_url || null,
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting venue:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    console.error('Error in venues API POST route:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
