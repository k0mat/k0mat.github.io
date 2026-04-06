import React from 'react';
import { SquarePen, StopCircle } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder = 'Ask something…',
}: ChatInputProps) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className="flex items-center gap-2">
      <textarea
        className="textarea flex-1 min-h-[48px] resize-none"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Chat message input"
      />
      {isStreaming ? (
        <button
          className="btn btn-danger"
          onClick={onStop}
          aria-label="Stop streaming"
        >
          <StopCircle className="h-4 w-4" /> Stop
        </button>
      ) : (
        <button
          className={`btn ${disabled ? 'btn-warning' : 'btn-primary'}`}
          onClick={onSend}
          disabled={disabled}
          title={disabled ? 'Enter your API key' : 'Send'}
          aria-label="Send message"
        >
          <SquarePen className="h-4 w-4" /> Send
        </button>
      )}
    </div>
  );
}