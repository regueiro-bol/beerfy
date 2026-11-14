import { randomUUID } from 'crypto'
import sharp from 'sharp'
import type Anthropic from '@anthropic-ai/sdk'
import { anthropic, CLAUDE_FAST_MODEL } from '@/lib/anthropic/client'
import { withAiLogging } from '@/lib/ai-logging'
import { createServiceClient } from '@/lib/supabase/service'
import { photoToken } from '@/lib/ratings/submit'

/**
 * Doble criterio al puntuar:
 *  1. «servida»: foto a los pocos segundos de tirarla → la IA valora el aspecto (espuma, vaso, frío, claridad, llenado).
 *  2. la nota de la persona, tras catarla.
 *  3. «encaje»: foto a mitad de caña → la IA mira el encaje de Bruselas (aros de espuma en el vaso, uno por trago).
 *
 * De momento el veredicto solo lo ve el equipo (calibración); las fotos son privadas y sin EXIF.
 */

export const POUR_PROMPT_VERSION = 'pour_v1'
const BUCKET = 'verificaciones'
/** Una foto «recién tirada» subida más tarde de esto no cuenta como recién tirada. */
const FRESH_MIN = 20

export type PourKind = 'servida' | 'encaje'

const SYSTEM_SERVIDA = `Eres un maestro tirador de cerveza de bodega en España. Valoras por la foto cómo está tirada una caña, hecha a los pocos segundos de servirla.
Fíjate en:
- Espuma: altura (lo ideal son unos dos dedos), textura (cremosa y de burbuja fina es buena; pompas gruesas que se deshacen es mala), que esté compacta.
- Vaso: si es el adecuado para la cerveza y si está limpio (burbujas pegadas a las paredes por dentro indican vaso mal enjuagado).
- Frío: vaho o gotas por fuera del vaso.
- Claridad y color: brillante, sin turbidez rara.
- Llenado: ni corta ni desbordada.
"nota": de 0 a 10 con un decimal, solo por el aspecto. Sé exigente pero justo: 8 o más es una caña muy bien tirada.
"comentario": una sola frase en español, impersonal, concreta y sin exagerar (por ejemplo: «Espuma cremosa de dos dedos, vaso frío y limpio; llenado justo»).
"confianza": lo seguro que estás de tu valoración (baja si la foto está borrosa, muy oscura o la caña se ve mal).
Si la foto no es una cerveza tirada en un vaso, o parece una imagen de internet o una captura, márcalo.`

const SYSTEM_ENCAJE = `Eres un maestro tirador de cerveza de bodega en España. La foto es de una caña a medio beber.
Buscas el «encaje de Bruselas»: los aros o marcas de espuma que se quedan pegados a la pared del vaso con cada trago. Muchos aros, regulares y que se mantienen indican buena espuma y vaso limpio. Sin aros (paredes limpias de espuma) suele indicar vaso con restos de grasa o detergente, o espuma pobre.
"nota": de 0 a 10 con un decimal, solo por el encaje.
"comentario": una frase en español, impersonal y concreta (por ejemplo: «Cuatro aros bien marcados y regulares: vaso limpio y buena espuma»).
"confianza": lo seguro que estás (baja si la foto no deja ver bien las paredes).
Si la foto no es una cerveza en un vaso, o parece de internet o una captura, márcalo.`

const TOOL_SERVIDA: Anthropic.Tool = {
  name: 'valoracion_servida',
  description: 'Valoración del aspecto de la caña recién tirada',
  input_schema: {
    type: 'object',
    properties: {
      es_cerveza_en_vaso: { type: 'boolean' },
      parece_captura_o_de_internet: { type: 'boolean' },
      espuma_dedos: { type: 'number', minimum: 0, maximum: 5 },
      espuma_textura: { type: 'string', enum: ['cremosa', 'normal', 'gruesa', 'sin_espuma'] },
      vaso_adecuado: { type: 'boolean' },
      vaso_limpio: { type: 'string', enum: ['si', 'no', 'no_se_ve'] },
      frio_visible: { type: 'boolean' },
      claridad: { type: 'string', enum: ['brillante', 'normal', 'turbia'] },
      llenado: { type: 'string', enum: ['correcto', 'corto', 'desbordada'] },
      nota: { type: 'number', minimum: 0, maximum: 10 },
      comentario: { type: 'string' },
      confianza: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['es_cerveza_en_vaso', 'parece_captura_o_de_internet', 'espuma_dedos', 'espuma_textura', 'vaso_adecuado', 'vaso_limpio', 'frio_visible', 'claridad', 'llenado', 'nota', 'comentario', 'confianza'],
  },
}

const TOOL_ENCAJE: Anthropic.Tool = {
  name: 'valoracion_encaje',
  description: 'Valoración del encaje de Bruselas',
  input_schema: {
    type: 'object',
    properties: {
      es_cerveza_en_vaso: { type: 'boolean' },
      parece_captura_o_de_internet: { type: 'boolean' },
      se_ve_encaje: { type: 'boolean' },
      aros: { type: 'integer', minimum: 0, maximum: 20 },
      regularidad: { type: 'string', enum: ['regular', 'irregular', 'sin_aros'] },
      vaso_limpio: { type: 'string', enum: ['si', 'no', 'no_se_ve'] },
      nota: { type: 'number', minimum: 0, maximum: 10 },
      comentario: { type: 'string' },
      confianza: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['es_cerveza_en_vaso', 'parece_captura_o_de_internet', 'se_ve_encaje', 'aros', 'regularidad', 'vaso_limpio', 'nota', 'comentario', 'confianza'],
  },
}

export type PourAi = {
  es_cerveza_en_vaso: boolean
  parece_captura_o_de_internet: boolean
  nota: number
  comentario: string
  confianza: number
  [k: string]: unknown
}

export async function analyzePour(jpeg: Buffer, kind: PourKind, targetId?: string): Promise<PourAi> {
  const tool = kind === 'servida' ? TOOL_SERVIDA : TOOL_ENCAJE
  return withAiLogging<PourAi>(
    { functionName: `pour_${kind}`, promptVersion: POUR_PROMPT_VERSION, model: CLAUDE_FAST_MODEL, targetType: 'rating', targetId },
    async () => {
      const res = await anthropic.messages.create(
        {
          model: CLAUDE_FAST_MODEL,
          max_tokens: 400,
          system: kind === 'servida' ? SYSTEM_SERVIDA : SYSTEM_ENCAJE,
          tools: [tool],
          tool_choice: { type: 'tool', name: tool.name },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } },
                { type: 'text', text: kind === 'servida' ? 'Valora cómo está tirada esta caña.' : 'Valora el encaje de Bruselas de esta caña.' },
              ],
            },
          ],
        },
        { timeout: 20000, maxRetries: 1 }
      )
      const block = res.content.find((b) => b.type === 'tool_use')
      if (!block || block.type !== 'tool_use') throw new Error('Sin valoración')
      return { result: block.input as PourAi, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens }
    }
  )
}

export async function toJpeg(file: ArrayBuffer): Promise<Buffer> {
  return sharp(Buffer.from(file)).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
}

export type RatingPhotoResult = { ok: boolean; message: string }

export async function submitRatingPhoto(input: {
  file: ArrayBuffer
  ratingId: string
  kind: PourKind
  takenAt: number | null
  token: string
  clientHash: string
}): Promise<RatingPhotoResult> {
  const supabase = createServiceClient()
  const { data: rating } = await supabase
    .from('ratings')
    .select('id, venue_id, ip_hash, created_at, status, score_temperature, score_foam, score_glass, score_freshness, moderation_reason')
    .eq('id', input.ratingId)
    .maybeSingle()
  // Solo quien puntuó (con la clave que recibió al puntuar), y como mucho 3 horas después.
  if (!rating || input.token !== photoToken(rating.id as string)) return { ok: false, message: 'No encontramos tu nota.' }
  const ratedAt = new Date(rating.created_at as string).getTime()
  if (Date.now() - ratedAt > 3 * 3600 * 1000) return { ok: false, message: 'Ya ha pasado demasiado tiempo para añadir fotos a esta nota.' }

  const { data: existing } = await supabase.from('rating_photos').select('id').eq('rating_id', rating.id).eq('kind', input.kind).maybeSingle()
  if (existing) return { ok: false, message: 'Ya has subido esta foto.' }

  let jpeg: Buffer
  try {
    jpeg = await toJpeg(input.file)
  } catch {
    return { ok: false, message: 'No hemos podido leer la imagen. Prueba con otra foto.' }
  }

  const now = Date.now()
  const takenAt = input.takenAt && Number.isFinite(input.takenAt) && input.takenAt <= now + 60_000 ? input.takenAt : null
  const fresh =
    input.kind === 'servida'
      ? takenAt !== null && now - takenAt <= FRESH_MIN * 60_000
      : takenAt !== null && takenAt >= ratedAt - 30 * 60_000 // el encaje se fotografía después de empezar a beber

  const path = `canas/${rating.venue_id}/${randomUUID()}.jpg`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, jpeg, { contentType: 'image/jpeg' })
  if (upErr) return { ok: false, message: 'No hemos podido guardar la foto. Inténtalo de nuevo.' }

  let ai: PourAi | null = null
  try {
    ai = await analyzePour(jpeg, input.kind, rating.id as string)
  } catch (e) {
    console.error('pour ai', e)
  }
  const valid = !!ai && ai.es_cerveza_en_vaso && !ai.parece_captura_o_de_internet
  const score = valid ? Math.round(Math.min(10, Math.max(0, ai!.nota)) * 10) / 10 : null

  await supabase.from('rating_photos').insert({
    rating_id: rating.id,
    venue_id: rating.venue_id,
    kind: input.kind,
    storage_path: path,
    taken_at: takenAt ? new Date(takenAt).toISOString() : null,
    fresh,
    ai_result: ai,
    ai_score: score,
    ai_comment: valid ? ai!.comentario : null,
    client_hash: input.clientHash,
  })

  // Cruce: un 9 o más con una caña que en la foto (recién tirada y clara) está mal → revisión.
  if (input.kind === 'servida' && valid && fresh && ai!.confianza >= 0.7 && score !== null && score <= 4 && rating.status === 'visible') {
    const avg10 = ((Number(rating.score_temperature) + Number(rating.score_foam) + Number(rating.score_glass) + Number(rating.score_freshness)) / 4) * 2
    if (avg10 >= 9) {
      await supabase
        .from('ratings')
        .update({
          status: 'pendiente',
          moderation_reason: [rating.moderation_reason, `Nota ${avg10.toFixed(1)} pero la foto de la caña recién servida saca ${score} de aspecto`].filter(Boolean).join('; '),
        })
        .eq('id', rating.id)
    }
  }

  if (!ai) return { ok: true, message: 'Foto guardada. Gracias.' }
  if (!valid) return { ok: true, message: 'Foto guardada, aunque no parece una caña recién servida.' }
  return {
    ok: true,
    message: input.kind === 'servida' ? '¡Foto de la caña guardada! Gracias.' : '¡Foto del encaje guardada! Gracias.',
  }
}
