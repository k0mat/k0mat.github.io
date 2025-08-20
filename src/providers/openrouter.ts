import type { Provider, SendMessageArgs, ChatMessage } from './adapters';
import { CORSBlockedError, ProviderAuthError, RateLimitError } from './adapters';

function toOpenAIChat(messages: ChatMessage[]) {
  return messages.map(m => ({ role: m.role, content: m.content }));
}

function extractTextFromData(data: unknown, includeReasoning: boolean): string {
  try {
    const obj = data as any;
    if (!obj) return '';
    const choices = obj.choices as any[] | undefined;
    if (!choices || choices.length === 0) return '';
    const c0 = choices[0];
    const delta = c0?.delta ?? {};
    let out = '';
    const content = delta?.content;
    const reasoning = delta?.reasoning;
    if (typeof content === 'string' && content) out += content;
    if (includeReasoning && typeof reasoning === 'string' && reasoning) out += reasoning;
    if (!out) {
      const finalMsg = c0?.message?.content;
      if (typeof finalMsg === 'string' && finalMsg) out += finalMsg;
    }
    return out;
  } catch {
    return '';
  }
}

async function *streamOpenRouter(args: SendMessageArgs): AsyncIterable<string> {
  if (!args.apiKey) throw new ProviderAuthError('Missing OpenRouter API key');
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body = {
    model: args.model,
    messages: toOpenAIChat(args.messages),
    temperature: args.temperature ?? 0.7,
    max_tokens: args.maxTokens ?? undefined,
    stream: true,
  } as const;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${args.apiKey}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: args.signal,
  }).catch((e) => {
    if ((e as any)?.name === 'AbortError') throw e;
    throw new CORSBlockedError('Network/CORS error contacting OpenRouter');
  });

  if (res.status === 401) throw new ProviderAuthError();
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const includeReasoning = args.includeReasoning !== false;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIdx;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const eventBlock = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);

        const lines = eventBlock.split('\n');
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          if (payload === '[DONE]') return;
          try {
            const json = JSON.parse(payload);
            const text = extractTextFromData(json, includeReasoning);
            if (text) yield text;
          } catch { /* ignore */ }
        }
      }
    }

    if (buffer) {
      for (const rawLine of buffer.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith(':')) continue;
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const text = extractTextFromData(json, includeReasoning);
          if (text) yield text;
        } catch { /* ignore */ }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

export const openRouterProvider: Provider = {
  id: 'openrouter',
  name: 'OpenRouter',
  meta: { browserSafe: true, supportsStreaming: true },
  sendMessageStream: streamOpenRouter,
};
