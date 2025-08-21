import { describe, it, expect, beforeEach } from 'vitest';
import { useModelsStore } from './modelsStore';

describe('modelsStore', () => {
  beforeEach(() => {
    // reset persisted state
    localStorage.clear();
    useModelsStore.setState({ byProvider: {} });
  });

  it('adds favorites and sets default if none', () => {
    useModelsStore.getState().addFavorite('echo', 'echo-2');
    expect(useModelsStore.getState().byProvider.echo?.favorites).toEqual(['echo-2']);
    expect(useModelsStore.getState().getDefaultFor('echo')).toBe('echo-2');

    useModelsStore.getState().addFavorite('echo', 'echo-3');
    expect(useModelsStore.getState().byProvider.echo?.favorites).toEqual(['echo-2', 'echo-3']);
    expect(useModelsStore.getState().getDefaultFor('echo')).toBe('echo-2');
  });

  it('setDefault and removeFavorite behave correctly', () => {
    const s = useModelsStore.getState();
    s.addFavorite('openrouter', 'openrouter/auto');
    s.addFavorite('openrouter', 'google/gemini-flash-1.5');
    s.setDefault('openrouter', 'google/gemini-flash-1.5');
    expect(useModelsStore.getState().getDefaultFor('openrouter')).toBe('google/gemini-flash-1.5');

    useModelsStore.getState().removeFavorite('openrouter', 'google/gemini-flash-1.5');
    expect(useModelsStore.getState().byProvider.openrouter?.favorites).toEqual(['openrouter/auto']);
    expect(useModelsStore.getState().getDefaultFor('openrouter')).toBe('openrouter/auto');

    useModelsStore.getState().setDefault('openrouter', null);
    expect(useModelsStore.getState().getDefaultFor('openrouter')).toBeNull();
  });
});
