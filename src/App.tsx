import React, { useMemo, useRef, useState } from 'react';
import { MessageSquare, SquarePen, StopCircle, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { geminiProvider } from './providers/gemini';
import { openRouterProvider } from './providers/openrouter';
import { useSecretsStore } from './store/secretsStore';
import SettingsPanel from './components/settings/SettingsPanel';
import type { Provider, SendMessageArgs } from './providers/adapters';
import ProviderSelect from './components/ProviderSelect';
import { useChatStore } from './store/chatStore';
import ChatTabs from './components/ChatTabs';
import { useModelsStore } from './store/modelsStore';
import ModelFavoritesSelect from './components/ModelFavoritesSelect';
import { maybeAutoName } from './lib/autoTitle';
import ChatMessageComponent from './components/ChatMessage';

const providers: Provider[] = [geminiProvider, openRouterProvider];

function safeScrollToBottom(el: HTMLElement, behavior: ScrollBehavior) {
  const top = el.scrollHeight;
  const canScrollTo = typeof (el as HTMLElement).scrollTo === 'function';
  if (canScrollTo) {
    (el as HTMLElement).scrollTo({ top, behavior });
  } else {
    el.scrollTop = top;
  }
}

export default function App() {
  const { theme, setTheme, showReasoning, autoScrollEnabled, autoCollapseEnabled, collapseAgeMessages, collapseMinLength } = useAppStore();
  // Subscribe to secrets values to re-render after hydration
  const openrouterKey = useSecretsStore(s => s.secrets['openrouter'] ?? null) ?? undefined;
  const geminiKey = useSecretsStore(s => s.secrets['gemini'] ?? null) ?? undefined;
  const { tabs, activeId, ensureTab, setSession, pushMessage, appendToMessage, createTab } = useChatStore();
  const { getDefaultFor } = useModelsStore();
  const activeTab = tabs.find(t => t.id === activeId) || null;
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string, v?: boolean) => setExpanded((prev) => ({ ...prev, [id]: v ?? !prev[id] }));

  React.useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
  }, [theme]);

  React.useEffect(() => { ensureTab(); }, [ensureTab]);

  const provider = useMemo(() => {
    const pid = activeTab?.providerId ?? 'gemini';
    return providers.find(p => p.id === pid)!;
  }, [activeTab?.providerId]);

  const model = activeTab?.model ?? (provider.id === 'openrouter' ? 'openrouter/auto' : 'gemini-1.5-flash');

  // Anchor to detect streaming growth of the last message
  const autoScrollAnchor = useMemo(() => {
    const last = activeTab?.messages?.[activeTab.messages.length - 1];
    if (!last) return '';
    return `${last.id}:${last.content?.length ?? 0}`;
  }, [activeTab?.messages]);

  function scrollToBottomImmediate() {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Smooth for short distances, instant for long jumps
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const behavior: ScrollBehavior = prefersReduced ? 'auto' : (distance < 800 ? 'smooth' : 'auto');
    safeScrollToBottom(el, behavior);
  }

  // Auto-scroll to bottom when messages update or last message grows
  React.useEffect(() => {
    if (!autoScrollEnabled) return;
    const el = scrollRef.current;
    if (!el) return;
    const delta = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = delta < 120;
    if (nearBottom) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      safeScrollToBottom(el, prefersReduced ? 'auto' : 'smooth');
    }
  }, [autoScrollEnabled, autoScrollAnchor]);

  async function onSend() {
    if (!input.trim() || isStreaming) return;

    let tabId = activeTab?.id;
    let tabProviderId = activeTab?.providerId as Provider['id'] | undefined;
    let tabModel = activeTab?.model as string | undefined;

    if (!tabId) {
      tabId = createTab();
      tabProviderId = 'gemini';
      tabModel = 'gemini-1.5-flash';
    }

    const curProvider = providers.find(p => p.id === (tabProviderId ?? 'gemini'))!;

    const missingKey = (curProvider.id === 'openrouter' && !openrouterKey) || (curProvider.id === 'gemini' && !geminiKey);
    if (missingKey) { setShowSettings(true); return; }

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
  }

  function onStop() { abortRef.current?.abort(); }

  const needsKey = (provider.id === 'openrouter' && !openrouterKey) || (provider.id === 'gemini' && !geminiKey);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">io-ai</span>
          <span className="text-xs text-zinc-400">(starter)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`icon-btn ${needsKey ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-200'}`}
            title="Settings"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
          <button
            aria-label="toggle theme"
            className="icon-btn text-zinc-700 dark:text-zinc-200"
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            title={`Theme: ${theme}`}
          >
            {theme === 'dark' ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}
          </button>
        </div>
      </header>

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} initial={needsKey ? 'secrets' : undefined} />

      <ChatTabs />

      <main className="flex-1 overflow-hidden min-h-0 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Per-session controls */}
        <div className="flex items-center gap-2">
          <ProviderSelect
            options={providers.map(p => ({ id: p.id, name: p.name }))}
            value={activeTab?.providerId ?? 'gemini'}
            onChange={(pid) => {
              if (!activeTab) return;
              const nextModel = pid === 'openrouter'
                ? (getDefaultFor('openrouter') ?? 'openrouter/auto')
                : (getDefaultFor('gemini') ?? 'gemini-1.5-flash');
              setSession(activeTab.id, pid as Provider['id'], nextModel);
            }}
            className="w-48"
          />
          <input
            className="input w-56"
            value={model}
            onChange={e => { if (activeTab) setSession(activeTab.id, activeTab.providerId, e.target.value); }}
            placeholder="model"
          />
          {activeTab && (
            <ModelFavoritesSelect
              providerId={activeTab.providerId}
              onSelect={(m) => setSession(activeTab!.id, activeTab!.providerId, m)}
            />
          )}
          <span className="badge">{provider.name}</span>
          <div className="flex-grow"></div>
          <button className="btn btn-outline text-xs" onClick={() => setExpanded({})}>Collapse all</button>
          <button className="btn btn-outline text-xs" onClick={() => {
            if (!activeTab) return;
            const newExpanded: Record<string, boolean> = {};
            for (const message of activeTab.messages) {
              newExpanded[message.id!] = true;
            }
            setExpanded(newExpanded);
          }}>Expand all</button>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto card flex flex-col gap-4">
          {!activeTab ? (
            <div className="text-sm text-zinc-500">Preparing your first chat…</div>
          ) : (
            activeTab.messages.map((m, idx) => {
              const newerCount = activeTab.messages.length - 1 - idx;
              return (
                <ChatMessageComponent
                  key={m.id}
                  message={m}
                  isStreaming={isStreaming}
                  isLast={idx === activeTab.messages.length - 1}
                  autoCollapseEnabled={autoCollapseEnabled}
                  collapseMinLength={collapseMinLength}
                  collapseAgeMessages={collapseAgeMessages}
                  onToggleExpanded={toggleExpanded}
                  isExpanded={!!expanded[m.id!]}
                  newerCount={newerCount}
                />
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2">
          <textarea
            className="textarea flex-1 min-h-[48px] resize-none"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask something…"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          {isStreaming ? (
            <button className="btn btn-danger" onClick={onStop}>
              <StopCircle className="h-4 w-4"/> Stop
            </button>
          ) : (
            <button
              className={`btn ${needsKey ? 'btn-warning' : 'btn-primary'}`}
              onClick={onSend}
              disabled={(provider.id === 'openrouter' && !openrouterKey) || (provider.id === 'gemini' && !geminiKey) || !activeTab}
              title={needsKey ? 'Enter your API key' : 'Send'}
            >
              <SquarePen className="h-4 w-4"/> Send
            </button>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-400 py-3">Built with React, Vite, Tailwind, Zustand</footer>
    </div>
  );
}

