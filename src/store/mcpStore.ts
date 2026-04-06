import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type McpServer = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
};

interface McpState {
  servers: McpServer[];
  addServer: (name: string, url: string) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;
  updateServer: (id: string, patch: Partial<Pick<McpServer, 'name' | 'url'>>) => void;
}

export const useMcpStore = create<McpState>()(
  persist(
    (set) => ({
      servers: [],
      addServer: (name, url) =>
        set((s) => ({
          servers: [
            ...s.servers,
            { id: crypto.randomUUID(), name: name.trim(), url: url.trim(), enabled: true },
          ],
        })),
      removeServer: (id) =>
        set((s) => ({ servers: s.servers.filter((sv) => sv.id !== id) })),
      toggleServer: (id) =>
        set((s) => ({
          servers: s.servers.map((sv) =>
            sv.id === id ? { ...sv, enabled: !sv.enabled } : sv
          ),
        })),
      updateServer: (id, patch) =>
        set((s) => ({
          servers: s.servers.map((sv) =>
            sv.id === id ? { ...sv, ...patch } : sv
          ),
        })),
    }),
    {
      name: 'io-ai:mcp',
      partialize: (s) => ({ servers: s.servers }),
    }
  )
);
