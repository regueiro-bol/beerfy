const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'
interface VoyageEmbedResponse {
  data: Array<{ embedding: number[]; index: number }>
  usage: { total_tokens: number }
}
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: VOYAGE_MODEL, input_type: 'document' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Voyage API error ${res.status}: ${text}`)
  }
  const json = (await res.json()) as VoyageEmbedResponse
  return json.data.sort((a, b) => a.index - b.index).map(d => d.embedding)
}
export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text])
  if (!embedding) throw new Error('Voyage returned no embeddings')
  return embedding
}
