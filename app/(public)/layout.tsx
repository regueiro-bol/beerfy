import { SiteFooter } from '@/components/site/chrome'
import { MobileTabBar } from '@/components/mobile/tab-bar'

/** Cada página pinta su propia cabecera (sobre foto o sólida). */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper pb-[calc(64px+env(safe-area-inset-bottom))] text-[#16140F] md:pb-0">
      {children}
      <SiteFooter />
      <MobileTabBar />
    </div>
  )
}
