import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'

export const metadata: Metadata = { title: 'Política de privacidad', robots: { index: false } }

// Texto base: revisar con asesoría legal (responsable, CIF y datos de contacto) antes del lanzamiento.
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" updated="7 de noviembre de 2026">
      <p>Beerfy es una guía colaborativa. Tratamos los mínimos datos posibles para que funcione.</p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li><strong>Puntuaciones:</strong> no pedimos registro. Para evitar abusos guardamos un identificador cifrado e irreversible derivado de tu dirección IP y el tipo de navegador. Para comprobar que puntúas desde el bar, al enviar la nota te pedimos permiso de ubicación: la usamos solo para calcular la distancia al local en ese momento y la descartamos; no se guarda ni se asocia a tu nota.</li>
        <li><strong>Sugerencias de bares:</strong> los datos del bar que nos envías y, solo si pides que te avisemos, tu email, que usamos únicamente para ese aviso.</li>
      </ul>
      <h2>Google Maps</h2>
      <p>
        Beerfy usa las API de Google Maps (mapas, ubicación, horario y puntuación de los locales). Al usar estas funciones se aplica
        también la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad de Google</a>.
      </p>
      <h2 id="cookies">Cookies y analítica</h2>
      <p>
        Solo usamos cookies técnicas imprescindibles y, si lo aceptas en el aviso de cookies, cookies de analítica de Google Analytics
        (gestionadas con Google Tag Manager) para medir de forma agregada qué páginas se visitan. No usamos cookies de publicidad.
        Puedes cambiar tu elección en cualquier momento desde el enlace «Cookies» del pie de página. Más información en la{' '}
        <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">política de cookies de Google</a>.
      </p>
      <h2>Tus derechos</h2>
      <p>Puedes pedir acceso, rectificación o supresión de tus datos escribiendo a [email de contacto].</p>
    </LegalPage>
  )
}
