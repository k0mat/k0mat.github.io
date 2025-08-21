import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Provider } from '../providers/adapters';
import { useModelsStore } from './modelsStore';

export type Role = 'user' | 'assistant' | 'system';
export type ChatMessage = { id: string; role: Role; content: string };

export type ChatTab = {
  id: string;
  title: string;
  providerId: Provider['id'];
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

interface ChatState {
  tabs: ChatTab[];
  activeId: string | null;
  createTab: (init?: Partial<Pick<ChatTab, 'title' | 'providerId' | 'model'>>) => string;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  renameTab: (id: string, title: string) => void;
  setSession: (id: string, providerId: Provider['id'], model: string) => void;
  pushMessage: (id: string, msg: ChatMessage) => void;
  appendToMessage: (id: string, messageId: string, chunk: string) => void;
  ensureTab: () => void;
}

function now() { return Date.now(); }

function defaultModelFor(pid: Provider['id']): string {
  const getDefaultFor = useModelsStore.getState().getDefaultFor;
  if (pid === 'openrouter') return getDefaultFor('openrouter') ?? 'openrouter/auto';
  if (pid === 'echo') return getDefaultFor('echo') ?? 'echo-1';
  return 'echo-1';
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeId: null,
      createTab: (init) => {
        const id = crypto.randomUUID();
        const providerId = (init?.providerId as Provider['id']) ?? 'echo';
        const model = init?.model ?? defaultModelFor(providerId);
        const tab: ChatTab = {
          id,
          title: init?.title ?? 'New chat',
          providerId,
          model,
          messages: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ tabs: [...s.tabs, tab], activeId: id }));
        return id;
      },
      closeTab: (id) => {
        set((s) => {
          const idx = s.tabs.findIndex(t => t.id === id);
          if (idx === -1) return s;
          const tabs = s.tabs.filter(t => t.id !== id);
          let activeId = s.activeId;
          if (s.activeId === id) {
            if (tabs.length === 0) {
              const newId = crypto.randomUUID();
              const providerId: Provider['id'] = 'echo';
              const model = defaultModelFor(providerId);
              const tab: ChatTab = { id: newId, title: 'New chat', providerId, model, messages: [], createdAt: now(), updatedAt: now() };
              return { tabs: [tab], activeId: newId };
            }
            const nextIdx = Math.max(0, idx - 1);
            activeId = tabs[nextIdx]?.id ?? null;
          }
          return { tabs, activeId };
        });
      },
      setActive: (id) => set({ activeId: id }),
      renameTab: (id, title) => set((s) => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, title, updatedAt: now() } : t) })),
      setSession: (id, providerId, model) => set((s) => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, providerId, model, updatedAt: now() } : t) })),
      pushMessage: (id, msg) => set((s) => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, messages: [...t.messages, msg], updatedAt: now() } : t) })),
      appendToMessage: (id, messageId, chunk) => set((s) => ({ tabs: s.tabs.map(t => {
        if (t.id !== id) return t;
        const msgs = (t.messages ?? []).map(m => m.id === messageId ? { ...m, content: (m.content ?? '') + chunk } : m);
        return { ...t, messages: msgs, updatedAt: now() };
      }) })),
      ensureTab: () => {
        const s = get();
        if (s.tabs.length === 0) {
          const id = crypto.randomUUID();
          const providerId: Provider['id'] = 'echo';
          const model = defaultModelFor(providerId);
          const tab: ChatTab = { id, title: 'New chat', providerId, model, messages: [], createdAt: now(), updatedAt: now() };
          set({ tabs: [tab], activeId: id });
        } else if (!s.activeId) {
          set({ activeId: s.tabs[0].id });
        }
      },
    }),
    {
      name: 'io-ai:chats',
      partialize: (s) => ({ tabs: s.tabs, activeId: s.activeId }),
      version: 1,
    }
  )
);
