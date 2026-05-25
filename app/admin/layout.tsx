import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-lg text-primary">
            Beerfy Admin
          </Link>
          <nav className="flex gap-4 text-sm items-center">
            <Link href="/" className="hover:underline text-muted-foreground">
              Volver a la web
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
