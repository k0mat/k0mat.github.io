export type ChatMessage = {
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Present when role === 'tool' — links back to the tool_call_id */
  toolCallId?: string;
  /** Present when role === 'assistant' and the model wants to call tools */
  toolCalls?: ToolCall[];
};

export type ToolParameterSchema = {
  type: string;
  description?: string;
  enum?: string[];
};

export type ToolDefinition = {
  /** Unique tool name (namespaced as "<serverName>__<toolName>" when multiple servers) */
  name: string;
  description?: string;
  /** JSON Schema for the tool's arguments */
  parameters: {
    type: 'object';
    properties?: Record<string, ToolParameterSchema>;
    required?: string[];
  };
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    /** JSON-encoded arguments string */
    arguments: string;
  };
};

export type SendMessageArgs = {
  model: string;
  messages: ChatMessage[];
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  includeReasoning?: boolean;
  /** Optional tool definitions to pass to the model */
  tools?: ToolDefinition[];
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
