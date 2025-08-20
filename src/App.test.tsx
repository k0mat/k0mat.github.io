import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App scaffold', () => {
  it('renders header and can send echo message', async () => {
    render(<App />);
    expect(screen.getByText(/io-ai/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/ask something/i);
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    // Wait for echo end marker
    const end = await screen.findByText(/— end —/i, {}, { timeout: 3000 });
    expect(end).toBeInTheDocument();
  });
});

