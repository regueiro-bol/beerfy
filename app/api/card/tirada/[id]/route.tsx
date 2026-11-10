import { ImageResponse } from 'next/og'
import { createServiceClient } from '@/lib/supabase/service'
import { loadFonts, loadImage, TiradaStory } from '@/lib/share/cards'

const s5 = (n: number | null) => (n ? n * 2 : null)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('No encontrado', { status: 404 })
  const supabase = createServiceClient()
  const { data: r } = await supabase
    .from('ratings')
    .select('id, rating, score_temperature, score_foam, score_glass, score_freshness, comment, status, created_at, venues(name, cover_image_url)')
    .eq('id', id)
    .maybeSingle()
  if (!r || r.status === 'hidden') return new Response('No encontrado', { status: 404 })
  const v = (Array.isArray(r.venues) ? r.venues[0] : r.venues) as { name: string; cover_image_url: string | null } | null
  const crit = [
    { name: 'Temperatura', v: s5(r.score_temperature) },
    { name: 'Espuma', v: s5(r.score_foam) },
    { name: 'Vaso', v: s5(r.score_glass) },
    { name: 'Frescura', v: s5(r.score_freshness) },
  ]
  const vals = crit.map((c) => c.v).filter((x): x is number => x !== null)
  const score = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : Number(r.rating) * 2
  const [fonts, img] = await Promise.all([loadFonts(), loadImage(v?.cover_image_url ?? null)])
  const date = new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  return new ImageResponse(
    <TiradaStory venue={v?.name ?? 'Beerfy'} score={score} crit={crit} comment={r.status === 'visible' ? r.comment : null} img={img} date={date} />,
    { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
  )
}
