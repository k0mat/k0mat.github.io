/**
 * Minimal MCP HTTP/JSON-RPC client for browser use.
 *
 * MCP spec: https://spec.modelcontextprotocol.io/specification/
 *
 * We use the JSON-RPC 2.0 over HTTP transport (POST to the server URL).
 * Each request is a JSON-RPC call; the server responds with a JSON-RPC result.
 */

export type McpToolParameter = {
  type: string;
  description?: string;
  enum?: string[];
};

export type McpToolInputSchema = {
  type: 'object';
  properties?: Record<string, McpToolParameter>;
  required?: string[];
};

export type McpToolDefinition = {
  name: string;
  description?: string;
  inputSchema: McpToolInputSchema;
};

export type McpToolCallResult = {
  content: { type: string; text?: string; [key: string]: unknown }[];
  isError?: boolean;
};

// JSON-RPC 2.0 helpers
type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
};

type JsonRpcResponse<T> = {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

let _reqId = 1;

async function rpc<T>(url: string, method: string, params?: unknown, signal?: AbortSignal): Promise<T> {
  const body: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: _reqId++,
    method,
    params,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MCP server error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as JsonRpcResponse<T>;

  if (json.error) {
    throw new Error(`MCP RPC error [${json.error.code}]: ${json.error.message}`);
  }

  return json.result as T;
}

/**
 * Fetch the list of tools exposed by an MCP server.
 */
export async function listTools(serverUrl: string, signal?: AbortSignal): Promise<McpToolDefinition[]> {
  type ListToolsResult = { tools: McpToolDefinition[] };
  const result = await rpc<ListToolsResult>(serverUrl, 'tools/list', {}, signal);
  return result?.tools ?? [];
}

/**
 * Invoke a tool on the MCP server.
 */
export async function callTool(
  serverUrl: string,
  toolName: string,
  args: Record<string, unknown>,
  signal?: AbortSignal
): Promise<McpToolCallResult> {
  return rpc<McpToolCallResult>(serverUrl, 'tools/call', { name: toolName, arguments: args }, signal);
}

/**
 * Extract plain text from an MCP tool call result.
 */
export function toolResultToText(result: McpToolCallResult): string {
  if (result.isError) {
    const errText = result.content
      .filter((c) => c.type === 'text' && c.text)
      .map((c) => c.text)
      .join('\n');
    return `[Tool error]: ${errText || 'Unknown error'}`;
  }
  return result.content
    .filter((c) => c.type === 'text' && c.text)
    .map((c) => c.text)
    .join('\n');
}
