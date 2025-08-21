# Project Memory & Context

This file tracks active work, decisions, ideas, and questions that need input. Keep it short and current.

Memory rotation policy
- Keep Active Work to 3–5 items max (truly in progress).
- Keep a Recently Shipped list with the last 5 shipped items (with brief notes). Remove older entries.
- Decisions: list only those still relevant to current direction; prune stale ones.
- Revisit monthly or after major changes.

## Active Work (current)

- OpenAI provider adapter
  - Add adapter with streaming, key entry in Settings, and basic tests
- Multi-model fan-out (compare models side-by-side)
  - Parallel runs, per-model abort/retry, simple side-by-side UI

## Recently Shipped (last 5)

- Message timestamps
  - Added createdAt to ChatMessage; render relative HH:MM with full timestamp on hover; safely hidden for legacy messages
- Show model name on LLM responses
  - Assistant messages display the model used as a small badge
- Auto chat tab naming (Fibonacci-triggered)
  - After 1, 2, 3, 5, 8, ... user messages, the app asks the current model for a concise title and updates the tab name
- Simplified secrets storage (no encryption at rest)
  - Removed passphrase/unlock flow; keys persist plainly via localStorage; Settings UI cleaned up; tests/docs updated
- Removed storage versioning/migrations for now
  - Dropped version/migrate logic from persisted stores to reduce complexity until first stable

## Decisions (current)

- Browser-only, BYO-keys (no backend) for personal use.
- OpenRouter first for widest model access.
- Tailwind + CSS variables for fast iteration and consistent theming.
- No initial system prompt to avoid biasing outputs.
- No encryption-at-rest in v1; secrets stored plaintext in localStorage for simplicity.
- No persisted-store versioning/migrations until post-v1.

## Ideas / Backlog

- Providers: OpenAI (next), Mistral; Anthropic likely needs proxy.
- Multi-model fan-out: parallel runs, per-model abort, side-by-side compare.
- Sanitize rendered markdown (rehype-sanitize) to reduce XSS risk.
- Export/import conversations (JSON); model presets.
- Developer mode: raw SSE/debug panel; timing/latency stats.
- Token estimates & cost badges; controlled concurrency.
- PWA shell for offline/installation.
- /settings route; a11y tests for focus trap.

## Questions for User

- Which providers/models first after OpenRouter + Gemini? (OpenAI, Mistral)
- Default for “Show reasoning” (ON or OFF) for reasoning models?
- Preferred auto-lock behavior (timeout length, default on/off)?
