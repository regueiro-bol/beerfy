import { withAiLogging } from './lib/ai-logging/index.js';

async function main() {
  await withAiLogging(
    { functionName: 'test', promptVersion: 'v1', model: 'claude-sonnet-4-6' },
    async () => {
      return { result: 'ok', inputTokens: 100, outputTokens: 50 };
    }
  );
}
main().catch(console.error);
