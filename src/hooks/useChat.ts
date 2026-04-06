import React from 'react';
import { useAppStore } from '../store/appStore';
import { useSecretsStore } from '../store/secretsStore';
import { useChatStore } from '../store/chatStore';
import { useModelsStore } from '../store/modelsStore';
import { geminiProvider } from '../providers/gemini';
import { openRouterProvider } from '../providers/openrouter';
import type { Provider, SendMessageArgs } from '../providers/adapters';
import { maybeAutoName } from '../lib/autoTitle';

const providers: Provider[] = [geminiProvider, openRouterProvider];

export function useChat() {
  const { showReasoning } = useAppStore();
  const openrouterKey = useSecretsStore(s => s.secrets['openrouter'] ?? null) ?? undefined;
  const geminiKey = useSecretsStore(s => s.secrets['gemini'] ?? null) ?? undefined;
  const { tabs, activeId, setSession, pushMessage, appendToMessage, createTab } = useChatStore();
  const { getDefaultFor } = useModelsStore();

  const activeTab = tabs.find(t => t.id === activeId) || null;
  const [isStreaming, setIsStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const provider = React.useMemo(() => {
    const pid = activeTab?.providerId ?? 'gemini';
    return providers.find(p => p.id === pid)!;
  }, [activeTab?.providerId]);

  const model = activeTab?.model ?? (provider.id === 'openrouter' ? 'openrouter/auto' : 'gemini-1.5-flash');

  const needsKey = (provider.id === 'openrouter' && !openrouterKey) || (provider.id === 'gemini' && !geminiKey);

  async function onSend(input: string, setInput: (v: string) => void, scrollToBottomImmediate: () => void, autoScrollEnabled: boolean) {
    if (!input.trim() || isStreaming) return;

    let tabId = activeTab?.id;
    let tabProviderId = activeTab?.providerId as Provider['id'] | undefined;
    let tabModel = activeTab?.model as string | undefined;

    if (!tabId) {
      tabId = createTab();
      tabProviderId = 'openrouter';
      tabModel = 'openrouter/auto';
    }

    const curProvider = providers.find(p => p.id === (tabProviderId ?? 'gemini'))!;

    const missingKey = (curProvider.id === 'openrouter' && !openrouterKey) || (curProvider.id === 'gemini' && !geminiKey);
    if (missingKey) return { needsSettings: true };

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: input.trim(), createdAt: Date.now() };
    pushMessage(tabId, userMsg);
    setInput('');

    if (autoScrollEnabled) {
      scrollToBottomImmediate();
    }

    const assistantId = crypto.randomUUID();
    const usedModel = tabModel ?? (curProvider.id === 'openrouter' ? (getDefaultFor('openrouter') ?? 'openrouter/auto') : (getDefaultFor('gemini') ?? 'gemini-1.5-flash'));
    pushMessage(tabId, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now(), modelUsed: usedModel });

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    const apiKey = curProvider.id === 'openrouter' ? openrouterKey : geminiKey;

    const baseMessages = activeTab && activeTab.id === tabId ? activeTab.messages : [];

    const args: SendMessageArgs = {
      model: usedModel,
      messages: [...baseMessages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg.content }],
      apiKey,
      temperature: 0.2,
      maxTokens: 512,
      signal: controller.signal,
      includeReasoning: showReasoning,
    };

    try {
      for await (const chunk of curProvider.sendMessageStream(args)) {
        appendToMessage(tabId, assistantId, chunk);
      }
    } catch (e) {
      appendToMessage(tabId, assistantId, `\n\n[Error: ${(e as Error).message}]`);
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