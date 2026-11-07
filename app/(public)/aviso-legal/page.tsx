import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'

export const metadata: Metadata = { title: 'Aviso legal y condiciones de uso', robots: { index: false } }

// Texto base: completar titular, NIF y domicilio y revisar con asesoría legal antes del lanzamiento.
export default function TermsPage() {
  return (
    <LegalPage title="Aviso legal y condiciones de uso" updated="7 de noviembre de 2026">
      <p>Beerfy es una guía independiente, sin afiliación con ninguna cervecera. Titular: [razón social, NIF y domicilio].</p>
      <h2>Contenido de la comunidad</h2>
      <p>Las puntuaciones y comentarios reflejan la opinión de quien los publica. Podemos ocultar los que sean ofensivos, falsos o no traten de la tirada.</p>
      <h2>Contenido de Google Maps</h2>
      <p>
        Los mapas, horarios y puntuaciones de Google que aparecen en las fichas proceden de Google Maps. Al usarlos aceptas las{' '}
        <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Condiciones de servicio adicionales de Google Maps</a>{' '}
        y la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad de Google</a>.
      </p>
      <h2>Marcas</h2>
      <p>Estrella Galicia es marca registrada de Hijos de Rivera S.A.U. Las marcas citadas pertenecen a sus propietarios y se mencionan solo para identificar la cerveza servida.</p>
    </LegalPage>
  )
}
