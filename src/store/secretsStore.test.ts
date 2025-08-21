import { describe, it, expect, beforeEach, vi } from 'vitest';

function freshStore() {
  vi.resetModules();
  return import('./secretsStore').then(m => m.useSecretsStore as any);
}

describe('secretsStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('persists plaintext secrets across reload', async () => {
    const useSecretsStore: any = await freshStore();
    useSecretsStore.getState().setKey('openrouter', 'sk-test');

    const data = localStorage.getItem('io-ai:secrets');
    expect(data).toBeTruthy();

    const useSecretsStore2: any = await freshStore();
    // Explicitly rehydrate
    await useSecretsStore2.persist.rehydrate();

    expect(useSecretsStore2.getState().getKey('openrouter')).toBe('sk-test');
  });

  it('clearAll removes secrets and clears storage keys', async () => {
    const useSecretsStore: any = await freshStore();
    useSecretsStore.getState().setKey('gemini', 'AIza-test');
    let raw = localStorage.getItem('io-ai:secrets');
    expect(raw).toBeTruthy();

    useSecretsStore.getState().clearAll();
    expect(useSecretsStore.getState().getKey('gemini')).toBeNull();

    // After clear, storage should still exist but contain empty secrets after next persist write
    const useSecretsStore2: any = await freshStore();
    await useSecretsStore2.persist.rehydrate();
    expect(useSecretsStore2.getState().getKey('gemini')).toBeNull();
  });
});
