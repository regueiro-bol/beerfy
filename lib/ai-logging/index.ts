import { estimateCostUsd } from '@/lib/anthropic/client'
import { createServiceClient } from '@/lib/supabase/service'

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

  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('ai_usage_log').insert({
      function_name: record.functionName,
      prompt_version: record.promptVersion,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      estimated_cost_usd: cost,
      duration_ms: record.durationMs,
      status: record.status,
      target_type: record.targetType || null,
      target_id: record.targetId || null,
      error_detail: record.errorDetail || null,
    })

    if (error) {
      console.error('Error inserting AI usage log to database:', error)
    }
  } catch (e) {
    console.error('Failed to log AI usage to database:', e)
  }
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
