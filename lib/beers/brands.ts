/** Marcas de cerveza de bodega/tanque de la guía. La etiqueta es solo la marca (no el detalle de cervezas). */
export const BRANDS = [
  { key: 'estrella-galicia', label: 'Estrella Galicia', beerSlug: 'estrella-galicia-de-bodega' },
  { key: 'mahou', label: 'Mahou', beerSlug: 'bodega-mahou' },
  { key: 'el-aguila', label: 'El Águila', beerSlug: 'el-aguila-dorada' },
] as const

export type BrandKey = (typeof BRANDS)[number]['key']

export function brandOf(v: unknown): BrandKey | null {
  return BRANDS.find((b) => b.key === v)?.key ?? null
}

export function beerSlugOf(brand: BrandKey | null | undefined) {
  return (BRANDS.find((b) => b.key === brand) ?? BRANDS[0]).beerSlug
}
