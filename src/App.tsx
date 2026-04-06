import React, { useMemo, useState } from 'react';
import { useAppStore } from './store/appStore';
import { useChatStore } from './store/chatStore';
import { useModelsStore } from './store/modelsStore';
import { useTheme } from './hooks/useTheme';
import { useAutoScroll } from './hooks/useAutoScroll';
import { useChat } from './hooks/useChat';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import SettingsPanel from './components/settings/SettingsPanel';
import ProviderSelect from './components/ProviderSelect';
import ChatTabs from './components/ChatTabs';
import ModelFavoritesSelect from './components/ModelFavoritesSelect';
import ChatMessageComponent from './components/ChatMessage';
import ChatHeader from './components/layout/ChatHeader';
import ChatInput from './components/chat/ChatInput';
import WelcomeScreen from './components/layout/WelcomeScreen';
import type { Provider } from './providers/adapters';

export default function App() {
  const { autoScrollEnabled, autoCollapseEnabled, collapseAgeMessages, collapseMinLength } = useAppStore();
  const { tabs, activeId, ensureTab, setSession, createTab } = useChatStore();
  const { getDefaultFor } = useModelsStore();
  const { theme, cycleTheme } = useTheme();

  const {
    activeTab,
    provider,
    model,
    isStreaming,
    needsKey,
    onSend,
    onStop,
    setSession: setChatSession,
    providers,
  } = useChat();

  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string, v?: boolean) => setExpanded((prev) => ({ ...prev, [id]: v ?? !prev[id] }));

  React.useEffect(() => { ensureTab(); }, [ensureTab]);

  // Anchor to detect streaming growth of the last message
  const autoScrollAnchor = useMemo(() => {
    const last = activeTab?.messages?.[activeTab.messages.length - 1];
    if (!last) return '';
    return `${last.id}:${last.content?.length ?? 0}`;
  }, [activeTab?.messages]);

  const { scrollRef, scrollToBottomImmediate } = useAutoScroll(autoScrollEnabled, autoScrollAnchor);

  const handleSend = React.useCallback(async () => {
    if (!input.trim()) return;
    const result = await onSend(input, setInput, scrollToBottomImmediate, autoScrollEnabled);
    if (result?.needsSettings) {
      setShowSettings(true);
    }
  }, [input, onSend, scrollToBottomImmediate, autoScrollEnabled]);

  const handleRegenerate = React.useCallback(async () => {
    // For now, just show a toast - regeneration would need more complex logic
    console.log('Regenerate not yet implemented');
  }, []);

  const showWelcome = needsKey;

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: () => createTab(),
    onOpenSettings: () => setShowSettings(true),
    onSend: handleSend,
    onStop,
    isStreaming,
  });

  return (
    <div className="h-screen flex flex-col">
      <ChatHeader
        theme={theme}
        onCycleTheme={cycleTheme}
        onOpenSettings={() => setShowSettings(true)}
        needsKey={needsKey}
      />

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} initial={needsKey ? 'secrets' : undefined} />

      <ChatTabs />

      {showWelcome ? (
        <WelcomeScreen onOpenSettings={() => setShowSettings(true)} />
      ) : (
        <main className="flex-1 overflow-hidden min-h-0 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
          {/* Per-session controls */}
          <div className="flex items-center gap-2 flex-wrap">
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
            ) : activeTab.messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
                No messages yet. Say something!
              </div>
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
                    onRegenerate={handleRegenerate}
                  />
                );
              })
            )}
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onStop={onStop}
            isStreaming={isStreaming}
            disabled={needsKey}
          />
        </main>
      )}

      <footer className="text-center text-xs text-zinc-400 py-3">Built with React, Vite, Tailwind, Zustand</footer>
    </div>
  );
}