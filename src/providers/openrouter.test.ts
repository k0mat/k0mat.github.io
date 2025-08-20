import { describe, it, expect, vi } from 'vitest';
import { openRouterProvider } from './openrouter';

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
const sseSample = `data: {"choices":[{"delta":{"role":"assistant","content":"","reasoning":"Okay"}}]}` + "\n\n" +
`data: {"choices":[{"delta":{"role":"assistant","content":"","reasoning":", the"}}]}` + "\n\n" +
`data: {"choices":[{"delta":{"role":"assistant","content":"","reasoning":" user sent"}}]}` + "\n\n" +
`data: [DONE]\n\n`;

describe('openRouterProvider streaming (reasoning support)', () => {
  it('concatenates reasoning deltas into output text', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeReaderFromString(sseSample),
    });
    (globalThis as any).fetch = mockFetch;

    const chunks: string[] = [];
    const iter = openRouterProvider.sendMessageStream({
      model: 'deepseek/deepseek-r1',
      messages: [{ role: 'user', content: 'hello' }],
      apiKey: 'test',
    });

    for await (const c of iter) chunks.push(c);
    const out = chunks.join('');

    expect(out).toContain('Okay, the user sent');
  });

  it('omits reasoning when includeReasoning is false', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeReaderFromString(sseSample),
    });
    (globalThis as any).fetch = mockFetch;

    const chunks: string[] = [];
    const iter = openRouterProvider.sendMessageStream({
      model: 'deepseek/deepseek-r1',
      messages: [{ role: 'user', content: 'hello' }],
      apiKey: 'test',
      includeReasoning: false,
    });

    for await (const c of iter) chunks.push(c);
    const out = chunks.join('');

    // Our sample contains only reasoning tokens, so output should be empty
    expect(out).toBe('');
  });
});
