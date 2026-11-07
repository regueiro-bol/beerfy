/**
 * Geocodificación de respaldo con OpenStreetMap (Nominatim) para publicar fichas provisionales
 * mientras no hay datos de Google. Uso puntual (política de Nominatim: máx. 1 petición/segundo, UA identificable).
 */
async function query(address: string): Promise<{ lat: number; lng: number; label: string } | null> {
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

/** Expande abreviaturas gallegas/españolas habituales en direcciones. */
function expand(a: string) {
  return a
    .replace(/\bNsa\.?\s*Sra\.?/gi, 'Nosa Señora')
    .replace(/\bNtra\.?\s*Sra\.?/gi, 'Nuestra Señora')
    .replace(/\bAvda\.?/gi, 'Avenida')
    .replace(/\bPza\.?/gi, 'Praza')
}

/** Prueba la dirección tal cual, con abreviaturas expandidas y, por último, sin código postal. */
export async function geocodeAddress(address: string) {
  const tries = [address, expand(address), expand(address).replace(/\b\d{5}\b\s*/g, '')]
  for (const [i, t] of [...new Set(tries)].entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100))
    const r = await query(t)
    if (r) return r
  }
  return null
}
