/**
 * URL canónica pública. Dominio principal: www.beerfy.es (beerfy.es y beerfy.bar redirigen aquí).
 * Se puede sobrescribir con NEXT_PUBLIC_SITE_URL (p. ej. en previews). No se lee la variable antigua
 * de URL de la app para no heredar el valor beerfy.bar que pudiera quedar configurado en Vercel.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beerfy.es').replace(/\/$/, '')
