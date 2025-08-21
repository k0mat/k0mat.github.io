import React from 'react';
import { useAppStore } from '../../store/appStore';

export default function ChatPrefsSection() {
  const {
    showReasoning, setShowReasoning,
    autoScrollEnabled, setAutoScrollEnabled,
    autoCollapseEnabled, setAutoCollapseEnabled,
    collapseAgeMessages, setCollapseAgeMessages,
    collapseMinLength, setCollapseMinLength,
  } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <div className="font-medium">Reasoning visibility</div>
        <div className="text-xs text-zinc-500">Include reasoning tokens in streamed output when models provide them.</div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-700" checked={showReasoning} onChange={e => setShowReasoning(e.target.checked)} />
          Show reasoning
        </label>
      </div>

      <div className="card space-y-2">
        <div className="font-medium">Auto-scroll</div>
        <div className="text-xs text-zinc-500">Keep the chat view pinned to the latest messages while streaming and on send.</div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-700" checked={autoScrollEnabled} onChange={e => setAutoScrollEnabled(e.target.checked)} />
          Enable auto-scroll
        </label>
      </div>

      <div className="card space-y-2">
        <div className="font-medium">Auto-collapse</div>
        <div className="text-xs text-zinc-500">Collapse older, long assistant messages by default. You can expand them inline.</div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-700" checked={autoCollapseEnabled} onChange={e => setAutoCollapseEnabled(e.target.checked)} />
          Enable auto-collapse
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="w-40">Collapse if ≥</span>
            <input
              type="number"
              min={0}
              className="input w-24"
              value={collapseAgeMessages}
              onChange={e => setCollapseAgeMessages(parseInt(e.target.value || '0', 10))}
            />
            <span>newer msgs</span>
          </label>
          <label className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="w-40">Collapse if length ≥</span>
            <input
              type="number"
              min={0}
              className="input w-28"
              value={collapseMinLength}
              onChange={e => setCollapseMinLength(parseInt(e.target.value || '0', 10))}
            />
            <span>chars</span>
          </label>
        </div>
      </div>
    </div>
  );
}
