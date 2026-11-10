/**
 * Nota en formato español con un decimal («7,1», «8,5», «8,0»), salvo el máximo:
 * 10 se muestra «10», sin decimal, porque es el tope de la escala.
 */
export function formatScore(n: number): string {
  const r = Math.round(n * 10) / 10
  return r >= 10 ? '10' : r.toFixed(1).replace('.', ',')
}
