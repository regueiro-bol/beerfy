import sharp from 'sharp'
import { NextResponse } from 'next/server'
import { opsAuthorized } from '@/lib/ops/auth'
import { aiReview } from '@/lib/moderation/rating'
import { analyzeTankPhoto } from '@/lib/verification/photo'

export const maxDuration = 120

/**
 * Solo equipo: prueba la moderación y el análisis de fotos sin guardar nada.
 * POST { comments?: string[], photoUrls?: string[] }
 */
export async function POST(req: Request) {
  if (!opsAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { comments?: string[]; photoUrls?: string[] }
  const comments = await Promise.all(
    (body.comments ?? []).slice(0, 20).map(async (c) => {
      try {
        return { comment: c, verdict: await aiReview(c, 'Bar de prueba', 3.5) }
      } catch (e) {
        return { comment: c, error: (e as Error).message }
      }
    })
  )
  const photos = await Promise.all(
    (body.photoUrls ?? []).slice(0, 8).map(async (u) => {
      try {
        const r = await fetch(u)
        const jpeg = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
        return { url: u, result: await analyzeTankPhoto(jpeg, 'Foto de prueba.') }
      } catch (e) {
        return { url: u, error: (e as Error).message }
      }
    })
  )
  return NextResponse.json({ comments, photos })
}
