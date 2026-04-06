import type { Provider, SendMessageArgs, ToolCall, ToolDefinition } from './adapters';
import { ProviderAuthError, RateLimitError } from './adapters';
import { TOOL_CALLS_PREFIX } from './openrouter';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

type GeminiContent = {
  role: string;
  parts: GeminiPart[];
};

type GeminiFunctionDeclaration = {
  name: string;
  description?: string;
  parameters?: {
    type: string;
    properties?: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
};

type GeminiResponse = {
  candidates: {
    content: GeminiContent;
    finishReason?: string;
  }[];
};

function toGeminiContents(messages: SendMessageArgs['messages']): GeminiContent[] {
  return messages.map((m) => {
    // Gemini uses 'model' role for assistant, 'user' for user & tool results
    const role = m.role === 'assistant' ? 'model' : 'user';

    if (m.role === 'tool') {
      // Tool result — wrap as functionResponse
      const parts: GeminiPart[] = [
        {
          functionResponse: {
            name: m.toolCallId ?? 'unknown_tool',
            response: { result: m.content },
          },
        },
      ];
      return { role: 'user', parts };
    }

    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      // Assistant message with function calls
      const parts: GeminiPart[] = m.toolCalls.map((tc) => ({
        functionCall: {
          name: tc.function.name,
          args: (() => {
            try {
              return JSON.parse(tc.function.arguments) as Record<string, unknown>;
            } catch {
              return {};
            }
          })(),
        },
      }));
      return { role: 'model', parts };
    }

    return { role, parts: [{ text: m.content }] };
  });
}

function toGeminiTools(tools: ToolDefinition[]): { functionDeclarations: GeminiFunctionDeclaration[] } {
  return {
    functionDeclarations: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as GeminiFunctionDeclaration['parameters'],
    })),
  };
}

export const geminiProvider: Provider = {
  id: 'gemini',
  name: 'Gemini (Google)',
  meta: { browserSafe: true, supportsStreaming: true },
  async *sendMessageStream(args: SendMessageArgs) {
    if (!args.apiKey) throw new ProviderAuthError('Missing Gemini API key');

    const contents = toGeminiContents(args.messages);

    const url = `${GEMINI_API_URL}/${encodeURIComponent(args.model)}:streamGenerateContent?key=${encodeURIComponent(args.apiKey)}`;

    const requestBody: Record<string, unknown> = { contents };
    if (args.tools && args.tools.length > 0) {
      requestBody['tools'] = [toGeminiTools(args.tools)];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
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

    // Accumulated function calls across stream chunks
    const functionCallAcc: { name: string; args: Record<string, unknown> }[] = [];

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
              const candidate = json?.candidates?.[0];
              const parts = candidate?.content?.parts ?? [];

              for (const part of parts) {
                if ('text' in part && part.text) {
                  yield part.text;
                } else if ('functionCall' in part) {
                  functionCallAcc.push({ name: part.functionCall.name, args: part.functionCall.args });
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {}
    }

    // Emit accumulated function calls as tool_calls
    if (functionCallAcc.length > 0) {
      const toolCalls: ToolCall[] = functionCallAcc.map((fc, i) => ({
        id: `gemini_call_${i}_${Date.now()}`,
        type: 'function' as const,
        function: {
          name: fc.name,
          arguments: JSON.stringify(fc.args),
        },
      }));
      yield `${TOOL_CALLS_PREFIX}${JSON.stringify(toolCalls)}`;
    }
  },
};
