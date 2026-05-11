import Link from 'next/link'
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">Beerfy</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/ciudades">Ciudades</Link>
            <Link href="/sugerir">Sugerir bar</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
      <footer className="border-t mt-16 py-8 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 space-y-2">
          <p>Beerfy es una guía independiente sin afiliación oficial con Hijos de Rivera S.A.U. Estrella Galicia es una marca registrada de su propietario.</p>
          <p>© {new Date().getFullYear()} Beerfy</p>
        </div>
      </footer>
    </>
  )
}
