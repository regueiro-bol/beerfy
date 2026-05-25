import { NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/google/places'

export async function POST(request: Request) {
  try {
    const { query, cityName } = await request.json()
    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
    }

    const results = await searchPlaces(query, cityName)
    return NextResponse.json(results)
  } catch (e: unknown) {
    console.error('Error in places-search api route:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
