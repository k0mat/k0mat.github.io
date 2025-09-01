import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';
import type { ChatMessage } from '../store/chatStore';
import { MoreHorizontal } from 'lucide-react';

// Build a sanitize schema that preserves code/pre classes for syntax highlighting
const mdSanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...(defaultSchema as any).attributes,
    code: [ ...(((defaultSchema as any).attributes?.code) || []), ['className'], ['data-language'] ],
    pre:  [ ...(((defaultSchema as any).attributes?.pre)  || []), ['className'] ],
    span: [ ...(((defaultSchema as any).attributes?.span) || []), ['className'] ],
    a:    [ ...(((defaultSchema as any).attributes?.a)   || []), ['target'], ['rel'] ],
  },
};

function formatTime(ts: number) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const previewOf = (text: string, limit = 300) => {
  if ((text?.length ?? 0) <= limit) return text;
  // Try to cut on a safe boundary
  const slice = text.slice(0, limit);
  const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
  return (lastBreak > 200 ? slice.slice(0, lastBreak) : slice) + '…';
};

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming: boolean;
  isLast: boolean;
  autoCollapseEnabled: boolean;
  collapseMinLength: number;
  collapseAgeMessages: number;
  onToggleExpanded: (id: string, v?: boolean) => void;
  isExpanded: boolean;
  newerCount: number;
}

export default function ChatMessageComponent({ message: m, isStreaming, isLast, autoCollapseEnabled, collapseMinLength, collapseAgeMessages, onToggleExpanded, isExpanded, newerCount }: ChatMessageProps) {
  const shouldCollapse = (m: ChatMessage, isLast: boolean) => {
    if (!autoCollapseEnabled) return false;
    if (m.role !== 'assistant') return false;
    // Don't collapse the actively streaming last assistant message
    if (isLast && isStreaming) return false;
    const lengthOk = (m.content?.length ?? 0) >= collapseMinLength;
    const ageOk = newerCount >= collapseAgeMessages;
    return lengthOk && ageOk;
  };

  const collapsedByRule = shouldCollapse(m, isLast);
  const collapsed = collapsedByRule && !isExpanded;
  const contentToRender = collapsed ? previewOf(m.content) : m.content;

  return (
    <div key={m.id} className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[85%]'}>
      <div className={
        (m.role === 'user'
          ? 'bg-blue-600/90 text-white rounded-lg px-3 py-2 whitespace-pre-wrap'
          : 'assistant-bubble whitespace-pre-wrap')
      }>
        {m.role === 'assistant' ? (
          (m.content?.trim()?.length ?? 0) === 0 && isStreaming && isLast
            ? (
              <span className="typing text-zinc-500 dark:text-zinc-400" aria-label="Assistant is typing">
                <span className="dot"/>
                <span className="dot"/>
                <span className="dot"/>
              </span>
            ) : (
              <>
                <div className={`markdown ${collapsed ? 'collapsed' : ''}`}>
                  <ReactMarkdown
                    className="markdown"
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[[rehypeSanitize, mdSanitizeSchema], rehypeHighlight as any]}
                    components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" /> }}
                  >
                    {contentToRender}
                  </ReactMarkdown>
                </div>
                {collapsedByRule && (
                  <div className="mt-2 flex items-center gap-2">
                    <button className="btn btn-outline text-xs" onClick={() => onToggleExpanded(m.id!, true)} title="Expand message">
                      <MoreHorizontal className="h-4 w-4" />
                      Expand
                    </button>
                    <span className="text-[11px] text-zinc-500">Auto-collapsed: old and long</span>
                  </div>
                )}
                {!collapsed && collapsedByRule && (
                  <div className="mt-2">
                    <button className="btn btn-outline text-xs" onClick={() => onToggleExpanded(m.id!, false)} title="Collapse message">Collapse</button>
                  </div>
                )}
              </>
            )
        ) : (
          <ReactMarkdown
            className="markdown"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeSanitize, mdSanitizeSchema], rehypeHighlight as any]}
            components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" /> }}
          >
            {m.content}
          </ReactMarkdown>
        )}
      </div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
        {m.role === 'assistant' && m.modelUsed && (
          <span className="badge">{m.modelUsed}</span>
        )}
        {(() => { const ts = m.createdAt; return (typeof ts === 'number' && !Number.isNaN(ts)) ? (
          <span title={new Date(ts).toLocaleString()}>{formatTime(ts)}</span>
        ) : null; })()}
      </div>
    </div>
  );
}

