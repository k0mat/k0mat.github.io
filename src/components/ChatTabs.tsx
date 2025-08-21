import React from 'react';
import { Plus, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export default function ChatTabs() {
  const { tabs, activeId, setActive, createTab, closeTab } = useChatStore();

  return (
    <div className="border-b border-[var(--border)]">
      <div className="flex items-center gap-1 px-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`group relative my-1 rounded-t-md px-3 py-1.5 text-sm ${
              activeId === t.id
                ? 'bg-[var(--surface)] border border-b-transparent border-[var(--border)]'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title={t.title}
            aria-current={activeId === t.id ? 'page' : undefined}
          >
            <span className="pr-5 truncate inline-block max-w-[14rem] align-middle">{t.title}</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-100">
              <X
                className="h-4 w-4"
                aria-label={`Close ${t.title}`}
                onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              />
            </span>
          </button>
        ))}
        <button
          className="ml-1 my-1 inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => createTab()}
          title="New chat"
          aria-label="New chat"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>
    </div>
  );
}
