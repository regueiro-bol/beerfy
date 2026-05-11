import { estimateCostUsd } from '@/lib/anthropic/client'
export interface AiUsageRecord {
  functionName: string
  promptVersion: string
  model: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  status: 'success' | 'error' | 'rate_limited'
  targetType?: string
  targetId?: string
  errorDetail?: string
}
export async function logAiUsage(record: AiUsageRecord): Promise<void> {
  const cost = estimateCostUsd(record.inputTokens, record.outputTokens)
  console.log('[AI USAGE]', { ...record, estimatedCostUsd: cost.toFixed(4) })
}
export async function withAiLogging<T>(
  meta: { functionName: string; promptVersion: string; model: string; targetType?: string; targetId?: string },
  fn: () => Promise<{ result: T; inputTokens: number; outputTokens: number }>
): Promise<T> {
  const start = Date.now()
  try {
    const { result, inputTokens, outputTokens } = await fn()
    await logAiUsage({ ...meta, inputTokens, outputTokens, durationMs: Date.now() - start, status: 'success' })
    return result
  } catch (e) {
    await logAiUsage({ ...meta, inputTokens: 0, outputTokens: 0, durationMs: Date.now() - start, status: 'error', errorDetail: (e as Error).message })
    throw e
  }
}
