import { SiteFooter } from '@/components/site/chrome'

/** Cada página pinta su propia cabecera (sobre foto o sólida). */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper text-[#16140F]">
      {children}
      <SiteFooter />
    </div>
  )
}
