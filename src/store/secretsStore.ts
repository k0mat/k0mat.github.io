import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EncryptedPayload } from '../core/crypto';
import { encryptString, decryptString } from '../core/crypto';

export type SecretsMap = Record<string, string | null>;

interface SecretsState {
  // plaintext secrets (in-memory when unlocked or not using passphrase)
  secrets: SecretsMap; // e.g., { openrouter: 'sk-...' }

  // encrypted at rest (persisted)
  encryptedBlob: EncryptedPayload | null;

  // runtime only
  isUnlocked: boolean;
  passphrase?: string; // not persisted

  // derived
  hasEncryptedData: boolean;

  // actions
  getKey: (providerId: string) => string | null;
  setKey: (providerId: string, key: string | null) => void;
  clearKey: (providerId: string) => void;
  encryptAll: (passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  changePassphrase: (oldPass: string, newPass: string) => Promise<void>;
  lock: () => void;
  clearAll: () => void;
}

const initialSecrets: SecretsMap = {};

export const useSecretsStore = create<SecretsState>()(
  persist(
    (set, get) => ({
      secrets: initialSecrets,
      encryptedBlob: null,
      isUnlocked: false,
      passphrase: undefined,
      get hasEncryptedData() {
        return get().encryptedBlob != null;
      },
      getKey: (providerId) => get().secrets[providerId] ?? null,
      setKey: (providerId, key) => set((s) => ({ secrets: { ...s.secrets, [providerId]: key } })),
      clearKey: (providerId) => set((s) => {
        const next = { ...s.secrets };
        delete next[providerId];
        return { secrets: next };
      }),
      encryptAll: async (passphrase: string) => {
        const payload = JSON.stringify({ secrets: get().secrets });
        const blob = await encryptString(payload, passphrase);
        set({ encryptedBlob: blob, isUnlocked: true, passphrase });
      },
      unlock: async (passphrase: string) => {
        const blob = get().encryptedBlob;
        if (!blob) {
          set({ isUnlocked: true, passphrase });
          return;
        }
        const json = await decryptString(blob, passphrase);
        const data = JSON.parse(json) as { secrets?: SecretsMap };
        set({ secrets: data.secrets ?? {}, isUnlocked: true, passphrase });
      },
      changePassphrase: async (oldPass: string, newPass: string) => {
        const blob = get().encryptedBlob;
        if (blob) {
          await decryptString(blob, oldPass); // throws on wrong pass
        }
        const payload = JSON.stringify({ secrets: get().secrets });
        const newBlob = await encryptString(payload, newPass);
        set({ encryptedBlob: newBlob, isUnlocked: true, passphrase: newPass });
      },
      lock: () => set({ isUnlocked: false, passphrase: undefined }),
      clearAll: () => set({ secrets: {}, encryptedBlob: null, isUnlocked: false, passphrase: undefined }),
    }),
    {
      name: 'io-ai:secrets',
      version: 2,
      partialize: (state) => ({
        encryptedBlob: state.encryptedBlob,
        // Persist plaintext only if not encrypted, for users who opt out of passphrase
        secrets: state.encryptedBlob ? {} : state.secrets,
      }),
      migrate: (persisted, fromVersion) => {
        if (!persisted) return persisted as any;
        if (fromVersion < 2) {
          // v1 shape had: { openrouterKey, encryptedBlob, ... }
          const v1 = persisted as any;
          const secrets: SecretsMap = {};
          if (typeof v1.openrouterKey === 'string' && v1.openrouterKey) {
            secrets['openrouter'] = v1.openrouterKey;
          }
          return {
            secrets,
            encryptedBlob: (v1 as any).encryptedBlob ?? null,
            isUnlocked: false,
          } as Partial<SecretsState> as any;
        }
        return persisted as any;
      },
    }
  )
);
