/** Icono de Beerfy: caña con corona de espuma (opción A). viewBox 64×64. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M19 24 L45 24 L42.5 55 Q42.2 58 39.2 58 L24.8 58 Q21.8 58 21.5 55 Z" fill="#F2B33D" />
      <path d="M21 34 L43 34" stroke="#C8763A" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <g fill="#FFF8E6">
        <circle cx="21" cy="22" r="6" />
        <circle cx="30" cy="17" r="8" />
        <circle cx="40" cy="19" r="7" />
        <circle cx="45" cy="24" r="4.5" />
        <rect x="17" y="20" width="30" height="7" rx="3" />
      </g>
      <circle cx="27" cy="44" r="1.6" fill="#FFF8E6" opacity="0.8" />
      <circle cx="34" cy="50" r="1.2" fill="#FFF8E6" opacity="0.8" />
    </svg>
  )
}

/** El icono sobre su baldosa negra, para fondos claros. */
export function BrandTile({ size = 36, radius }: { size?: number; radius?: number }) {
  return (
    <span
      className="inline-flex flex-none items-center justify-center bg-ink"
      style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.28) }}
    >
      <BrandMark size={Math.round(size * 0.84)} />
    </span>
  )
}
