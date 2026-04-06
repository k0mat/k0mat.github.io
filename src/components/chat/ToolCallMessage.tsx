import React from 'react';
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import type { ChatMessage } from '../../store/chatStore';

interface Props {
  message: ChatMessage;
}

/**
 * Renders a tool-related message inline in the chat:
 *  - role === 'assistant' with toolCalls  → "🔧 Called tool X"
 *  - role === 'tool'                      → result output (collapsible)
 */
export default function ToolCallMessage({ message }: Props) {
  const [open, setOpen] = React.useState(false);

  if (message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        {message.toolCalls.map((tc) => (
          <div
            key={tc.id}
            className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 rounded px-3 py-1.5 font-mono"
          >
            <Wrench className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="text-blue-500 dark:text-blue-400 font-semibold">{tc.function.name}</span>
            <ToolArgs args={tc.function.arguments} />
          </div>
        ))}
      </div>
    );
  }

  if (message.role === 'tool') {
    const label = message.toolName
      ? message.toolName.replace(/^[^_]+__/, '') // strip namespace prefix for display
      : 'tool result';

    return (
      <div className="border border-zinc-200 dark:border-zinc-700 rounded text-xs">
        <button
          className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors rounded"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <Wrench className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="font-mono font-medium">{label}</span>
          <span className="text-zinc-400 dark:text-zinc-500 ml-auto">result</span>
        </button>
        {open && (
          <pre className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-700 whitespace-pre-wrap break-all overflow-auto max-h-48 text-zinc-600 dark:text-zinc-300 font-mono text-xs">
            {message.content || '(empty)'}
          </pre>
        )}
      </div>
    );
  }

  return null;
}

/** Renders tool call arguments inline — short ones inline, long ones as a tooltip/expand */
function ToolArgs({ args }: { args: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(args);
  } catch {
    parsed = args;
  }

  if (!parsed || (typeof parsed === 'object' && Object.keys(parsed as object).length === 0)) {
    return <span className="text-zinc-400">(no args)</span>;
  }

  const inline = JSON.stringify(parsed);
  if (inline.length <= 80) {
    return <span className="text-zinc-600 dark:text-zinc-300">{inline}</span>;
  }

  return (
    <span
      className="text-zinc-400 cursor-help underline decoration-dotted"
      title={JSON.stringify(parsed, null, 2)}
    >
      {`{${Object.keys(parsed as object).join(', ')}}`}
    </span>
  );
}
