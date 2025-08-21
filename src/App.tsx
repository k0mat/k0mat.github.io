import React, { useMemo, useRef, useState } from 'react';
import { MessageSquare, SquarePen, StopCircle, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAppStore } from './store/appStore';
import { echoProvider } from './providers/echo';
import { openRouterProvider } from './providers/openrouter';
import { useSecretsStore } from './store/secretsStore';
import SettingsPanel from './components/settings/SettingsPanel';
import type { Provider, SendMessageArgs } from './providers/adapters';
import ProviderSelect from './components/ProviderSelect';

const providers: Provider[] = [echoProvider, openRouterProvider];

export default function App() {
  const { theme, setTheme, showReasoning } = useAppStore();
  const { getKey } = useSecretsStore();
  const [providerId, setProviderId] = useState<Provider['id']>('echo');
  const [model, setModel] = useState<string>('echo-1');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user'|'assistant'|'system'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  React.useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
  }, [theme]);

  React.useEffect(() => {
    // adjust default model for selected provider
    if (providerId === 'echo') setModel('echo-1');
    else if (providerId === 'openrouter') setModel('openrouter/auto');
  }, [providerId]);

  const provider = useMemo(() => providers.find(p => p.id === providerId)!, [providerId]);
  const openrouterKey = getKey('openrouter') ?? undefined;

  async function onSend() {
    if (!input.trim() || isStreaming) return;

    // If OpenRouter selected, require key
    if (provider.id === 'openrouter' && !openrouterKey) { setShowSettings(true); return; }

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    const apiKey = provider.id === 'openrouter' ? openrouterKey : 'echo';

    const args: SendMessageArgs = {
      model,
      messages: [...messages, userMsg],
      apiKey,
      temperature: 0.2,
      maxTokens: 512,
      signal: controller.signal,
      includeReasoning: showReasoning,
    };

    try {
      for await (const chunk of provider.sendMessageStream(args)) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: (m.content || '') + `\n\n[Error: ${(e as Error).message}]` } : m));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function onStop() {
    abortRef.current?.abort();
  }

  const needsKey = provider.id === 'openrouter' && !openrouterKey;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">io-ai</span>
          <span className="text-xs text-zinc-400">(starter)</span>
        </div>
        <div className="flex items-center gap-2">
          <ProviderSelect
            options={providers.map(p => ({ id: p.id, name: p.name }))}
            value={providerId}
            onChange={(id) => setProviderId(id as Provider['id'])}
            className="w-48"
          />
          <input
            className="input w-48"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="model"
          />
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="text-xs text-zinc-500">
          Chat with Echo or OpenRouter. Configure keys and preferences in Settings.
        </div>

        <div className="flex-1 overflow-y-auto card flex flex-col gap-4">
          {messages.map(m => (
            <div key={m.id} className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[85%]'}>
              <div className={(m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100') + ' rounded-lg px-3 py-2 whitespace-pre-wrap'}>
                {m.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm as unknown as any]}
                    rehypePlugins={[rehypeHighlight as unknown as any]}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
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
              disabled={provider.id === 'openrouter' && !openrouterKey}
              title={needsKey ? 'Enter your OpenRouter API key' : 'Send'}
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
