import { describe, it, expect, vi } from 'vitest';
import { geminiProvider } from './gemini';

// Minimal reader stub to simulate a ReadableStream with a single chunk
function makeReaderFromString(s: string) {
  const enc = new TextEncoder();
  const bytes = enc.encode(s);
  let sent = false;
  return {
    getReader() {
      return {
        async read() {
          if (sent) return { done: true, value: undefined as unknown as Uint8Array };
          sent = true;
          return { done: false, value: bytes };
        },
        releaseLock() { /* noop */ },
      };
    },
  } as unknown as ReadableStream<Uint8Array>;
}

// Create SSE stream text from a subset of the provided log
const sseSample = `data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}` + "\n" +
`data: {"candidates":[{"content":{"parts":[{"text":", "}]}}]} ` + "\n" +
`data: {"candidates":[{"content":{"parts":[{"text":"world!"}]}}]} ` + "\n";

describe('geminiProvider streaming', () => {
  it('concatenates deltas into output text', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeReaderFromString(sseSample),
    });
    (globalThis as any).fetch = mockFetch;

    const chunks: string[] = [];
    const iter = geminiProvider.sendMessageStream({
      model: 'gemini-1.5-flash',
      messages: [{ role: 'user', content: 'hello' }],
      apiKey: 'test',
    });

    for await (const c of iter) chunks.push(c);
    const out = chunks.join('');

    expect(out).toContain('Hello, world!');
  });
});
