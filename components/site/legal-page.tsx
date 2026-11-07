import { SiteHeader } from './chrome'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-[760px] px-5 py-14 md:py-20">
        <h1 className="font-display text-[44px] font-extrabold leading-none tracking-[-0.03em] md:text-[60px]">{title}</h1>
        <p className="mt-3 text-sm text-stone">Última actualización: {updated}</p>
        <div className="mt-10 flex flex-col gap-5 text-[17px] leading-relaxed text-[#26231C] [&_a]:font-semibold [&_a]:underline [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </main>
  )
}
