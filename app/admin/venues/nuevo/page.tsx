import { getPublishedCities } from '@/lib/supabase/queries'
import NewVenueWizard from '@/components/feature/admin/NewVenueWizard'

export const dynamic = 'force-dynamic'

export default async function NewVenuePage() {
  const cities = await getPublishedCities()
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Crear Bar Nuevo</h1>
      <NewVenueWizard cities={cities} />
    </div>
  )
}
