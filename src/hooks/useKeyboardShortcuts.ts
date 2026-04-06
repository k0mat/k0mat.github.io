import React from 'react';
import { useChatStore } from '../store/chatStore';

interface KeyboardShortcutsOptions {
  onNewChat?: () => void;
  onOpenSettings?: () => void;
  onSend?: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
}

export function useKeyboardShortcuts({
  onNewChat,
  onOpenSettings,
  onSend,
  onStop,
  isStreaming = false,
}: KeyboardShortcutsOptions) {
  const { createTab } = useChatStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl/Cmd + N: New chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (onNewChat) {
          onNewChat();
        } else {
          createTab();
        }
        return;
      }

      // Ctrl/Cmd + ,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        onOpenSettings?.();
        return;
      }

      // Ctrl/Cmd + /: Show shortcuts help (could be implemented later)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // TODO: Show shortcuts modal
        console.log('Keyboard shortcuts help not yet implemented');
        return;
      }

      // Only handle these shortcuts when not in an input
      if (isInput) return;

      // Enter: Send message (when not streaming)
      if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
        e.preventDefault();
        onSend?.();
        return;
      }

      // Escape: Stop streaming
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        onStop?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTab, onNewChat, onOpenSettings, onSend, onStop, isStreaming]);
}