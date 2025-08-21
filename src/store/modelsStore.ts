import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Provider } from '../providers/adapters';

export type ProviderModels = {
  favorites: string[];
  defaultModel: string | null;
};

interface ModelsState {
  byProvider: Record<Provider['id'], ProviderModels>;
  addFavorite: (providerId: Provider['id'], model: string) => void;
  removeFavorite: (providerId: Provider['id'], model: string) => void;
  setDefault: (providerId: Provider['id'], model: string | null) => void;
  getDefaultFor: (providerId: Provider['id']) => string | null;
}

const ensureProv = (state: ModelsState, pid: Provider['id']): ProviderModels => {
  return state.byProvider[pid] ?? { favorites: [], defaultModel: null };
};

export const useModelsStore = create<ModelsState>()(
  persist(
    (set, get) => ({
      byProvider: {},
      addFavorite: (pid, model) => set((s) => {
        const cur = ensureProv(s, pid);
        if (!model.trim()) return s;
        if (cur.favorites.includes(model)) return s;
        const updated: ProviderModels = {
          favorites: [...cur.favorites, model],
          defaultModel: cur.defaultModel ?? model,
        };
        return { byProvider: { ...s.byProvider, [pid]: updated } };
      }),
      removeFavorite: (pid, model) => set((s) => {
        const cur = ensureProv(s, pid);
        const favs = cur.favorites.filter((m) => m !== model);
        const updated: ProviderModels = {
          favorites: favs,
          defaultModel: cur.defaultModel === model ? (favs[0] ?? null) : cur.defaultModel,
        };
        return { byProvider: { ...s.byProvider, [pid]: updated } };
      }),
      setDefault: (pid, model) => set((s) => {
        const cur = ensureProv(s, pid);
        const updated: ProviderModels = {
          favorites: cur.favorites.includes(model || '') || model === null ? cur.favorites : [ ...(cur.favorites), ...(model ? [model] : []) ],
          defaultModel: model,
        };
        return { byProvider: { ...s.byProvider, [pid]: updated } };
      }),
      getDefaultFor: (pid) => ensureProv(get(), pid).defaultModel,
    }),
    { name: 'io-ai:models', partialize: (s) => ({ byProvider: s.byProvider }) }
  )
);

