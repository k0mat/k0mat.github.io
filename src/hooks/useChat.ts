import React from 'react';
import { useAppStore } from '../store/appStore';
import { useSecretsStore } from '../store/secretsStore';
import { useChatStore } from '../store/chatStore';
import { useModelsStore } from '../store/modelsStore';
import { useMcpStore } from '../store/mcpStore';
import { geminiProvider } from '../providers/gemini';
import { openRouterProvider } from '../providers/openrouter';
import { TOOL_CALLS_PREFIX } from '../providers/openrouter';
import type { Provider, SendMessageArgs, ToolDefinition, ToolCall, ChatMessage as ProviderMessage } from '../providers/adapters';
import { listTools, callTool, toolResultToText } from '../lib/mcpClient';
import type { McpToolDefinition } from '../lib/mcpClient';
import { maybeAutoName } from '../lib/autoTitle';

const providers: Provider[] = [geminiProvider, openRouterProvider];

/** Max agentic turns to prevent infinite loops */
const MAX_TOOL_LOOP = 5;

/** Convert MCP tool definitions to the unified ToolDefinition format, namespaced by server name */
function mcpToolsToUnified(serverName: string, tools: McpToolDefinition[]): ToolDefinition[] {
  return tools.map((t) => ({
    name: `${serverName}__${t.name}`,
    description: t.description,
    parameters: {
      type: 'object' as const,
      properties: t.inputSchema?.properties,
      required: t.inputSchema?.required,
    },
  }));
}

/**
 * Resolve which MCP server + original tool name a namespaced tool call refers to.
 * Tool names are namespaced as "<serverName>__<toolName>".
 */
function resolveToolCall(
  toolName: string,
  serverMap: Map<string, string> // serverName → serverUrl
): { serverUrl: string; originalToolName: string } | null {
  const idx = toolName.indexOf('__');
  if (idx === -1) return null;
  const serverName = toolName.slice(0, idx);
  const originalToolName = toolName.slice(idx + 2);
  const serverUrl = serverMap.get(serverName);
  if (!serverUrl) return null;
  return { serverUrl, originalToolName };
}

export function useChat() {
  const { showReasoning } = useAppStore();
  const openrouterKey = useSecretsStore((s) => s.secrets['openrouter'] ?? null) ?? undefined;
  const geminiKey = useSecretsStore((s) => s.secrets['gemini'] ?? null) ?? undefined;
  const { tabs, activeId, setSession, pushMessage, appendToMessage, patchMessage, createTab } = useChatStore();
  const { getDefaultFor } = useModelsStore();
  const mcpServers = useMcpStore((s) => s.servers);

  const activeTab = tabs.find((t) => t.id === activeId) || null;
  const [isStreaming, setIsStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const provider = React.useMemo(() => {
    const pid = activeTab?.providerId ?? 'gemini';
    return providers.find((p) => p.id === pid)!;
  }, [activeTab?.providerId]);

  const model =
    activeTab?.model ??
    (provider.id === 'openrouter' ? 'openrouter/auto' : 'gemini-1.5-flash');

  const needsKey =
    (provider.id === 'openrouter' && !openrouterKey) ||
    (provider.id === 'gemini' && !geminiKey);

  async function onSend(
    input: string,
    setInput: (v: string) => void,
    scrollToBottomImmediate: () => void,
    autoScrollEnabled: boolean
  ) {
    if (!input.trim() || isStreaming) return;

    let tabId = activeTab?.id;
    let tabProviderId = activeTab?.providerId as Provider['id'] | undefined;
    let tabModel = activeTab?.model as string | undefined;

    if (!tabId) {
      tabId = createTab();
      tabProviderId = 'openrouter';
      tabModel = 'openrouter/auto';
    }

    const curProvider = providers.find((p) => p.id === (tabProviderId ?? 'gemini'))!;

    const missingKey =
      (curProvider.id === 'openrouter' && !openrouterKey) ||
      (curProvider.id === 'gemini' && !geminiKey);
    if (missingKey) return { needsSettings: true };

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input.trim(),
      createdAt: Date.now(),
    };
    pushMessage(tabId, userMsg);
    setInput('');

    if (autoScrollEnabled) {
      scrollToBottomImmediate();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    const apiKey = curProvider.id === 'openrouter' ? openrouterKey : geminiKey;
    const usedModel =
      tabModel ??
      (curProvider.id === 'openrouter'
        ? (getDefaultFor('openrouter') ?? 'openrouter/auto')
        : (getDefaultFor('gemini') ?? 'gemini-1.5-flash'));

    const baseMessages = activeTab && activeTab.id === tabId ? activeTab.messages : [];

    // ── Collect tools from MCP servers ───────────────────────────────────────
    let allTools: ToolDefinition[] = [];
    const serverMap = new Map<string, string>(); // serverName → url

    const enabledServers = mcpServers.filter((s) => s.enabled);
    if (enabledServers.length > 0) {
      const toolResults = await Promise.allSettled(
        enabledServers.map(async (sv) => {
          const tools = await listTools(sv.url, controller.signal);
          return { sv, tools };
        })
      );
      for (const res of toolResults) {
        if (res.status === 'fulfilled') {
          const { sv, tools } = res.value;
          serverMap.set(sv.name, sv.url);
          allTools = allTools.concat(mcpToolsToUnified(sv.name, tools));
        }
        // Silently ignore failed servers — user will see no tools from them
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Build the message history for the provider (including new user message)
    let providerMessages: ProviderMessage[] = [
      ...baseMessages.map((m) => ({
        role: m.role as ProviderMessage['role'],
        content: m.content,
        toolCallId: m.toolCallId,
        toolCalls: m.toolCalls,
      })),
      { role: 'user' as const, content: userMsg.content },
    ];

    // ── Agentic tool-call loop ────────────────────────────────────────────────
    let loopCount = 0;

    try {
      while (loopCount < MAX_TOOL_LOOP) {
        loopCount++;

        const assistantId = crypto.randomUUID();
        pushMessage(tabId, {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
          modelUsed: usedModel,
        });

        if (autoScrollEnabled) scrollToBottomImmediate();

        const args: SendMessageArgs = {
          model: usedModel,
          messages: providerMessages,
          apiKey,
          temperature: 0.2,
          maxTokens: 512,
          signal: controller.signal,
          includeReasoning: showReasoning,
          tools: allTools.length > 0 ? allTools : undefined,
        };

        let toolCallsPayload: ToolCall[] | null = null;
        let assistantTextContent = '';

        try {
          for await (const chunk of curProvider.sendMessageStream(args)) {
            if (chunk.startsWith(TOOL_CALLS_PREFIX)) {
              // This chunk is a tool-call payload, not display text
              try {
                toolCallsPayload = JSON.parse(chunk.slice(TOOL_CALLS_PREFIX.length)) as ToolCall[];
              } catch {
                /* ignore malformed payload */
              }
            } else {
              assistantTextContent += chunk;
              appendToMessage(tabId, assistantId, chunk);
            }
          }
        } catch (e) {
          appendToMessage(tabId, assistantId, `\n\n[Error: ${(e as Error).message}]`);
          break;
        }

        // If no tool calls, we're done
        if (!toolCallsPayload || toolCallsPayload.length === 0) {
          break;
        }

        // Persist the tool_calls on the assistant message
        patchMessage(tabId, assistantId, { toolCalls: toolCallsPayload });

        // Add the assistant message (with tool_calls) to the provider message history
        providerMessages = [
          ...providerMessages,
          {
            role: 'assistant' as const,
            content: assistantTextContent,
            toolCalls: toolCallsPayload,
          },
        ];

        // ── Execute each tool call ──────────────────────────────────────────
        for (const tc of toolCallsPayload) {
          const resolved = resolveToolCall(tc.function.name, serverMap);

          let resultText: string;
          if (!resolved) {
            resultText = `[MCP error]: Unknown tool "${tc.function.name}"`;
          } else {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(tc.function.arguments) as Record<string, unknown>;
            } catch {
              /* use empty args */
            }

            try {
              const result = await callTool(
                resolved.serverUrl,
                resolved.originalToolName,
                parsedArgs,
                controller.signal
              );
              resultText = toolResultToText(result);
            } catch (e) {
              resultText = `[MCP error]: ${(e as Error).message}`;
            }
          }

          // Store the tool result as a visible message in chat
          const toolResultMsgId = crypto.randomUUID();
          pushMessage(tabId, {
            id: toolResultMsgId,
            role: 'tool',
            content: resultText,
            createdAt: Date.now(),
            toolCallId: tc.id,
            toolName: tc.function.name,
          });

          // Add tool result to provider message history
          providerMessages = [
            ...providerMessages,
            {
              role: 'tool' as const,
              content: resultText,
              toolCallId: tc.id,
            },
          ];
        }
        // ───────────────────────────────────────────────────────────────────
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      // Best-effort auto naming on Fibonacci triggers
      await maybeAutoName(tabId, curProvider, apiKey, usedModel);
    }

    return { needsSettings: false };
  }

  function onStop() {
    abortRef.current?.abort();
  }

  return {
    activeTab,
    provider,
    model,
    isStreaming,
    needsKey,
    onSend,
    onStop,
    setSession,
    providers,
  };
}
