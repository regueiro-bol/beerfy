import { NextResponse } from 'next/server'
import { generateVenueDescription } from '@/lib/anthropic/description-generator'

export async function POST(request: Request) {
  try {
    const { name, cityName, placesData, editorNote } = await request.json()
    if (!name || !cityName) {
      return NextResponse.json({ error: 'Missing name or cityName parameters' }, { status: 400 })
    }

    const output = await generateVenueDescription({
      name,
      cityName,
      placesData,
      editorNote,
    })
    return NextResponse.json(output)
  } catch (e: unknown) {
    console.error('Error in generate-description api route:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
