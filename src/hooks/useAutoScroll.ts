import React from 'react';

function safeScrollToBottom(el: HTMLElement, behavior: ScrollBehavior) {
  const top = el.scrollHeight;
  const canScrollTo = typeof (el as HTMLElement).scrollTo === 'function';
  if (canScrollTo) {
    (el as HTMLElement).scrollTo({ top, behavior });
  } else {
    el.scrollTop = top;
  }
}

export function useAutoScroll(autoScrollEnabled: boolean, autoScrollAnchor: string) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottomImmediate = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Smooth for short distances, instant for long jumps
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const behavior: ScrollBehavior = prefersReduced ? 'auto' : (distance < 800 ? 'smooth' : 'auto');
    safeScrollToBottom(el, behavior);
  }, []);

  // Auto-scroll to bottom when messages update or last message grows
  React.useEffect(() => {
    if (!autoScrollEnabled) return;
    const el = scrollRef.current;
    if (!el) return;
    const delta = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = delta < 120;
    if (nearBottom) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      safeScrollToBottom(el, prefersReduced ? 'auto' : 'smooth');
    }
  }, [autoScrollEnabled, autoScrollAnchor]);

  return { scrollRef, scrollToBottomImmediate };
}