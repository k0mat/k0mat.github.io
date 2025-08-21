import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App scaffold', () => {
  it('renders header and can send a message with Gemini', async () => {
    // Seed a fake Gemini key in secrets store
    const { useSecretsStore } = await import('./store/secretsStore');
    useSecretsStore.setState((s) => ({ ...s, secrets: { ...(s.secrets || {}), gemini: 'test-key' } }));

    // Mock Gemini fetch response
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hi there' }] } }] }),
    });

    render(<App />);
    expect(screen.getByText(/io-ai/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/ask something/i);
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    const reply = await screen.findByText(/Hi there/i, {}, { timeout: 3000 });
    expect(reply).toBeInTheDocument();
  });
});
