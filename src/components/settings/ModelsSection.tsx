import React from 'react';
import { useModelsStore } from '../../store/modelsStore';

export default function ModelsSection() {
  const { byProvider, addFavorite, removeFavorite, setDefault } = useModelsStore();

  // For now we focus on OpenRouter; extend as new providers are added
  const pid = 'openrouter' as const;
  const cfg = byProvider[pid] ?? { favorites: [], defaultModel: null };

  const [input, setInput] = React.useState('');

  function handleAdd() {
    const v = input.trim();
    if (!v) return;
    addFavorite(pid, v);
    setInput('');
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <div className="font-medium">OpenRouter Models</div>
        <div className="text-xs text-zinc-500">Add favorite model IDs (e.g., openrouter/auto, meta-llama/llama-3.1-8b-instruct, google/gemini-flash-1.5). Set a default applied when you pick OpenRouter in a new chat.</div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Add model id…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter') handleAdd(); }} />
          <button className="btn btn-primary" onClick={handleAdd}>Add</button>
        </div>
        {cfg.favorites.length === 0 ? (
          <div className="text-xs text-zinc-500">No favorites yet.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">Favorites</div>
            <ul className="space-y-1">
              {cfg.favorites.map((m) => (
                <li key={m} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="openrouter-default"
                      checked={cfg.defaultModel === m}
                      onChange={()=> setDefault(pid, m)}
                    />
                    <span className="truncate max-w-[28rem]" title={m}>{m}</span>
                    {cfg.defaultModel === m && <span className="badge">Default</span>}
                  </label>
                  <button className="btn btn-outline" onClick={()=> removeFavorite(pid, m)}>Remove</button>
                </li>
              ))}
            </ul>
            <div>
              <button className="btn" onClick={()=> setDefault(pid, null)}>Clear default</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

