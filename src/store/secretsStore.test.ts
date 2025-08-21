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

  it('stores only encrypted blob when encryption enabled and rehydrates after unlock', async () => {
    const useSecretsStore: any = await freshStore();
    useSecretsStore.getState().setKey('gemini', 'AIza-test');
    await useSecretsStore.getState().encryptAll('pass');

    const raw = localStorage.getItem('io-ai:secrets');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.secrets).toEqual({});
    expect(parsed.state.encryptedBlob).toBeTruthy();

    const useSecretsStore2: any = await freshStore();
    await useSecretsStore2.persist.rehydrate();
    expect(useSecretsStore2.getState().getKey('gemini')).toBeNull();

    await useSecretsStore2.getState().unlock('pass');
    expect(useSecretsStore2.getState().getKey('gemini')).toBe('AIza-test');
  });
});
