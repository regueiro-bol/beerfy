/**
 * Geocodificación de respaldo con OpenStreetMap (Nominatim) para publicar fichas provisionales
 * mientras no hay datos de Google. Uso puntual (política de Nominatim: máx. 1 petición/segundo, UA identificable).
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(address)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Beerfy/1.0 (https://beerfy.vercel.app)', 'Accept-Language': 'es' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
  const r = data[0]
  return r ? { lat: Number(r.lat), lng: Number(r.lon), label: r.display_name } : null
}
