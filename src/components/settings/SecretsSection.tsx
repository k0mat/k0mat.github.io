import React from 'react';
import ProviderKeyCard from './ProviderKeyCard';
import { useSecretsStore } from '../../store/secretsStore';
import { toast } from 'sonner';

export default function SecretsSection() {
  const { clearAll } = useSecretsStore();

  function handleClearAll() {
    const ok = window.confirm('Clear all saved secrets? This cannot be undone.');
    if (!ok) return;
    clearAll();
    toast('Cleared all secrets');
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Keys are stored locally in your browser (no server). You can remove them anytime.</div>

      <ProviderKeyCard
        providerId="openrouter"
        title="OpenRouter"
        placeholder="sk-or-v1-..."
        help="OpenRouter lets you access many models with one key."
      />

      <ProviderKeyCard
        providerId="gemini"
        title="Gemini (Google)"
        placeholder="AIza..."
        help="Google AI Studio API key for Gemini models. Validation not available in-browser."
      />

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Manage</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline text-red-600 border-red-500 hover:bg-red-50 dark:hover:bg-zinc-800" onClick={handleClearAll}>Clear all</button>
        </div>
      </div>
    </div>
  );
}
