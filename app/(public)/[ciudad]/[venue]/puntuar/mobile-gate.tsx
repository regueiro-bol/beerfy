'use client'

import { useEffect, useState } from 'react'

/**
 * Puntuar es cosa del móvil, en el bar. En ordenador (puntero fino, sin táctil) mostramos un QR
 * para seguir en el móvil; se puede saltar por si alguien está en el bar con un portátil.
 */
export function MobileGate({ qrSvg, children }: { qrSvg: string; children: React.ReactNode }) {
  const [desktop, setDesktop] = useState<boolean | null>(null)
  const [skip, setSkip] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDesktop(!window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints === 0)
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  if (desktop === null) return null
  if (!desktop || skip) return <>{children}</>

  return (
    <div className="flex flex-wrap items-center gap-8 rounded-[32px] bg-ink p-8 text-cream md:p-10">
      <div
        className="flex-none rounded-2xl bg-cream p-3 [&_svg]:h-[200px] [&_svg]:w-[200px]"
        role="img"
        aria-label="Código QR para abrir esta página en el móvil"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <div className="flex min-w-[240px] flex-1 flex-col gap-4">
        <p className="font-display text-[34px] font-extrabold leading-none">Se puntúa desde el móvil, en el bar</p>
        <p className="text-sand">
          Para que las notas sean de quien de verdad ha tomado la caña, solo se puede puntuar desde el propio local. Escanea el código con
          el móvil y puntúa con la caña delante.
        </p>
        <button type="button" onClick={() => setSkip(true)} className="self-start text-sm text-sand underline underline-offset-4 hover:text-cream">
          Estoy en el bar con el portátil
        </button>
      </div>
    </div>
  )
}
