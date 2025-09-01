import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { StoreApi } from 'zustand';
import type { ChatState, ChatTab } from './chatStore';

async function freshChatStore(): Promise<StoreApi<ChatState>> {
  vi.resetModules();
  const mod = await import('./chatStore');
  return mod.useChatStore;
}

describe('chatStore title persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('renamed tab title persists across reload', async () => {
    const useChatStore = await freshChatStore();
    // Ensure a tab exists
    const id = useChatStore.getState().createTab({ providerId: 'gemini' });
    useChatStore.getState().renameTab(id, 'My persistent title');

    // Verify raw storage contains the title
    const raw = localStorage.getItem('io-ai:chats');
    expect(raw).toBeTruthy();
    expect(raw!).toMatch(/My persistent title/);

    // Reload store and rehydrate
    const useChatStore2 = await freshChatStore();
    await (useChatStore2.persist as any).rehydrate();
    const titles = useChatStore2.getState().tabs.map((t: ChatTab) => t.title);
    expect(titles).toContain('My persistent title');
  });
});

