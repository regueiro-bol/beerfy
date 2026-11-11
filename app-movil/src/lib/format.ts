/** Nota sobre 10 con coma decimal; el 10 va sin decimales (igual que la web). */
export function formatScore(n: number): string {
  const r = Math.round(n * 10) / 10
  return r >= 10 ? '10' : r.toFixed(1).replace('.', ',')
}

export const MIN_VOTES = 5

/** Texto de la nota de un bar, con el mismo criterio de «en calibración» que la web. */
export function scoreLabel(score: number | null, votes: number) {
  if (score !== null) return `${votes} puntuaciones`
  if (votes > 0) return `En calibración · ${votes}/${MIN_VOTES}`
  return 'Sin puntuaciones aún'
}

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`
}

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}
