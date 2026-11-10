/**
 * Nota en formato español: «10», «8», «8,5». Sin decimal cuando es entera
 * (10,0 no aporta nada: 10 ya es el tope).
 */
export function formatScore(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace(".", ",");
}
