import type { Provider, SendMessageArgs } from './adapters';

// Minimal Gemini adapter. Uses non-streaming REST and yields chunks locally.
export const geminiProvider: Provider = {
  id: 'gemini',
  name: 'Gemini (Google)',
  meta: { browserSafe: true, supportsStreaming: false },
  async *sendMessageStream(args: SendMessageArgs) {
    // If no API key, throw to be handled by caller
    if (!args.apiKey) throw new Error('Missing Gemini API key');

    // Map messages to Gemini contents schema
    const contents = args.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
      signal: args.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gemini error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
    // Yield in small chunks to simulate streaming
    const pieces = text.split(/(\s+)/);
    for (const p of pieces) {
      if (args.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      yield p;
      await new Promise((r) => setTimeout(r, 10));
    }
  },
};

