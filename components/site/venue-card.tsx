import Link from 'next/link'
import { ScoreBadge } from './chrome'

type Props = {
  href: string
  name: string
  place: string
  coverUrl: string | null
  /** Autor de la foto cuando viene de Google Maps (obligatorio mostrarlo). */
  coverCredit?: { author: string | null; authorUri: string | null } | null
  score: number | null
  votes: number
  rank?: number
  servesBodega?: boolean
  tall?: boolean
}

/**
 * Tarjeta de local. Sin foto real se muestra un marcador honesto (nunca imágenes IA de un bar real).
 */
export function VenueCard({ href, name, place, coverUrl, coverCredit, score, votes, rank, servesBodega = true, tall = true }: Props) {
  return (
    <div className="relative">
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[32px] bg-[#1C1812] ${tall ? 'h-[460px] md:h-[520px]' : 'h-[340px]'}`}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt={`Foto de ${name}`} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_70%_30%,#3A2A12,#1C1812_65%)]">
          <svg width="120" height="160" viewBox="0 0 120 160" aria-hidden="true" className="opacity-60">
            <path d="M22 40 L98 40 L88 150 L32 150 Z" fill="#C9761A" />
            <rect x="18" y="30" width="84" height="20" rx="10" fill="#F6F1E4" />
            <circle cx="36" cy="32" r="14" fill="#F6F1E4" />
            <circle cx="60" cy="24" r="18" fill="#F6F1E4" />
            <circle cx="84" cy="32" r="14" fill="#F6F1E4" />
          </svg>
          <span className="absolute bottom-[150px] text-xs text-sand/80">Foto del local próximamente</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/20 to-transparent" aria-hidden="true" />
      {rank !== undefined && (
        <span className="absolute left-5 top-5 rounded-full bg-cream px-3.5 py-2 text-sm font-extrabold text-ink">#{rank}</span>
      )}
      <span className="absolute right-5 top-5">
        <ScoreBadge score={score} size="lg" />
      </span>
      <div className="absolute inset-x-6 bottom-6 flex flex-col gap-1.5 text-cream">
        <p className="font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] md:text-[34px]">{name}</p>
        <p className="text-[15px] text-sand">{place.replace(/,\s*(Spain|España)$/i, '')}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[13px] font-semibold">
          {servesBodega && <span className="rounded-full bg-cream/15 px-3 py-1.5 backdrop-blur">Cerveza de bodega</span>}
          <span className="rounded-full bg-cream/15 px-3 py-1.5 backdrop-blur">
            {score !== null ? `${votes} puntuaciones` : votes > 0 ? `En calibración · ${votes}/5` : 'Sin puntuaciones aún'}
          </span>
        </div>
      </div>
    </Link>
    {coverCredit && (
      <p className="pointer-events-auto absolute right-6 top-[88px] max-w-[60%] truncate text-right text-[10px] text-sand/90 [text-shadow:0_1px_2px_rgba(0,0,0,.7)]">
        Foto:{' '}
        {coverCredit.authorUri ? (
          <a href={coverCredit.authorUri} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {coverCredit.author ?? 'usuario de Google'}
          </a>
        ) : (coverCredit.author ?? 'usuario de Google')}{' '}
        · <span translate="no">Google Maps</span>
      </p>
    )}
    </div>
  )
}
