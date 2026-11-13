import type Anthropic from '@anthropic-ai/sdk'
import { anthropic, CLAUDE_FAST_MODEL } from '@/lib/anthropic/client'
import { withAiLogging } from '@/lib/ai-logging'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Moderación de una nota antes de publicarla (web y app).
 *
 * - Reglas antifraude sin IA (gratis): enlaces o teléfonos, textos copiados, ráfagas de la misma persona.
 * - Si hay comentario, un modelo pequeño lo revisa: publicar, revisar (lo decide una persona) o devolver
 *   (insultos, odio, datos personales: se pide a quien escribe que lo corrija; no se guarda).
 * - La crítica dura pero educada SIEMPRE se publica: la nota de Beerfy vale porque es honesta.
 */

export const MODERATION_PROMPT_VERSION = 'moderation_v1'

export type ModerationVerdict = {
  /** visible: cuenta ya · pendiente: lo revisa el equipo antes de contar. */
  status: 'visible' | 'pendiente'
  /** Si viene, NO se guarda la nota: es el mensaje para que la persona corrija su comentario. */
  returnToUser?: string
  reason: string | null
  detail: Record<string, unknown>
}

type AiVerdict = {
  decision: 'publicar' | 'revisar' | 'devolver'
  categorias: string[]
  motivo: string
  mensaje_usuario?: string
}

const SYSTEM = `Moderas comentarios de Beerfy, una guía de bares con cerveza de bodega (en tanque) en España.
La gente puntúa cómo le han tirado la caña (temperatura, espuma, vaso, frescura) y deja un comentario corto.

Decide UNA de tres opciones:
- "publicar": opiniones normales sobre la cerveza, el servicio o el bar, en cualquier idioma, incluidas las críticas duras pero educadas ("la espuma un desastre", "el vaso venía caliente", "carísima"), ironía, jerga y tacos suaves que no van contra nadie.
- "devolver": el comentario debe corregirlo quien lo escribe: insultos o desprecios a personas (camareros, dueños, clientes), odio o discriminación, contenido sexual, amenazas, o datos personales de alguien identificable (nombre y apellidos, teléfono, matrícula, aspecto físico de un empleado).
- "revisar": lo decide una persona del equipo: publicidad o autopromoción (parece escrito por el propio bar o por la competencia), spam, acusaciones graves que podrían ser falsas (intoxicaciones, que rellenan la cerveza con otra, delitos), comentarios que no tienen nada que ver con el bar o la cerveza, o texto sin sentido.

Ante la duda entre publicar y revisar, publica si es una opinión. Nunca castigues una opinión negativa por ser negativa.
Si decides "devolver", escribe "mensaje_usuario": una frase amable en español, de tú, que diga qué cambiar, sin repetir el insulto.`

const TOOL: Anthropic.Tool = {
  name: 'veredicto',
  description: 'Veredicto de moderación del comentario',
  input_schema: {
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['publicar', 'revisar', 'devolver'] },
      categorias: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['opinion', 'critica', 'insulto', 'odio', 'sexual', 'amenaza', 'datos_personales', 'publicidad', 'spam', 'acusacion_grave', 'fuera_de_tema', 'sin_sentido'],
        },
      },
      motivo: { type: 'string', description: 'Motivo breve, en español, para el equipo de Beerfy.' },
      mensaje_usuario: { type: 'string', description: 'Solo si decision = devolver.' },
    },
    required: ['decision', 'categorias', 'motivo'],
  },
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export async function aiReview(comment: string, venueName: string, avg: number, ratingTarget?: string): Promise<AiVerdict> {
  return withAiLogging<AiVerdict>(
    { functionName: 'rating_moderation', promptVersion: MODERATION_PROMPT_VERSION, model: CLAUDE_FAST_MODEL, targetType: 'venue', targetId: ratingTarget },
    async () => {
      const res = await anthropic.messages.create(
        {
          model: CLAUDE_FAST_MODEL,
          max_tokens: 300,
          system: SYSTEM,
          tools: [TOOL],
          tool_choice: { type: 'tool', name: 'veredicto' },
          messages: [
            {
              role: 'user',
              content: `Bar: ${venueName}\nNota media que pone (sobre 5): ${avg.toFixed(1)}\nComentario (entre las marcas):\n<<<\n${comment}\n>>>`,
            },
          ],
        },
        { timeout: 8000, maxRetries: 1 }
      )
      const block = res.content.find((b) => b.type === 'tool_use')
      if (!block || block.type !== 'tool_use') throw new Error('Sin veredicto')
      const v = block.input as AiVerdict
      if (!['publicar', 'revisar', 'devolver'].includes(v.decision)) throw new Error('Veredicto no válido')
      return { result: v, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens }
    }
  )
}

export async function moderateRating(input: {
  venueId: string
  comment: string | null
  avg: number
  clientHash: string
}): Promise<ModerationVerdict> {
  const supabase = createServiceClient()
  const detail: Record<string, unknown> = {}
  const flags: string[] = []

  // Ráfaga de la misma persona: muchas notas a bares distintos en dos horas.
  const twoHours = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  const { count: burst } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', input.clientHash)
    .gte('created_at', twoHours)
  if ((burst ?? 0) >= 5) flags.push('muchas notas seguidas de la misma persona')

  const comment = input.comment?.trim() || null
  if (comment) {
    if (/https?:\/\/|www\.|\.(com|es|net)\b|@[a-z0-9_]{3,}|\b\d{3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{0,3}\b/i.test(comment)) {
      flags.push('enlace, usuario o teléfono en el comentario')
    }
    // Texto copiado de otra nota reciente (en cualquier bar).
    const n = norm(comment)
    if (n.length >= 25) {
      const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const { data: recent } = await supabase.from('ratings').select('comment').not('comment', 'is', null).gte('created_at', monthAgo).limit(500)
      if ((recent || []).some((r) => r.comment && norm(r.comment) === n)) flags.push('comentario idéntico a otro reciente')
    }
  }
  if (flags.length) detail.flags = flags

  if (comment) {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', input.venueId).maybeSingle()
    try {
      const v = await aiReview(comment, venue?.name ?? 'Bar', input.avg)
      detail.ai = v
      if (v.decision === 'devolver') {
        return {
          status: 'pendiente',
          returnToUser: v.mensaje_usuario?.trim() || 'Tu comentario incluye algo que no podemos publicar. Edítalo y vuelve a enviarlo.',
          reason: `IA: ${v.motivo}`,
          detail,
        }
      }
      if (v.decision === 'revisar') return { status: 'pendiente', reason: `IA: ${v.motivo}`, detail }
    } catch (e) {
      // Sin IA disponible: el comentario espera revisión humana; la nota no se pierde.
      detail.aiError = (e as Error).message
      return { status: 'pendiente', reason: 'Moderación automática no disponible', detail }
    }
  }

  if (flags.length) return { status: 'pendiente', reason: flags.join('; '), detail }
  return { status: 'visible', reason: null, detail }
}
