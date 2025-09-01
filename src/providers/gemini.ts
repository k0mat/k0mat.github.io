import type { Provider, SendMessageArgs } from './adapters';
import { ProviderAuthError, RateLimitError } from './adapters';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiResponse = {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
};

export const geminiProvider: Provider = {
  id: 'gemini',
  name: 'Gemini (Google)',
  meta: { browserSafe: true, supportsStreaming: true },
  async *sendMessageStream(args: SendMessageArgs) {
    if (!args.apiKey) throw new ProviderAuthError('Missing Gemini API key');

    const contents = args.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const url = `${GEMINI_API_URL}/${encodeURIComponent(args.model)}:streamGenerateContent?key=${encodeURIComponent(args.apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
      signal: args.signal,
    });

    if (res.status === 401) throw new ProviderAuthError();
    if (res.status === 429) throw new RateLimitError();
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gemini error ${res.status}: ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIdx;
        while ((sepIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, sepIdx).trim();
          buffer = buffer.slice(sepIdx + 1);
          if (line.startsWith('data:')) {
            try {
              const json = JSON.parse(line.slice(5)) as GeminiResponse;
              const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
              if (text) yield text;
            } catch { /* ignore */ }
          }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch {}
    }
  },
};

