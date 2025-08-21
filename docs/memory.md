# Project Memory & Context

This file tracks active work, decisions, ideas, and questions that need input. Keep it short and current.

Memory rotation policy
- Keep Active Work to 3–5 items max (truly in progress).
- Keep a Recently Shipped list with the last 5 shipped items (with brief notes). Remove older entries.
- Decisions: list only those still relevant to current direction; prune stale ones.
- Revisit monthly or after major changes.

## Active Work (current)

- (none)

## Recently Shipped (last 5)

- Remove Echo demo provider; add Gemini provider
  - Echo removed from UI and defaults; Gemini adapter added; Secrets/Models updated; tests green
- Model favorites dropdown
  - Favorites picker next to model input; selecting a favorite updates the session model
- Echo default model fix
  - Per-provider defaults applied on new tabs and provider switch; removed auto-correct override that reset Echo models
- Models settings (multi-provider)
  - Models section supports multiple providers (OpenRouter + Gemini); favorites + default per provider
- Chat tabs system (MVP)
  - Add/close/switch tabs; persisted via Zustand; keyboard and mouse friendly; tests still green

## Decisions (current)

- Browser-only, BYO-keys (no backend) for personal use.
- OpenRouter first for widest model access.
- Tailwind + CSS variables for fast iteration and consistent theming.
- No initial system prompt to avoid biasing outputs.

## Ideas / Backlog

- Providers: OpenAI (next), Mistral; Anthropic likely needs proxy.
- Multi-model fan-out: parallel runs, per-model abort, side-by-side compare.
- Export/import conversations (JSON); model presets.
- Developer mode: raw SSE/debug panel; timing/latency stats.
- Token estimates & cost badges; controlled concurrency.
- PWA shell for offline/installation.
- /settings route; a11y tests for focus trap.

## Questions for User

- Which providers/models first after OpenRouter + Gemini? (OpenAI, Mistral)
- Default for “Show reasoning” (ON or OFF) for reasoning models?
- Preferred auto-lock behavior (timeout length, default on/off)?
