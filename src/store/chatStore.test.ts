import { describe, it, expect, beforeEach } from 'vitest';
import { useModelsStore } from './modelsStore';
import { useChatStore, ChatState } from './chatStore';

// Helper to reset Zustand stores between tests
function resetStores() {
  localStorage.clear();
  useModelsStore.setState({ byProvider: {} });
  useChatStore.setState({ tabs: [], activeId: null } as ChatState);
}

describe('chatStore defaults', () => {
  beforeEach(() => resetStores());

  it('createTab uses provider-specific default (openrouter)', () => {
    useModelsStore.getState().addFavorite('openrouter', 'openrouter/auto');
    useModelsStore.getState().setDefault('openrouter', 'openrouter/auto');

    const id = useChatStore.getState().createTab({ providerId: 'openrouter' });
    const tab = useChatStore.getState().tabs.find(t => t.id === id)!;
    expect(tab.model).toBe('openrouter/auto');
  });

  it('ensureTab creates a tab with default when none exists', () => {
    useModelsStore.getState().setDefault('openrouter', 'openrouter/auto');
    useChatStore.getState().ensureTab();
    const s = useChatStore.getState();
    expect(s.tabs.length).toBe(1);
    const t = s.tabs[0];
    // default provider for new tab is openrouter
    const expected = useModelsStore.getState().getDefaultFor('openrouter') ?? 'openrouter/auto';
    expect(t.providerId).toBe('openrouter');
    expect(t.model).toBe(expected);
  });

  it('closeTab creates a fresh tab using defaults when last tab is closed', () => {
    useModelsStore.getState().setDefault('openrouter', 'meta-llama/llama-3.1-8b-instruct');
    const s = useChatStore.getState();
    const id = s.createTab({ providerId: 'openrouter' });
    useChatStore.getState().closeTab(id);
    const ns = useChatStore.getState();
    expect(ns.tabs.length).toBe(1);
    expect(ns.tabs[0].model).toBe('meta-llama/llama-3.1-8b-instruct');
  });
});
