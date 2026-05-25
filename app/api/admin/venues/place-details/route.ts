import { NextResponse } from 'next/server'
import { getPlaceDetails } from '@/lib/google/places'

export async function POST(request: Request) {
  try {
    const { placeId } = await request.json()
    if (!placeId) {
      return NextResponse.json({ error: 'Missing placeId parameter' }, { status: 400 })
    }

    const details = await getPlaceDetails(placeId)
    return NextResponse.json(details)
  } catch (e: unknown) {
    console.error('Error in place-details api route:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
