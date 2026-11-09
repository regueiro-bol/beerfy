import { ImageResponse } from 'next/og'
import { getVenueCardData } from '@/lib/share/data'
import { loadFonts, VenueOg } from '@/lib/share/cards'

export const alt = 'Ficha del bar en Beerfy con su nota de tirada'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ ciudad: string; venue: string }> }) {
  const { ciudad, venue } = await params
  const data = await getVenueCardData(ciudad, venue)
  const fonts = await loadFonts()
  if (!data) return new ImageResponse(<div style={{ width: 1200, height: 630, background: '#0D0B08' }} />, { ...size })
  return new ImageResponse(<VenueOg {...data} />, { ...size, fonts })
}
