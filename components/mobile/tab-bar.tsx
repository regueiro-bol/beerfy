'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/',
    label: 'Inicio',
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    href: '/ciudades',
    label: 'Ciudades',
    icon: (
      <>
        <path d="M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13" />
        <path d="M13 11h3M13 15h3" />
      </>
    ),
  },
  { href: '/cerca', label: 'Cerca', center: true, icon: null },
  {
    href: '/la-bodega',
    label: 'La Bodega',
    icon: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2z" />
        <path d="M4 21V5M8 7h6" />
      </>
    ),
  },
  {
    href: '/sugerir',
    label: 'Sugerir',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
]

/** Barra de pestañas inferior, solo en móvil (sensación de app). */
export function MobileTabBar() {
  const path = usePathname() || '/'
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] text-cream backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5 items-end">
        {TABS.map((t) => {
          const active = isActive(t.href)
          if (t.center) {
            return (
              <li key={t.href} className="flex justify-center">
                <Link
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className="-mt-5 flex flex-col items-center gap-1 pb-2"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber text-ink shadow-[0_8px_24px_-6px_rgba(242,179,61,0.7)] ring-4 ring-ink">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                  </span>
                  <span className={`text-[11px] font-bold ${active ? 'text-amber' : 'text-cream'}`}>Cerca de mí</span>
                </Link>
              </li>
            )
          }
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  active ? 'text-amber' : 'text-sand'
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {t.icon}
                </svg>
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
