import { anthropic, CLAUDE_MODEL } from './client'
import { withAiLogging } from '@/lib/ai-logging'
import { DESCRIPTION_GENERATOR_V1 } from '@/lib/prompts/description-generator.v1'
import type { Anthropic } from '@anthropic-ai/sdk'

export interface GenerateInput {
  name: string
  cityName: string
  placesData: unknown
  editorNote?: string
}

export interface GenerateOutput {
  description: string
  meta_title: string
  meta_description: string
  highlights: string[]
  suggested_district: string
  tone: 'classic' | 'modern' | 'sports' | 'family' | 'cervecero' | 'fiestero'
}

export async function generateVenueDescription(input: GenerateInput): Promise<GenerateOutput> {
  const promptText = DESCRIPTION_GENERATOR_V1.prompt
    .replace('{name}', input.name)
    .replace('{cityName}', input.cityName)
    .replace('{placesData}', JSON.stringify(input.placesData, null, 2))
    .replace('{editorNote}', input.editorNote || 'N/A')

  return withAiLogging<GenerateOutput>(
    {
      functionName: 'description_generator',
      promptVersion: DESCRIPTION_GENERATOR_V1.version,
      model: CLAUDE_MODEL,
      targetType: 'venue',
    },
    async () => {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: 'Eres un recomendador experto en cerveza. Responde estructuradamente usando la herramienta proporcionada.',
        messages: [{ role: 'user', content: promptText }],
        tools: [
          {
            name: 'format_description',
            description: 'Format the editorial review and metadata for the venue',
            input_schema: DESCRIPTION_GENERATOR_V1.jsonSchema as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: 'format_description' },
      })

      const toolUseBlock = response.content.find((block) => block.type === 'tool_use')
      if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
        throw new Error('Claude failed to return a tool_use block')
      }

      const result = toolUseBlock.input as unknown as GenerateOutput
      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens

      return {
        result,
        inputTokens,
        outputTokens,
      }
    }
  )
}
