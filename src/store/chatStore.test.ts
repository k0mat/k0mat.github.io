import { describe, it, expect, beforeEach } from 'vitest';
import { useModelsStore } from './modelsStore';
import { useChatStore } from './chatStore';

// Helper to reset Zustand stores between tests
function resetStores() {
  localStorage.clear();
  useModelsStore.setState({ byProvider: {} });
  useChatStore.setState({ tabs: [], activeId: null } as any);
}

describe('chatStore defaults', () => {
  beforeEach(() => resetStores());

  it('createTab uses provider-specific default (gemini)', () => {
    useModelsStore.getState().addFavorite('gemini', 'gemini-1.5-pro');
    useModelsStore.getState().setDefault('gemini', 'gemini-1.5-pro');

    const id = useChatStore.getState().createTab({ providerId: 'gemini' });
    const tab = useChatStore.getState().tabs.find(t => t.id === id)!;
    expect(tab.model).toBe('gemini-1.5-pro');
  });

  it('ensureTab creates a tab with default when none exists', () => {
    useModelsStore.getState().setDefault('openrouter', 'google/gemini-flash-1.5');
    useChatStore.getState().ensureTab();
    const s = useChatStore.getState();
    expect(s.tabs.length).toBe(1);
    const t = s.tabs[0];
    // default provider for new tab is gemini; falls back to gemini default or gemini-1.5-flash
    const expected = useModelsStore.getState().getDefaultFor('gemini') ?? 'gemini-1.5-flash';
    expect(t.providerId).toBe('gemini');
    expect(t.model).toBe(expected);
  });

  it('closeTab creates a fresh tab using defaults when last tab is closed', () => {
    useModelsStore.getState().setDefault('gemini', 'gemini-1.5-pro');
    const s = useChatStore.getState();
    const id = s.createTab({ providerId: 'gemini' });
    useChatStore.getState().closeTab(id);
    const ns = useChatStore.getState();
    expect(ns.tabs.length).toBe(1);
    expect(ns.tabs[0].model).toBe('gemini-1.5-pro');
  });
});
