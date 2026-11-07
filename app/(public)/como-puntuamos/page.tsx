import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/legal-page'
import { MIN_VOTES } from '@/lib/supabase/queries'

export const metadata: Metadata = {
  title: 'Cómo funcionan las notas',
  description: 'Cómo verificamos y procesamos las puntuaciones de Beerfy: solo desde el bar, sin registro y sin guardar tu ubicación.',
}

// Información exigida a quien publica valoraciones de consumidores (art. 20.4 TRLGDCU). Revisar con asesoría legal.
export default function HowWeRatePage() {
  return (
    <LegalPage title="Cómo funcionan las notas" updated="7 de noviembre de 2026">
      <p>
        La Nota de tirada mide cómo sirve un bar su cerveza de bodega: temperatura, espuma, vaso y frescura, de 1 a 5 cada uno. La media de
        los cuatro, pasada a una escala de 0 a 10, es la nota de cada persona; la del bar es la media de todas.
      </p>
      <h2>Solo se puntúa desde el bar</h2>
      <p>
        Para que las notas vengan de gente que de verdad ha tomado una caña allí, al enviar una puntuación pedimos permiso de ubicación y
        comprobamos que estás en el local o a pocos metros. Si no estás, no se puede enviar. La ubicación se usa solo para esa comprobación:
        no la guardamos ni la asociamos a tu nota.
      </p>
      <p>
        No pedimos registro, nombre ni email, así que no podemos garantizar al cien por cien que cada nota corresponda a una consumición, pero
        sí que se ha enviado desde el bar.
      </p>
      <h2>Cuándo se publica la nota de un bar</h2>
      <p>
        La nota de un bar se muestra a partir de {MIN_VOTES} puntuaciones. Antes aparece «en calibración», para que dos o tres votos no
        decidan la imagen de un local.
      </p>
      <h2>Qué hacemos contra los abusos</h2>
      <ul>
        <li>Una puntuación por bar y persona cada 24 horas, y un máximo diario por persona.</li>
        <li>Si un bar recibe muchas notas en poco tiempo, las nuevas quedan pendientes hasta que las revisamos.</li>
        <li>Ocultamos las notas y comentarios ofensivos, falsos o que no hablen de la tirada.</li>
        <li>Nadie paga por aparecer ni por mejorar su nota. Los bares no pueden borrar puntuaciones.</li>
      </ul>
      <h2>Si eres el bar</h2>
      <p>
        Si crees que una nota o un comentario es falso o injusto, escríbenos a [email de contacto] indicando el bar y la fecha. Lo revisamos y,
        si incumple estas normas, lo retiramos.
      </p>
      <h2>Puntuación de Google</h2>
      <p>
        En las fichas también mostramos la puntuación y el horario que el bar tiene en Google Maps, siempre identificados como tales. No son
        notas de Beerfy ni miden la tirada.
      </p>
    </LegalPage>
  )
}
