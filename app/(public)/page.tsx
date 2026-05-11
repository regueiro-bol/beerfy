import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4 text-center py-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bares con Estrella Galicia de Bodega
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Guía colaborativa de los sitios donde de verdad te la sirven como toca.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ourense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vigo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Madrid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente...</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6 max-w-2xl mx-auto border-t pt-8">
        <h2 className="text-2xl font-bold">Cómo funciona Beerfy</h2>
        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
          <li>Descubre bares curados por nuestra comunidad.</li>
          <li>Valora cómo sirven la cerveza en cada local.</li>
          <li>Sugiere sitios nuevos para que los añadamos a la guía.</li>
        </ul>
      </section>

      <section className="text-center py-8">
        <Link href="/sugerir" className={buttonVariants({ size: "lg" })}>
          Sugerir un bar
        </Link>
      </section>
    </div>
  )
}
