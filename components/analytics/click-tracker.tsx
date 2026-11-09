'use client'

import { useEffect } from 'react'
import { track, type BfyEvent } from '@/lib/analytics'

/**
 * Escucha los clics de toda la web:
 * - Elementos con data-track="evento" (y data-track-xxx="valor" como parámetros).
 * - Enlaces tel: → click_call; enlaces a Google Maps → click_maps.
 */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      const el = target?.closest<HTMLElement>('[data-track]')
      if (el) {
        const params: Record<string, string> = {}
        for (const [k, v] of Object.entries(el.dataset)) {
          if (k.startsWith('track') && k !== 'track' && v !== undefined) {
            const name = k.slice(5).replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
            params[name] = v
          }
        }
        track(el.dataset.track as BfyEvent, { ...params, page_path: location.pathname })
        return
      }
      const a = target?.closest<HTMLAnchorElement>('a[href]')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (href.startsWith('tel:')) track('click_call', { page_path: location.pathname })
      else if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/.test(href)) track('click_maps', { page_path: location.pathname })
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])
  return null
}
