import React from 'react';
import { Copy, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MessageActionsProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

export default function MessageActions({
  content,
  role,
  onRegenerate,
  isStreaming = false,
}: MessageActionsProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [content]);

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="icon-btn p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        title="Copy message"
        aria-label="Copy message"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      {role === 'assistant' && onRegenerate && !isStreaming && (
        <button
          onClick={onRegenerate}
          className="icon-btn p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}