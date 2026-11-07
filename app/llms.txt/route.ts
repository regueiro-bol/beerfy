import { CHAPTERS, FAQ } from '@/lib/content/bodega'
import { getPublishedCities, getRankedVenues } from '@/lib/supabase/queries'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** llms.txt: resumen en texto plano para asistentes de IA y buscadores generativos. */
export async function GET() {
  const base = SITE_URL
  const [cities, venues] = await Promise.all([getPublishedCities(), getRankedVenues(50)])

  const lines = [
    '# Beerfy',
    '',
    '> Guía colaborativa e independiente de bares que sirven cerveza de bodega (cerveza sin pasteurizar servida directamente desde tanque), empezando por Estrella Galicia de Bodega. La comunidad puntúa la tirada (temperatura, espuma, vaso y frescura) y la media es la «Nota de tirada» de 0 a 10.',
    '',
    'Beerfy no tiene afiliación con ninguna cervecera. Cada bar se revisa antes de publicarse. Los horarios y puntuaciones de Google que aparecen en las fichas proceden de Google Maps y no son valoraciones de Beerfy.',
    '',
    '## La Bodega (guía)',
    `- [La Bodega: guía de la cerveza de bodega](${base}/la-bodega): portada de la guía y preguntas frecuentes`,
    ...CHAPTERS.map((c) => `- [${c.title}](${base}/la-bodega/${c.slug}): ${c.short}`),
    '',
    '## Ciudades',
    ...cities.map((c) => `- [Cerveza de bodega en ${c.name}](${base}/${c.slug})`),
  ]
  if (venues.length) {
    lines.push('', '## Bares')
    for (const v of venues) {
      const nota = v.score !== null ? `Nota de tirada ${v.score.toFixed(1)} (${v.votes} votos)` : 'sin puntuaciones aún'
      lines.push(`- [${v.name}](${base}/${v.cities?.slug}/${v.slug}): ${[v.cities?.name, v.district].filter(Boolean).join(', ')}; ${nota}`)
    }
  }
  lines.push('', '## Preguntas frecuentes', ...FAQ.flatMap((f) => [`### ${f.q}`, f.a, '']))
  lines.push('## Otros', `- [Sugerir un bar](${base}/sugerir)`, `- [Sobre Beerfy](${base}/sobre-beerfy)`)

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
