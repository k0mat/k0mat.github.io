import React from 'react';
import SecretsSection from './SecretsSection';
import ChatPrefsSection from './ChatPrefsSection';
import ModelsSection from './ModelsSection';
import { X } from 'lucide-react';

export type SettingsSectionKey = 'secrets' | 'chat' | 'models';

export default function SettingsPanel({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: SettingsSectionKey }) {
  const [section, setSection] = React.useState<SettingsSectionKey>(initial ?? 'secrets');
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => { if (initial) setSection(initial); }, [initial]);

  React.useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null;
    const focusFirst = () => {
      if (closeBtnRef.current) { closeBtnRef.current.focus(); return; }
      const focusables = getFocusable(panelRef.current);
      if (focusables.length) {
        const first = focusables[0];
        if (first && typeof first.focus === 'function') first.focus();
      }
    };
    const id = setTimeout(focusFirst, 0);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [open, onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || e.key !== 'Tab') return;
    const focusables = getFocusable(panelRef.current);
    if (focusables.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const curIdx = focusables.findIndex((el) => el === current);
    let nextIdx = curIdx;
    if (e.shiftKey) {
      e.preventDefault();
      nextIdx = curIdx <= 0 ? focusables.length - 1 : curIdx - 1;
    } else {
      e.preventDefault();
      nextIdx = curIdx === -1 || curIdx === focusables.length - 1 ? 0 : curIdx + 1;
    }
    const el = focusables[(nextIdx + focusables.length) % focusables.length];
    if (el && typeof el.focus === 'function') el.focus();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={panelRef} className="absolute inset-y-0 right-0 w-full max-w-5xl bg-[var(--bg)] shadow-xl border-l border-[var(--border)] flex" onKeyDown={onKeyDown}>
        <aside className="w-56 border-r border-[var(--border)] p-4 space-y-2">
          <div id="settings-title" className="text-sm font-medium mb-2">Settings</div>
          <nav className="flex flex-col gap-1">
            <button className={`btn btn-outline ${section==='secrets' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`} onClick={()=>setSection('secrets')}>Secrets</button>
            <button className={`btn btn-outline ${section==='models' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`} onClick={()=>setSection('models')}>Models</button>
            <button className={`btn btn-outline ${section==='chat' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`} onClick={()=>setSection('chat')}>Chat Preferences</button>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6 relative">
          <button
            ref={closeBtnRef}
            aria-label="Close settings"
            title="Close"
            className="icon-btn absolute top-3 right-3"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          {section === 'secrets' && <SecretsSection />}
          {section === 'models' && <ModelsSection />}
          {section === 'chat' && <ChatPrefsSection />}
        </main>
      </div>
    </div>
  );
}

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  // Only visible and not disabled
  return nodes.filter((el) => !el.hasAttribute('disabled') && isVisible(el));
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return style.visibility !== 'hidden' && style.display !== 'none';
}
