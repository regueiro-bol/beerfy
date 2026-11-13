import { randomUUID } from 'crypto'
import sharp from 'sharp'
import type Anthropic from '@anthropic-ai/sdk'
import { anthropic, CLAUDE_FAST_MODEL } from '@/lib/anthropic/client'
import { withAiLogging } from '@/lib/ai-logging'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Verificación del tanque con foto (web y app).
 *
 * Alguien en el bar fotografía el tanque o el grifo con el rótulo de bodega. Un modelo con visión
 * dice qué se ve. Si está clarísimo y la persona está en el bar (GPS), la cerveza queda confirmada
 * en ese bar sin intervención; lo dudoso lo revisa el equipo; lo que no es un tanque se devuelve.
 *
 * Privacidad: la foto se guarda en un depósito privado, sin metadatos (se quita la ubicación EXIF),
 * reducida a 1600 px. No se publica: solo la ve el equipo para verificar.
 */

export const PHOTO_PROMPT_VERSION = 'tank_photo_v1'
const BUCKET = 'verificaciones'
const RADIUS_M = 120
const MIN_CONFIDENCE = 0.8
const MAX_PER_DAY = 6

export type PhotoAi = {
  muestra: 'tanque' | 'grifo_bodega' | 'tanque_y_grifo' | 'solo_vaso' | 'otra_cosa'
  marca: 'Estrella Galicia' | 'Mahou' | 'Otra' | 'No se ve'
  producto: string
  dentro_de_bar: boolean
  parece_captura_o_de_internet: boolean
  hay_caras: boolean
  confianza: number
  explicacion: string
}

export type PhotoResult = {
  ok: boolean
  status?: 'confirmada' | 'revisar' | 'rechazada'
  /** Mensaje para quien envía la foto. */
  message: string
  beer?: string | null
}

const SYSTEM = `Revisas fotos que manda la comunidad de Beerfy, una guía de bares con cerveza de bodega (cerveza sin pasteurizar servida desde tanques en el propio bar).
Tienes que decir qué se ve. Pistas:
- Tanque: depósito grande metálico (cobre o acero) en la barra, en la pared, en una sala o en la bodega del bar, a menudo con el logotipo de la cervecera y la palabra «Bodega» o «Tanque».
- Grifo de bodega: grifo o columna de cerveza con un rótulo o chapa de «Cerveza de Bodega», «Estrella Galicia de Bodega», «1906 de Bodega» o «Mahou de Bodega/Tanque».
- Una caña o un vaso solos no demuestran que haya tanque ("solo_vaso").
- Si parece una captura de pantalla, una foto de internet, publicidad o una imagen generada, márcalo.
Sé prudente: la confianza alta (0,8 o más) es solo cuando el tanque o el rótulo se ven con claridad.
"producto": el nombre de la cerveza que se lee (por ejemplo "Estrella Galicia de Bodega", "1906 de Bodega") o "" si no se lee.
"explicacion": una frase en español, para el equipo.`

const TOOL: Anthropic.Tool = {
  name: 'analisis_foto',
  description: 'Qué se ve en la foto',
  input_schema: {
    type: 'object',
    properties: {
      muestra: { type: 'string', enum: ['tanque', 'grifo_bodega', 'tanque_y_grifo', 'solo_vaso', 'otra_cosa'] },
      marca: { type: 'string', enum: ['Estrella Galicia', 'Mahou', 'Otra', 'No se ve'] },
      producto: { type: 'string' },
      dentro_de_bar: { type: 'boolean' },
      parece_captura_o_de_internet: { type: 'boolean' },
      hay_caras: { type: 'boolean' },
      confianza: { type: 'number', minimum: 0, maximum: 1 },
      explicacion: { type: 'string' },
    },
    required: ['muestra', 'marca', 'producto', 'dentro_de_bar', 'parece_captura_o_de_internet', 'hay_caras', 'confianza', 'explicacion'],
  },
}

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export async function analyzeTankPhoto(jpeg: Buffer, context: string, targetId?: string): Promise<PhotoAi> {
  return withAiLogging<PhotoAi>(
    { functionName: 'tank_photo_check', promptVersion: PHOTO_PROMPT_VERSION, model: CLAUDE_FAST_MODEL, targetType: 'venue', targetId },
    async () => {
      const res = await anthropic.messages.create(
        {
          model: CLAUDE_FAST_MODEL,
          max_tokens: 400,
          system: SYSTEM,
          tools: [TOOL],
          tool_choice: { type: 'tool', name: 'analisis_foto' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } },
                { type: 'text', text: context },
              ],
            },
          ],
        },
        { timeout: 20000, maxRetries: 1 }
      )
      const block = res.content.find((b) => b.type === 'tool_use')
      if (!block || block.type !== 'tool_use') throw new Error('Sin análisis')
      return { result: block.input as PhotoAi, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens }
    }
  )
}

/** Qué cerveza de la base corresponde a lo que se lee en la foto. */
function matchBeerSlug(ai: PhotoAi): string | null {
  const p = `${ai.producto} ${ai.marca}`.toLowerCase()
  if (p.includes('1906')) return '1906-de-bodega'
  if (ai.marca === 'Estrella Galicia' || p.includes('estrella')) return 'estrella-galicia-de-bodega'
  return null
}

export async function submitPhotoCheck(input: {
  file: ArrayBuffer
  venueId?: string | null
  suggestionId?: string | null
  lat?: number
  lng?: number
  acc?: number
  clientHash: string
}): Promise<PhotoResult> {
  const supabase = createServiceClient()
  if (!input.venueId && !input.suggestionId) return { ok: false, message: 'Falta el bar.' }

  // Límite diario por persona.
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await supabase.from('photo_checks').select('id', { count: 'exact', head: true }).eq('client_hash', input.clientHash).gte('created_at', dayAgo)
  if ((count ?? 0) >= MAX_PER_DAY) return { ok: false, message: 'Has enviado muchas fotos hoy. Inténtalo mañana.' }

  // Foto: girada según EXIF, sin metadatos, máx. 1600 px, JPEG.
  let jpeg: Buffer
  try {
    jpeg = await sharp(Buffer.from(input.file)).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  } catch {
    return { ok: false, message: 'No hemos podido leer la imagen. Prueba con otra foto (JPG o PNG).' }
  }

  let venue: { id: string; name: string; latitude: number | null; longitude: number | null; status: string } | null = null
  let distance: number | null = null
  if (input.venueId) {
    const { data } = await supabase.from('venues').select('id, name, latitude, longitude, status').eq('id', input.venueId).maybeSingle()
    venue = data
    if (!venue || venue.status !== 'published') return { ok: false, message: 'Este bar no está disponible.' }
    // Como al puntuar: hay que estar en el bar.
    const { lat, lng, acc } = input
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return { ok: false, message: 'Necesitamos comprobar que estás en el bar. Permite la ubicación e inténtalo de nuevo.' }
    }
    if (venue.latitude !== null && venue.longitude !== null) {
      distance = Math.round(distanceM({ lat: lat!, lng: lng! }, { lat: Number(venue.latitude), lng: Number(venue.longitude) }))
      const allowed = RADIUS_M + Math.min(Number.isFinite(acc) && (acc as number) > 0 ? (acc as number) : 0, 150)
      if (distance > allowed) return { ok: false, message: 'Parece que no estás en el bar. La foto hay que hacerla en el propio local.' }
    }
  } else {
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
    const { data: sug } = await supabase.from('venue_suggestions').select('id, venue_name, status, created_at').eq('id', input.suggestionId!).maybeSingle()
    if (!sug || sug.created_at < hourAgo) return { ok: false, message: 'Esta sugerencia ya no admite fotos.' }
  }

  // Guardar en privado.
  const folder = venue ? `bares/${venue.id}` : `sugerencias/${input.suggestionId}`
  const path = `${folder}/${randomUUID()}.jpg`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, jpeg, { contentType: 'image/jpeg', upsert: false })
  if (upErr) {
    console.error('photo upload', upErr)
    return { ok: false, message: 'No hemos podido guardar la foto. Inténtalo de nuevo.' }
  }

  // Análisis con IA.
  let ai: PhotoAi | null = null
  try {
    ai = await analyzeTankPhoto(jpeg, venue ? `Foto hecha en el bar «${venue.name}».` : 'Foto enviada con la sugerencia de un bar nuevo.', venue?.id)
  } catch (e) {
    console.error('photo ai', e)
  }

  const shows = ai && ['tanque', 'grifo_bodega', 'tanque_y_grifo'].includes(ai.muestra)
  // Sin coordenadas del bar no podemos comprobar que la foto es de allí: decide el equipo.
  const located = !venue || distance !== null
  const clear = located && !!ai && !!shows && ai.confianza >= MIN_CONFIDENCE && !ai.parece_captura_o_de_internet && ai.dentro_de_bar !== false
  const notTank = !!ai && (ai.muestra === 'otra_cosa' || ai.parece_captura_o_de_internet) && ai.confianza >= 0.7

  let status: 'confirmada' | 'revisar' | 'rechazada' = 'revisar'
  let reason = ai ? ai.explicacion : 'Análisis automático no disponible'
  let beerName: string | null = null
  let message = 'Gracias. El equipo de Beerfy revisará la foto.'

  if (notTank) {
    status = 'rechazada'
    message = ai!.parece_captura_o_de_internet
      ? 'La foto parece una captura o una imagen de internet. Haz una foto tuya del tanque o del grifo en el bar.'
      : 'No vemos un tanque ni el grifo de bodega en la foto. Prueba con otra en la que se vean bien.'
  } else if (venue && clear) {
    // ¿Qué cerveza confirma? Solo se confirman las que ya están en el bar; una nueva la decide el equipo.
    const { data: rows } = await supabase.from('venue_beers').select('beer_id, status, source, beers(slug, name)').eq('venue_id', venue.id).neq('status', 'retirada')
    const listed = (rows || []) as unknown as Array<{ beer_id: string; status: string; source: string; beers: { slug: string; name: string } | null }>
    const slug = matchBeerSlug(ai!)
    const target = slug ? listed.find((r) => r.beers?.slug === slug) : listed.length === 1 ? listed[0] : undefined
    if (target) {
      const now = new Date().toISOString()
      await supabase
        .from('venue_beers')
        .update({ status: 'confirmada', last_confirmed_at: now, ...(target.status === 'por_confirmar' ? { source: 'comunidad' } : {}) })
        .eq('venue_id', venue.id)
        .eq('beer_id', target.beer_id)
      status = 'confirmada'
      beerName = target.beers?.name ?? null
      reason = `Confirmada con foto: ${ai!.explicacion}`
      message = `¡Confirmado! Gracias: ${beerName ?? 'la cerveza de bodega'} queda verificada en ${venue.name}.`
    } else {
      reason = slug ? `Posible cerveza nueva en el bar (${ai!.producto || slug}). ${ai!.explicacion}` : `Tanque sin marca legible. ${ai!.explicacion}`
      message = 'Gracias. Vemos el tanque; el equipo confirmará qué cerveza es.'
    }
  } else if (!venue && clear) {
    // Sugerencias: la foto ayuda a decidir, pero el bar lo publica el equipo o la validación automática.
    status = 'confirmada'
    reason = `La foto muestra un tanque o grifo de bodega. ${ai!.explicacion}`
    message = 'Gracias, la foto nos ayuda a verificar el bar más rápido.'
  }

  await supabase.from('photo_checks').insert({
    venue_id: venue?.id ?? null,
    suggestion_id: venue ? null : input.suggestionId,
    storage_path: path,
    status,
    ai_result: ai,
    decision_reason: reason,
    distance_m: distance,
    client_hash: input.clientHash,
  })

  return { ok: status !== 'rechazada', status, message, beer: beerName }
}
