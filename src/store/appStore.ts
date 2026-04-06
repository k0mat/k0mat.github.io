import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  showReasoning: boolean;
  setShowReasoning: (v: boolean) => void;
  autoScrollEnabled: boolean;
  setAutoScrollEnabled: (v: boolean) => void;
  autoCollapseEnabled: boolean;
  setAutoCollapseEnabled: (v: boolean) => void;
  collapseAgeMessages: number; // collapse if there are at least this many newer messages
  setCollapseAgeMessages: (n: number) => void;
  collapseMinLength: number; // collapse if content length exceeds this
  setCollapseMinLength: (n: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (t) => set({ theme: t }),
      showReasoning: true,
      setShowReasoning: (v) => set({ showReasoning: v }),
      autoScrollEnabled: true,
      setAutoScrollEnabled: (v) => set({ autoScrollEnabled: v }),
      autoCollapseEnabled: true,
      setAutoCollapseEnabled: (v) => set({ autoCollapseEnabled: v }),
      collapseAgeMessages: 3,
      setCollapseAgeMessages: (n) => set({ collapseAgeMessages: Math.max(0, Math.floor(n || 0)) }),
      collapseMinLength: 800,
      setCollapseMinLength: (n) => set({ collapseMinLength: Math.max(0, Math.floor(n || 0)) }),
    }),
    {
      name: 'io-ai:app',
      partialize: (s) => ({
        theme: s.theme,
        showReasoning: s.showReasoning,
        autoScrollEnabled: s.autoScrollEnabled,
        autoCollapseEnabled: s.autoCollapseEnabled,
        collapseAgeMessages: s.collapseAgeMessages,
        collapseMinLength: s.collapseMinLength,
      }),
    }
  )
);
