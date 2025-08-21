import type { Provider, SendMessageArgs } from '../providers/adapters';
import { useChatStore } from '../store/chatStore';

export function isFibTrigger(n: number) {
  // Trigger on 1,2,3,5,8,13,21
  const set = new Set([1, 2, 3, 5, 8, 13, 21]);
  return set.has(n);
}

export async function maybeAutoName(tabId: string, curProvider: Provider, apiKey?: string, usedModel?: string) {
  try {
    const { tabs, renameTab } = useChatStore.getState();
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const userCount = (tab.messages || []).filter(m => m.role === 'user').length;
    if (!isFibTrigger(userCount)) return;
    if (!apiKey) return;

    const lastFew = (tab.messages || []).slice(-8).map(m => ({ role: m.role, content: m.content }));
    const sys = { role: 'user' as const, content: 'You generate concise chat titles. Output only the title, 3-6 words, no quotes.' };
    const user = { role: 'user' as const, content: 'Based on the conversation, provide a short title only.' };

    const args: SendMessageArgs = {
      model: usedModel || tab.model,
      messages: [sys, ...lastFew, user],
      apiKey,
      temperature: 0.2,
      maxTokens: 24,
    };

    let title = '';
    for await (const chunk of curProvider.sendMessageStream(args)) {
      title += chunk;
      if (title.length > 64) break;
    }
    title = (title || '').trim().replace(/^"|"$/g, '').replace(/^#\s*/, '');
    if (title) renameTab(tabId, title);
  } catch {
    // best-effort; ignore errors
  }
}

