import Anthropic from '@anthropic-ai/sdk'
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
export const CLAUDE_MODEL = 'claude-sonnet-4-6'
export const PRICING_PER_MTOK = { input: 3, output: 15 } as const
export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICING_PER_MTOK.input + outputTokens * PRICING_PER_MTOK.output) / 1_000_000
}
