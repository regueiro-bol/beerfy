import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PlusCircle, Inbox, ShieldCheck } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/admin/venues/nuevo" className="block group">
          <Card className="h-full transition-shadow duration-200 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-200">
                Crear bar nuevo
              </CardTitle>
              <PlusCircle className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Busca en Google Places, precarga datos e inyecta la descripción generada por IA.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/sugerencias" className="block group">
        <Card className="h-full transition-shadow duration-200 group-hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">
              Sugerencias pendientes
            </CardTitle>
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Valida las sugerencias de la comunidad contra Google y publícalas con su ubicación exacta.
            </p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/admin/moderacion" className="block group">
          <Card className="h-full transition-shadow duration-200 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-bold">Moderación</CardTitle>
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notas que la IA ha dejado pendientes y fotos de tanques que hay que revisar.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
