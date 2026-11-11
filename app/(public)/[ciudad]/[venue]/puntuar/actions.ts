'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { RATING_KEYS, hashClient, saveRating, type RateResult } from '@/lib/ratings/submit'

export type RateState = RateResult

export async function submitRating(_prev: RateState, formData: FormData): Promise<RateState> {
  // Campo trampa para bots.
  if (typeof formData.get('website') === 'string' && (formData.get('website') as string).trim()) return { ok: true }

  const path = String(formData.get('path') || '')
  const scores: Record<string, unknown> = {}
  for (const k of RATING_KEYS) scores[k] = formData.get(k)

  const h = await headers()
  const ip = (h.get('x-forwarded-for') || '').split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'

  const res = await saveRating(
    {
      venueId: String(formData.get('venue_id') || ''),
      scores,
      comment: String(formData.get('comment') || ''),
      lat: Number(formData.get('geo_lat')),
      lng: Number(formData.get('geo_lng')),
      acc: Number(formData.get('geo_acc')),
    },
    hashClient(ip),
    h.get('user-agent') || ''
  )
  if (res.ok && path.startsWith('/')) revalidatePath(path)
  return res
}
