export type ChatMessage = {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type SendMessageArgs = {
  model: string;
  messages: ChatMessage[];
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  includeReasoning?: boolean;
};

export interface ProviderMetadata {
  id: string;
  name: string;
  browserSafe: boolean;
  supportsStreaming: boolean;
}

export interface Provider {
  id: ProviderMetadata['id'];
  name: string;
  meta?: Partial<ProviderMetadata>;
  sendMessageStream: (args: SendMessageArgs) => AsyncIterable<string>;
}

export class ProviderAuthError extends Error { constructor(msg = 'Provider authentication failed') { super(msg); this.name = 'ProviderAuthError'; } }
export class RateLimitError extends Error { constructor(msg = 'Rate limited') { super(msg); this.name = 'RateLimitError'; } }
export class CORSBlockedError extends Error { constructor(msg = 'CORS blocked in browser') { super(msg); this.name = 'CORSBlockedError'; } }
export class AbortErr extends Error { constructor(msg = 'Request aborted') { super(msg); this.name = 'AbortErr'; } }
