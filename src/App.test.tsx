import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

function makeReaderFromString(s: string) {
  const enc = new TextEncoder();
  const bytes = enc.encode(s);
  let sent = false;
  return {
    getReader() {
      return {
        async read() {
          if (sent) return { done: true, value: undefined as unknown as Uint8Array };
          sent = true;
          return { done: false, value: bytes };
        },
        releaseLock() { /* noop */ },
      };
    },
  } as unknown as ReadableStream<Uint8Array>;
}

describe('App scaffold', () => {
  it('renders header and can send a message with OpenRouter', async () => {
    // Seed a fake OpenRouter key in secrets store
    const { useSecretsStore } = await import('./store/secretsStore');
    useSecretsStore.setState((s) => ({ ...s, secrets: { ...(s.secrets || {}), openrouter: 'sk-or-v1-test' } }));

    // Mock OpenRouter SSE response
    const sseSample =
      `data: {"choices":[{"delta":{"content":"Hi "}}]}\n` +
      `data: {"choices":[{"delta":{"content":"there"}}]}\n` +
      `data: [DONE]\n`;

    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeReaderFromString(sseSample),
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
