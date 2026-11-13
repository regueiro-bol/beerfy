/** Motivos para desactivar un bar (venues.archived_reason). */
export const ARCHIVE_REASONS = {
  sin_tanque: 'Ya no tiene tanque',
  cerrado: 'El bar ha cerrado',
  peticion_bar: 'A petición del bar',
  duplicado: 'Duplicado',
  otro: 'Otro motivo',
} as const

export type ArchiveReason = keyof typeof ARCHIVE_REASONS

/** Texto público para la ficha de un bar desactivado. */
export function publicArchiveText(name: string, reason: string | null): string {
  switch (reason) {
    case 'sin_tanque':
      return `${name} ya no sirve cerveza de bodega en tanque.`
    case 'cerrado':
      return `${name} ha cerrado.`
    default:
      return `${name} ya no está en la guía de Beerfy.`
  }
}
