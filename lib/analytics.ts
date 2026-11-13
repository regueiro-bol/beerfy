/**
 * Eventos de analítica → dataLayer de Google Tag Manager.
 * En GTM basta UNA etiqueta «Evento de GA4» con nombre {{Event}} y un activador
 * «Evento personalizado» con la expresión regular de BFY_EVENTS (ver docs/analitica.md).
 */
export const BFY_EVENTS = [
  'age_gate_answer',
  'share_open',
  'share',
  'rate_cta',
  'rate_submit',
  'rate_error',
  'geo_permission',
  'select_venue',
  'nav_click',
  'cta_click',
  'click_maps',
  'click_call',
  'click_website',
  'suggest_submit',
  'pwa_install',
  'pwa_installed',
  'pwa_dismiss',
  'photo_check',
] as const

export type BfyEvent = (typeof BFY_EVENTS)[number]

export function track(event: BfyEvent, params: Record<string, string | number | boolean | null | undefined> = {}) {
  if (typeof window === 'undefined') return
  const w = window as Window & { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event, ...params })
}
