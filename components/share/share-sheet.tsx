'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BRAND_ICONS } from '@/lib/share/brand-icons'

type Props = {
  /** URL absoluta de lo que se comparte */
  url: string
  title: string
  text: string
  /** Imagen 9:16 (historias, TikTok) y 4:5 (guardar / feed) */
  storyImg: string
  postImg?: string
  fileBase: string
  heading: string
  sub: string
  campaign: 'ficha' | 'tirada'
  thumb?: string | null
  thumbLabel?: string | null
  trigger: 'icon' | 'invite' | 'tirada'
}

function track(method: string, campaign: string) {
  const w = window as Window & { dataLayer?: unknown[] }
  w.dataLayer?.push({ event: 'share', method, content_type: campaign })
}

function Logo({ name, size = 24, color = '#FFFFFF' }: { name: keyof typeof BRAND_ICONS; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={BRAND_ICONS[name].path} fill={color} />
    </svg>
  )
}

const ShareIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M5 13v7h14v-7" />
  </svg>
)

export function ShareSheet(p: Props) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const files = useRef<{ story?: File; post?: File }>({})
  const dialog = useRef<HTMLDivElement>(null)

  const withUtm = useCallback(
    (source: string) => {
      const u = new URL(p.url)
      u.searchParams.set('utm_source', source)
      u.searchParams.set('utm_medium', 'share')
      u.searchParams.set('utm_campaign', p.campaign)
      return u.toString()
    },
    [p.url, p.campaign]
  )

  // Precarga las imágenes al abrir: el menú de compartir del móvil exige llamarse en el mismo toque
  useEffect(() => {
    if (!open) return
    let alive = true
    const load = async (src: string, name: string) => {
      const r = await fetch(src)
      const b = await r.blob()
      return new File([b], name, { type: b.type || 'image/png' })
    }
    load(p.storyImg, `${p.fileBase}-historia.png`)
      .then((f) => alive && (files.current.story = f))
      .catch(() => {})
    if (p.postImg)
      load(p.postImg, `${p.fileBase}-post.png`)
        .then((f) => alive && (files.current.post = f))
        .catch(() => {})
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    dialog.current?.focus()
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
    }
  }, [open, p.storyImg, p.postImg, p.fileBase])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  function download(file: File) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = file.name
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  async function shareImage(kind: 'story' | 'post', method: string, hint: string) {
    track(method, p.campaign)
    const f = files.current[kind] ?? files.current.story
    if (!f) {
      setToast('Preparando la imagen… vuelve a pulsar en un segundo.')
      return
    }
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title: p.title, text: `${p.text} ${withUtm(method)}` })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    download(f)
    setToast(hint)
  }

  function openUrl(href: string, method: string) {
    track(method, p.campaign)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  async function copy() {
    track('copy', p.campaign)
    try {
      await navigator.clipboard.writeText(withUtm('copy'))
      setToast('Enlace copiado')
    } catch {
      setToast(p.url)
    }
  }

  async function more() {
    track('native', p.campaign)
    if (navigator.share) {
      try {
        await navigator.share({ title: p.title, text: p.text, url: withUtm('native') })
      } catch {}
    } else copy()
  }

  const enc = encodeURIComponent

  const trigger =
    p.trigger === 'icon' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Compartir ${p.title}`}
        className="flex h-11 items-center gap-2 rounded-full bg-ink/70 px-4 text-sm font-bold text-cream backdrop-blur transition hover:bg-ink"
      >
        <ShareIcon size={18} />
        <span>Compartir</span>
      </button>
    ) : p.trigger === 'invite' ? (
      <div className="flex flex-wrap items-center gap-4 rounded-[24px] border-[1.5px] border-line bg-white p-5">
        <div className="min-w-[180px] flex-1">
          <p className="font-display text-[22px] font-extrabold leading-tight">¿Con quién te la tomarías?</p>
          <p className="mt-1 text-sm text-stone">Mándale este bar con su nota.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center gap-2 rounded-full bg-amber px-5 font-extrabold text-ink transition hover:brightness-95"
        >
          <ShareIcon size={18} />
          Invitar
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-amber text-[17px] font-extrabold text-ink"
      >
        <ShareIcon />
        Compartir mi tirada
      </button>
    )

  const tile = 'relative flex h-[92px] flex-col justify-between overflow-hidden rounded-[20px] p-3.5 text-left'
  const arrow = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" className="opacity-80">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
  const pill = 'flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line bg-white pl-1.5 pr-3.5 text-[13px] font-bold'

  return (
    <>
      {trigger}
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="presentation">
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <div
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="relative w-full max-w-[480px] rounded-t-[28px] bg-paper px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-2.5 text-[#16140F] outline-none md:rounded-[28px] md:pb-6"
          >
            <span aria-hidden="true" className="mx-auto mb-3 block h-[5px] w-10 rounded-full bg-sand md:hidden" />
            <div className="mb-3.5 flex items-center gap-3">
              {p.thumb !== undefined && (
                <div className="relative h-[72px] w-[58px] flex-none overflow-hidden rounded-[10px] bg-ink shadow-[0_8px_20px_-8px_rgba(13,11,8,.6)]">
                  {p.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb} alt="" className="absolute inset-x-0 top-0 h-[60%] w-full object-cover" />
                  )}
                  {p.thumbLabel && <span className="absolute bottom-1 left-1.5 font-display text-[15px] font-extrabold text-amber">{p.thumbLabel}</span>}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 id="share-title" className="font-display text-[23px] font-extrabold leading-none tracking-[-0.02em]">
                  {p.heading}
                </h2>
                <p className="mt-1 text-[13px] text-stone">{p.sub}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="self-start text-[13px] font-semibold text-stone">
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className={`${tile} bg-[#25D366] text-white`}
                onClick={() => openUrl(`https://wa.me/?text=${enc(`${p.text} ${withUtm('whatsapp')}`)}`, 'whatsapp')}
              >
                <span className="flex items-center justify-between">
                  <Logo name="whatsapp" size={26} />
                  {arrow}
                </span>
                <span>
                  <span className="block text-[15px] font-extrabold leading-tight">WhatsApp</span>
                  <span className="block text-[11px] opacity-90">Chat o grupo con vista previa</span>
                </span>
              </button>
              <button
                type="button"
                className={`${tile} bg-[linear-gradient(135deg,#FEDA75_0%,#FA7E1E_25%,#D62976_55%,#962FBF_80%,#4F5BD5_100%)] text-white`}
                onClick={() => shareImage('story', 'instagram', 'Imagen descargada: súbela a tu historia de Instagram.')}
              >
                <span className="flex items-center justify-between">
                  <Logo name="instagram" size={26} />
                  {arrow}
                </span>
                <span>
                  <span className="block text-[15px] font-extrabold leading-tight">Historia de Instagram</span>
                  <span className="block text-[11px] opacity-90">Tarjeta 9:16 lista para subir</span>
                </span>
              </button>
              <button
                type="button"
                className={`${tile} bg-ink text-white`}
                onClick={() => shareImage('story', 'tiktok', 'Imagen descargada: súbela como foto en TikTok.')}
              >
                <span aria-hidden="true" className="absolute -bottom-5 -right-4 h-[70px] w-[70px] rounded-full bg-[#25F4EE] opacity-35 blur-[10px]" />
                <span aria-hidden="true" className="absolute -bottom-6 right-5 h-[60px] w-[60px] rounded-full bg-[#FE2C55] opacity-35 blur-[10px]" />
                <span className="relative flex items-center justify-between">
                  <Logo name="tiktok" size={24} />
                  {arrow}
                </span>
                <span className="relative">
                  <span className="block text-[15px] font-extrabold leading-tight">TikTok</span>
                  <span className="block text-[11px] opacity-90">Foto-post con la tarjeta</span>
                </span>
              </button>
              <button
                type="button"
                className={`${tile} bg-amber text-ink`}
                onClick={() => {
                  track('download', p.campaign)
                  const f = files.current.post ?? files.current.story
                  if (f) {
                    download(f)
                    setToast('Imagen guardada')
                  } else setToast('Preparando la imagen… vuelve a pulsar en un segundo.')
                }}
              >
                <span className="flex items-center justify-between">
                  <ShareIcon size={24} />
                  {arrow}
                </span>
                <span>
                  <span className="block text-[15px] font-extrabold leading-tight">Guardar imagen</span>
                  <span className="block text-[11px] opacity-80">Para usarla donde quieras</span>
                </span>
              </button>
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              <li>
                <button type="button" className={pill} onClick={() => openUrl(`https://t.me/share/url?url=${enc(withUtm('telegram'))}&text=${enc(p.text)}`, 'telegram')}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#26A5E4]">
                    <Logo name="telegram" size={16} />
                  </span>
                  Telegram
                </button>
              </li>
              <li>
                <button type="button" className={pill} onClick={() => openUrl(`https://x.com/intent/post?text=${enc(p.text)}&url=${enc(withUtm('x'))}`, 'x')}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                    <Logo name="x" size={14} />
                  </span>
                  X
                </button>
              </li>
              <li>
                <button type="button" className={pill} onClick={() => openUrl(`https://www.facebook.com/sharer/sharer.php?u=${enc(withUtm('facebook'))}`, 'facebook')}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0866FF]">
                    <Logo name="facebook" size={16} />
                  </span>
                  Facebook
                </button>
              </li>
              <li>
                <button type="button" className={pill} onClick={more}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink">
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="5" cy="12" r="2" fill="currentColor" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                      <circle cx="19" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </span>
                  Más
                </button>
              </li>
            </ul>

            <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-[#F3EEE2] px-3.5 py-3">
              <span className="min-w-0 flex-1 truncate text-[13px] text-stone">{p.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
              <button type="button" onClick={copy} className="text-[13px] font-extrabold text-bottle">
                Copiar enlace
              </button>
            </div>

            {toast && (
              <p role="status" className="absolute inset-x-4 -top-14 rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-cream shadow-xl">
                {toast}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
