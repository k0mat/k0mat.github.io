import React from 'react';
import { useMcpStore } from '../../store/mcpStore';
import { listTools } from '../../lib/mcpClient';
import { toast } from 'sonner';
import { Trash2, Plus, ToggleLeft, ToggleRight, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

type TestState = 'idle' | 'testing' | 'ok' | 'error';

interface ServerRowProps {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

function ServerRow({ id, name, url, enabled }: ServerRowProps) {
  const { removeServer, toggleServer, updateServer } = useMcpStore();
  const [editName, setEditName] = React.useState(name);
  const [editUrl, setEditUrl] = React.useState(url);
  const [testState, setTestState] = React.useState<TestState>('idle');
  const [testMsg, setTestMsg] = React.useState('');

  // Sync if parent re-renders with different values
  React.useEffect(() => { setEditName(name); }, [name]);
  React.useEffect(() => { setEditUrl(url); }, [url]);

  function handleBlurName() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== name) updateServer(id, { name: trimmed });
    else setEditName(name);
  }

  function handleBlurUrl() {
    const trimmed = editUrl.trim();
    if (trimmed && trimmed !== url) updateServer(id, { url: trimmed });
    else setEditUrl(url);
  }

  async function handleTest() {
    const testUrl = editUrl.trim();
    if (!testUrl) return;
    setTestState('testing');
    setTestMsg('');
    try {
      const tools = await listTools(testUrl);
      setTestState('ok');
      setTestMsg(`Connected — ${tools.length} tool${tools.length !== 1 ? 's' : ''} available`);
    } catch (e) {
      setTestState('error');
      setTestMsg((e as Error).message ?? 'Connection failed');
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Enable/Disable toggle */}
        <button
          aria-label={enabled ? 'Disable server' : 'Enable server'}
          title={enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
          className="icon-btn text-zinc-500 shrink-0"
          onClick={() => toggleServer(id)}
        >
          {enabled ? (
            <ToggleRight className="h-5 w-5 text-blue-500" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>

        {/* Name */}
        <input
          className="input flex-1 min-w-24 text-sm font-medium"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleBlurName}
          placeholder="Server name"
          aria-label="Server name"
        />

        {/* Remove */}
        <button
          aria-label="Remove server"
          title="Remove"
          className="icon-btn text-red-500 shrink-0"
          onClick={() => {
            if (window.confirm(`Remove MCP server "${name}"?`)) {
              removeServer(id);
              toast(`Removed "${name}"`);
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* URL */}
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 text-sm font-mono"
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          onBlur={handleBlurUrl}
          placeholder="https://your-mcp-server.example.com"
          aria-label="Server URL"
          spellCheck={false}
        />
        <button
          className="btn btn-outline text-xs flex items-center gap-1 shrink-0"
          onClick={handleTest}
          disabled={testState === 'testing'}
          title="Test connection"
          aria-label="Test connection"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${testState === 'testing' ? 'animate-spin' : ''}`} />
          Test
        </button>
      </div>

      {/* Test result */}
      {testState !== 'idle' && testMsg && (
        <div className={`flex items-center gap-1.5 text-xs ${testState === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
          {testState === 'ok' ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
          {testMsg}
        </div>
      )}
    </div>
  );
}

export default function McpSection() {
  const { servers, addServer } = useMcpStore();
  const [newName, setNewName] = React.useState('');
  const [newUrl, setNewUrl] = React.useState('');

  function handleAdd() {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !url) {
      toast.error('Please enter both a name and URL');
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error('Invalid URL format');
      return;
    }
    addServer(name, url);
    setNewName('');
    setNewUrl('');
    toast.success(`Added MCP server "${name}"`);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="font-semibold text-base mb-1">MCP Servers</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Connect remote MCP (Model Context Protocol) servers to give the AI access to tools.
          The server must expose an HTTP endpoint that accepts JSON-RPC 2.0 requests and support
          CORS from this origin.
        </p>
      </div>

      {/* Existing servers */}
      {servers.length === 0 ? (
        <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">No MCP servers configured yet.</div>
      ) : (
        <div className="space-y-3">
          {servers.map((sv) => (
            <ServerRow key={sv.id} {...sv} />
          ))}
        </div>
      )}

      {/* Add new server */}
      <div className="card space-y-3">
        <div className="font-medium text-sm">Add server</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1 text-sm"
            placeholder="Name (e.g. filesystem)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="New server name"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <input
            className="input flex-[2] text-sm font-mono"
            placeholder="https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            aria-label="New server URL"
            spellCheck={false}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button
            className="btn btn-primary flex items-center gap-1.5 shrink-0"
            onClick={handleAdd}
            disabled={!newName.trim() || !newUrl.trim()}
            aria-label="Add server"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1 border rounded p-3 border-dashed border-zinc-300 dark:border-zinc-700">
        <div className="font-medium text-zinc-500 dark:text-zinc-400">How it works</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Each enabled server is queried for its tool list before every message.</li>
          <li>Tools are namespaced as <code className="font-mono">serverName__toolName</code>.</li>
          <li>When the model wants to call a tool, the app executes it and feeds the result back automatically (up to 5 turns).</li>
          <li>CORS must be enabled on the server for this browser-based app to reach it.</li>
        </ul>
      </div>
    </div>
  );
}
