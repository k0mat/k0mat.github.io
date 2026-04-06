import React from 'react';
import { MessageSquare, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import type { Theme } from '../../store/appStore';

interface ChatHeaderProps {
  theme: Theme;
  onCycleTheme: () => void;
  onOpenSettings: () => void;
  needsKey: boolean;
}

export default function ChatHeader({
  theme,
  onCycleTheme,
  onOpenSettings,
  needsKey,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
        <MessageSquare className="h-5 w-5" />
        <span className="font-semibold">io-ai</span>
        <span className="text-xs text-zinc-400">(starter)</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`icon-btn ${needsKey ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-200'}`}
          title="Settings"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
        <button
          aria-label="toggle theme"
          className="icon-btn text-zinc-700 dark:text-zinc-200"
          onClick={onCycleTheme}
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}