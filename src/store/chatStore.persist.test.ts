// filepath: d:\Dev\projects\io-ai\src\store\chatStore.persist.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

async function freshChatStore() {
  vi.resetModules();
  const mod: any = await import('./chatStore');
  return mod.useChatStore as any;
}

describe('chatStore title persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('renamed tab title persists across reload', async () => {
    const useChatStore: any = await freshChatStore();
    // Ensure a tab exists
    const id = useChatStore.getState().createTab({ providerId: 'gemini' });
    useChatStore.getState().renameTab(id, 'My persistent title');

    // Verify raw storage contains the title
    const raw = localStorage.getItem('io-ai:chats');
    expect(raw).toBeTruthy();
    expect(raw!).toMatch(/My persistent title/);

    // Reload store and rehydrate
    const useChatStore2: any = await freshChatStore();
    await useChatStore2.persist.rehydrate();
    const titles = useChatStore2.getState().tabs.map((t: any) => t.title);
    expect(titles).toContain('My persistent title');
  });
});

