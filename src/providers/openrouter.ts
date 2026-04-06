import type { Provider, SendMessageArgs, ChatMessage, ToolCall, ToolDefinition } from './adapters';
import { CORSBlockedError, ProviderAuthError, RateLimitError } from './adapters';

/**
 * Special prefix emitted as a stream chunk when the model returns tool calls
 * instead of (or in addition to) text content.
 * The hook that consumes the stream detects this and handles the tool-call loop.
 */
export const TOOL_CALLS_PREFIX = '\x00TOOL_CALLS:';

function toOpenAIChat(messages: ChatMessage[]) {
  return messages.map((m) => {
    const base: Record<string, unknown> = { role: m.role, content: m.content };
    if (m.toolCallId) base['tool_call_id'] = m.toolCallId;
    if (m.toolCalls && m.toolCalls.length > 0) base['tool_calls'] = m.toolCalls;
    return base;
  });
}

function toOpenAITools(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

type OpenRouterDelta = {
  content?: string | null;
  reasoning?: string | null;
  tool_calls?: {
    index: number;
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }[];
};

type OpenRouterResponse = {
  choices: {
    delta?: OpenRouterDelta;
    message?: { content?: string; tool_calls?: ToolCall[] };
    finish_reason?: string | null;
  }[];
};

function extractTextFromData(data: unknown, includeReasoning: boolean): string {
  try {
    const obj = data as OpenRouterResponse;
    if (!obj) return '';
    const choices = obj.choices;
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

/** Accumulate streamed tool_calls fragments (arguments come in pieces) */
function mergeToolCallFragments(
  acc: Map<number, { id: string; type: string; name: string; arguments: string }>,
  fragments: NonNullable<OpenRouterDelta['tool_calls']>
) {
  for (const frag of fragments) {
    const idx = frag.index;
    if (!acc.has(idx)) {
      acc.set(idx, { id: frag.id ?? '', type: frag.type ?? 'function', name: frag.function?.name ?? '', arguments: '' });
    }
    const entry = acc.get(idx)!;
    if (frag.id) entry.id = frag.id;
    if (frag.function?.name) entry.name = frag.function.name;
    if (frag.function?.arguments) entry.arguments += frag.function.arguments;
  }
}

async function* streamOpenRouter(args: SendMessageArgs): AsyncIterable<string> {
  if (!args.apiKey) throw new ProviderAuthError('Missing OpenRouter API key');
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body: Record<string, unknown> = {
    model: args.model,
    messages: toOpenAIChat(args.messages),
    temperature: args.temperature ?? 0.7,
    max_tokens: args.maxTokens ?? undefined,
    stream: true,
  };

  if (args.tools && args.tools.length > 0) {
    body['tools'] = toOpenAITools(args.tools);
    body['tool_choice'] = 'auto';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: args.signal,
  }).catch((e) => {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new CORSBlockedError('Network/CORS error contacting OpenRouter');
  });

  if (res.status === 401) throw new ProviderAuthError();
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const includeReasoning = args.includeReasoning !== false;

  // Accumulate tool_call fragments across stream events
  const toolCallAcc = new Map<number, { id: string; type: string; name: string; arguments: string }>();

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
          if (payload === '[DONE]') {
            // Emit accumulated tool calls if any
            if (toolCallAcc.size > 0) {
              const toolCalls: ToolCall[] = Array.from(toolCallAcc.values()).map((tc) => ({
                id: tc.id || `call_${crypto.randomUUID()}`,
                type: 'function' as const,
                function: { name: tc.name, arguments: tc.arguments },
              }));
              yield `${TOOL_CALLS_PREFIX}${JSON.stringify(toolCalls)}`;
            }
            return;
          }
          try {
            const json = JSON.parse(payload) as OpenRouterResponse;
            const delta = json.choices?.[0]?.delta;

            // Accumulate tool_calls fragments
            if (delta?.tool_calls && delta.tool_calls.length > 0) {
              mergeToolCallFragments(toolCallAcc, delta.tool_calls);
            }

            const text = extractTextFromData(json, includeReasoning);
            if (text) yield text;
          } catch {
            /* ignore */
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer) {
      for (const rawLine of buffer.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith(':')) continue;
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as OpenRouterResponse;
          const delta = json.choices?.[0]?.delta;
          if (delta?.tool_calls && delta.tool_calls.length > 0) {
            mergeToolCallFragments(toolCallAcc, delta.tool_calls);
          }
          const text = extractTextFromData(json, includeReasoning);
          if (text) yield text;
        } catch {
          /* ignore */
        }
      }
    }

    // Emit accumulated tool calls if stream ended without [DONE]
    if (toolCallAcc.size > 0) {
      const toolCalls: ToolCall[] = Array.from(toolCallAcc.values()).map((tc) => ({
        id: tc.id || `call_${crypto.randomUUID()}`,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      }));
      yield `${TOOL_CALLS_PREFIX}${JSON.stringify(toolCalls)}`;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

export const openRouterProvider: Provider = {
  id: 'openrouter',
  name: 'OpenRouter',
  meta: { browserSafe: true, supportsStreaming: true },
  sendMessageStream: streamOpenRouter,
};
