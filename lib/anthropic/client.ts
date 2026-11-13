import Anthropic from '@anthropic-ai/sdk'
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
export const CLAUDE_MODEL = 'claude-sonnet-4-6'
/** Modelo pequeño y barato (con visión) para tareas de volumen: moderar comentarios y revisar fotos. */
export const CLAUDE_FAST_MODEL = 'claude-haiku-5-5'

/** USD por millón de tokens (entrada/salida). Haiku 5.5: tarifa para peticiones de menos de 100.000 tokens. */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
}
export const PRICING_PER_MTOK = PRICING[CLAUDE_MODEL]!

export function estimateCostUsd(inputTokens: number, outputTokens: number, model: string = CLAUDE_MODEL): number {
  const p = PRICING[model] ?? PRICING_PER_MTOK
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000
}
