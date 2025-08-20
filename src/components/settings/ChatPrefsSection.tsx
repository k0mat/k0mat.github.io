import React from 'react';
import { useAppStore } from '../../store/appStore';

export default function ChatPrefsSection() {
  const { showReasoning, setShowReasoning } = useAppStore();
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
    </div>
  );
}

