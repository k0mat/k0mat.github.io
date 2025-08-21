import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SecretsMap = Record<string, string | null>;

interface SecretsState {
  // plaintext secrets persisted to localStorage
  secrets: SecretsMap; // e.g., { openrouter: 'sk-...' }

  // actions
  getKey: (providerId: string) => string | null;
  setKey: (providerId: string, key: string | null) => void;
  clearKey: (providerId: string) => void;
  clearAll: () => void;
}

const initialSecrets: SecretsMap = {};

export const useSecretsStore = create<SecretsState>()(
  persist(
    (set, get) => ({
      secrets: initialSecrets,
      getKey: (providerId) => get().secrets[providerId] ?? null,
      setKey: (providerId, key) => set((s) => ({ secrets: { ...s.secrets, [providerId]: key } })),
      clearKey: (providerId) =>
        set((s) => {
          const next = { ...s.secrets };
          delete next[providerId];
          return { secrets: next };
        }),
      clearAll: () => set({ secrets: {} }),
    }),
    {
      name: 'io-ai:secrets',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ secrets: state.secrets }),
    }
  )
);
