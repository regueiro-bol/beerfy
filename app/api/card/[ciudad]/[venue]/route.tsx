import { ImageResponse } from 'next/og'
import { getVenueCardData } from '@/lib/share/data'
import { loadFonts, VenueStory, VenuePost } from '@/lib/share/cards'

export async function GET(req: Request, { params }: { params: Promise<{ ciudad: string; venue: string }> }) {
  const { ciudad, venue } = await params
  const f = new URL(req.url).searchParams.get('f') === 'post' ? 'post' : 'story'
  const data = await getVenueCardData(ciudad, venue)
  if (!data) return new Response('No encontrado', { status: 404 })
  const fonts = await loadFonts()
  const size = f === 'post' ? { width: 1080, height: 1350 } : { width: 1080, height: 1920 }
  return new ImageResponse(f === 'post' ? <VenuePost {...data} /> : <VenueStory {...data} />, {
    ...size,
    fonts,
    headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' },
  })
}
