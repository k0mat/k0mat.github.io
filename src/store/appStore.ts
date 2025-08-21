import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  showReasoning: boolean;
  setShowReasoning: (v: boolean) => void;
  autoScrollEnabled: boolean;
  setAutoScrollEnabled: (v: boolean) => void;
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
    }),
    {
      name: 'io-ai:app',
      partialize: (s) => ({ theme: s.theme, showReasoning: s.showReasoning, autoScrollEnabled: s.autoScrollEnabled }),
    }
  )
);
