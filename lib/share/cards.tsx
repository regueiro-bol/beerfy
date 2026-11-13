import { formatScore } from '@/lib/format'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/* Tarjetas para compartir (next/og). Solo usan foto PROPIA del bar o la imagen de ambiente de Beerfy:
   las fotos de Google Maps no se pueden reutilizar en imágenes que salen de la web. */

export const INK = '#0D0B08'
export const CREAM = '#F6F1E4'
export const AMBER = '#F2B33D'
export const BOTTLE = '#134236'
export const SAND = '#D8CFBC'

let fontsCache: Promise<Array<{ name: string; data: Buffer; weight: 400 | 500 | 700 | 800; style: 'normal' | 'italic' }>> | null = null
export function loadFonts() {
  if (!fontsCache) {
    const dir = join(process.cwd(), 'assets/fonts')
    fontsCache = Promise.all([
      readFile(join(dir, 'bricolage-grotesque-latin-800-normal.woff')),
      readFile(join(dir, 'inter-latin-500-normal.woff')),
      readFile(join(dir, 'inter-latin-700-normal.woff')),
      readFile(join(dir, 'newsreader-latin-400-italic.woff')),
    ]).then(([b, i5, i7, n]) => [
      { name: 'Bricolage', data: b, weight: 800 as const, style: 'normal' as const },
      { name: 'Inter', data: i5, weight: 500 as const, style: 'normal' as const },
      { name: 'Inter', data: i7, weight: 700 as const, style: 'normal' as const },
      { name: 'Newsreader', data: n, weight: 400 as const, style: 'italic' as const },
    ])
  }
  return fontsCache
}

/** Devuelve la imagen como data URL: foto propia (/venues/…) o, si no hay, la de ambiente. */
export async function loadImage(cover: string | null, fallback = '/images/hero.jpg'): Promise<string> {
  // Portadas subidas desde el admin (Supabase Storage): se descargan.
  if (cover && /^https:\/\//.test(cover)) {
    try {
      const r = await fetch(cover, { signal: AbortSignal.timeout(5000) })
      if (r.ok) return `data:${r.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
    } catch {}
  }
  const pick = cover && cover.startsWith('/') ? cover : fallback
  try {
    const buf = await readFile(join(process.cwd(), 'public', pick))
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    if (cover && /^https:\/\//.test(cover)) {
      try {
        const r = await fetch(cover)
        if (r.ok) return `data:${r.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
      } catch {}
    }
    const buf = await readFile(join(process.cwd(), 'public', fallback))
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  }
}

export const fmt = formatScore

export function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M19 24 L45 24 L42.5 55 Q42.2 58 39.2 58 L24.8 58 Q21.8 58 21.5 55 Z" fill={AMBER} />
      <circle cx="21" cy="22" r="6" fill="#FFF8E6" />
      <circle cx="30" cy="17" r="8" fill="#FFF8E6" />
      <circle cx="40" cy="19" r="7" fill="#FFF8E6" />
      <circle cx="45" cy="24" r="4.5" fill="#FFF8E6" />
      <rect x="17" y="20" width="30" height="7" rx="3" fill="#FFF8E6" />
    </svg>
  )
}

export type VenueCardData = {
  name: string
  place: string
  score: number | null
  votes: number
  img: string
  url: string // sin https://
  beer: string | null
}

function scoreLine(d: VenueCardData) {
  if (d.score !== null) return { big: fmt(d.score), small: `Nota de tirada · ${d.votes} puntuaciones` }
  return { big: null, small: d.votes > 0 ? 'Nota en calibración' : 'Recién llegado a Beerfy' }
}

/** Historia 1080×1920 del bar */
export function VenueStory(d: VenueCardData) {
  const s = scoreLine(d)
  return (
    <div style={{ width: 1080, height: 1920, display: 'flex', flexDirection: 'column', background: INK, color: CREAM, fontFamily: 'Inter', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.img} width={1080} height={1250} style={{ objectFit: 'cover', width: 1080, height: 1250 }} alt="" />
      <div style={{ position: 'absolute', left: 0, top: 700, width: 1080, height: 560, display: 'flex', backgroundImage: `linear-gradient(180deg, rgba(13,11,8,0), ${INK})` }} />
      <div style={{ position: 'absolute', top: 64, left: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 30px 18px 22px', borderRadius: 999, background: 'rgba(13,11,8,0.72)' }}>
        <Mark size={56} />
        <span style={{ fontFamily: 'Bricolage', fontSize: 46, letterSpacing: -1.5 }}>beerfy</span>
      </div>
      <div style={{ position: 'absolute', left: 72, right: 72, bottom: 96, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div style={{ display: 'flex' }}>
          <span style={{ padding: '14px 26px', borderRadius: 999, background: BOTTLE, fontSize: 30, fontWeight: 700, letterSpacing: 3 }}>
            {(d.beer ? `${d.beer} · en tanque` : 'Cerveza de bodega · en tanque').toUpperCase()}
          </span>
        </div>
        <div style={{ fontFamily: 'Bricolage', fontSize: d.name.length > 18 ? 104 : 128, lineHeight: 0.95, letterSpacing: -4 }}>{d.name}</div>
        <div style={{ fontSize: 40, color: SAND }}>{d.place}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 10 }}>
          {s.big && <span style={{ fontFamily: 'Bricolage', fontSize: 170, color: AMBER, lineHeight: 1 }}>{s.big}</span>}
          <span style={{ fontSize: 38, color: SAND, maxWidth: 520 }}>{s.small}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '34px 30px', borderRadius: 40, background: AMBER, color: INK, fontSize: 40, fontWeight: 700 }}>{d.url}</div>
      </div>
    </div>
  )
}

/** Post 1080×1350 del bar */
export function VenuePost(d: VenueCardData) {
  const s = scoreLine(d)
  return (
    <div style={{ width: 1080, height: 1350, display: 'flex', flexDirection: 'column', background: CREAM, color: '#16140F', fontFamily: 'Inter', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.img} width={1080} height={820} style={{ objectFit: 'cover', width: 1080, height: 820 }} alt="" />
      <svg width="1080" height="70" viewBox="0 0 1080 70" style={{ position: 'absolute', top: 760, left: 0 }}>
        <path d="M0 70V35c36-24 72-24 108 0s72-30 122-6 64 24 108 0 80-18 122 6 72-24 116-6 64 30 108 6 86-18 130 0 72 24 122 0 80-12 144 0v35z" fill={CREAM} />
      </svg>
      <div style={{ position: 'absolute', top: 56, right: 56, width: 250, height: 250, borderRadius: 999, background: AMBER, color: INK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(8deg)' }}>
        {s.big ? (
          <>
            <span style={{ fontFamily: 'Bricolage', fontSize: 96, lineHeight: 1 }}>{s.big}</span>
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>TIRADA</span>
          </>
        ) : (
          <span style={{ fontFamily: 'Bricolage', fontSize: 40, lineHeight: 1.05, textAlign: 'center', padding: 30 }}>Nuevo en Beerfy</span>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 64px 56px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: 'Bricolage', fontSize: d.name.length > 20 ? 84 : 100, lineHeight: 1, letterSpacing: -3 }}>{d.name}</div>
          <div style={{ fontSize: 34, color: '#5E5A50' }}>{`${d.place} · ${d.beer ?? 'Cerveza de bodega'} en tanque`}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 76, height: 76, borderRadius: 22, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mark size={60} />
            </div>
            <span style={{ fontFamily: 'Bricolage', fontSize: 50 }}>beerfy</span>
          </div>
          <span style={{ fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 44, color: BOTTLE }}>La de bodega, bien tirada.</span>
        </div>
      </div>
    </div>
  )
}

/** Vista previa de enlace 1200×630 */
export function VenueOg(d: VenueCardData) {
  const s = scoreLine(d)
  return (
    <div style={{ width: 1200, height: 630, display: 'flex', background: INK, color: CREAM, fontFamily: 'Inter' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.img} width={690} height={630} style={{ objectFit: 'cover', width: 690, height: 630 }} alt="" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Mark size={48} />
          <span style={{ fontFamily: 'Bricolage', fontSize: 40 }}>beerfy</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Bricolage', fontSize: d.name.length > 18 ? 52 : 64, lineHeight: 1, letterSpacing: -2 }}>{d.name}</div>
          <div style={{ fontSize: 26, color: SAND }}>{d.place}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          {s.big && <span style={{ fontFamily: 'Bricolage', fontSize: 120, color: AMBER, lineHeight: 0.9 }}>{s.big}</span>}
          <span style={{ fontSize: 24, color: SAND, paddingBottom: 8 }}>{s.small}</span>
        </div>
      </div>
    </div>
  )
}

export type TiradaData = {
  venue: string
  score: number
  crit: Array<{ name: string; v: number | null }>
  comment: string | null
  img: string
  date: string
}

/** Historia 1080×1920 «Mi tirada» */
export function TiradaStory(d: TiradaData) {
  return (
    <div style={{ width: 1080, height: 1920, display: 'flex', flexDirection: 'column', background: INK, color: CREAM, fontFamily: 'Inter', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.img} width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover', width: 1080, height: 1920, opacity: 0.5 }} alt="" />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920, display: 'flex', backgroundImage: `linear-gradient(180deg, rgba(13,11,8,0.2), rgba(13,11,8,0.96) 68%)` }} />
      <div style={{ position: 'absolute', top: 70, left: 70, right: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Mark size={64} />
          <span style={{ fontFamily: 'Bricolage', fontSize: 52 }}>beerfy</span>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 420, left: 70, right: 70, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 6, color: AMBER }}>MI TIRADA EN</span>
        <span style={{ fontFamily: 'Bricolage', fontSize: d.venue.length > 18 ? 100 : 120, lineHeight: 0.95, letterSpacing: -4, marginTop: 14 }}>{d.venue}</span>
        <div style={{ marginTop: 60, width: 440, height: 440, borderRadius: 999, background: AMBER, color: INK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-6deg)' }}>
          <span style={{ fontFamily: 'Bricolage', fontSize: 190, lineHeight: 0.9 }}>{fmt(d.score)}</span>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 4 }}>DE 10</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, bottom: 90, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {d.crit.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ width: 260, fontSize: 36, color: SAND }}>{c.name}</span>
            <div style={{ flex: 1, height: 22, borderRadius: 99, background: 'rgba(246,241,228,0.18)', display: 'flex' }}>
              <div style={{ width: `${((c.v ?? 0) / 10) * 100}%`, height: 22, borderRadius: 99, background: AMBER }} />
            </div>
            <span style={{ width: 80, textAlign: 'right', fontSize: 36, fontWeight: 700 }}>{c.v !== null ? fmt(c.v) : '–'}</span>
          </div>
        ))}
        {d.comment && (
          <span style={{ marginTop: 20, fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 54, lineHeight: 1.15 }}>{`«${d.comment.slice(0, 110)}${d.comment.length > 110 ? '…' : ''}»`}</span>
        )}
        <span style={{ marginTop: 16, fontSize: 36, color: '#A99F8B' }}>{`${d.date} · ¿Y a ti, cómo te la tiran? · beerfy.es`}</span>
      </div>
    </div>
  )
}
