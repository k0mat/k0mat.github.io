# Project Memory & Context

This file tracks active work, decisions, ideas, and questions that need input. Keep it short and current.

Memory rotation policy
- Keep Active Work to 3–5 items max (truly in progress).
- Keep a Recently Shipped list with the last 5 shipped items (with brief notes). Remove older entries.
- Decisions: list only those still relevant to current direction; prune stale ones.
- Revisit monthly or after major changes.

## Active Work (current)

1) Remove Echo demo provider
- Remove echo from providers list; update tests to mock OpenRouter adapter for streaming tests.
- Provide fallback copy to guide users to enter a key in Settings if none present.
- Success: no Echo code path; tests green with new mocks.

2) Settings: Models section per provider
- New section to manage visible models per provider and set defaults.
- For OpenRouter: allow listing favorite model IDs and picking a default.
- Success: per-provider model list stored locally and used by tab selector.

## Recently Shipped (last 5)

- Chat tabs system (MVP)
  - Add/close/switch tabs; persisted via Zustand; keyboard and mouse friendly; tests still green
- Provider/model controls per tab
  - Moved provider and model input from header to per-session controls; header simplified
- Settings button UX refresh
  - Header button switched to gear icon; amber warning state preserved when keys missing; tests green (3/3)
- UI polish (header and initial chat)
  - Removed top-bar “Show reasoning”; neutral initial chat; improved Settings close UX (X, Escape)
- Key validation (OpenRouter)
  - Validate button in Secrets; GET /api/v1/models; success/error surfaced; toasts added

## Decisions (current)

- Browser-only, BYO-keys (no backend) for personal use.
- OpenRouter first for widest model access.
- Tailwind + CSS variables for fast iteration and consistent theming.
- No initial system prompt to avoid biasing outputs.

## Ideas / Backlog

- Providers: OpenAI, Gemini (priority), Mistral; Anthropic likely needs proxy.
- Multi-model fan-out: parallel runs, per-model abort, side-by-side compare.
- Export/import conversations (JSON); model presets.
- Developer mode: raw SSE/debug panel; timing/latency stats.
- Token estimates & cost badges; controlled concurrency.
- PWA shell for offline/installation.
- /settings route; a11y tests for focus trap.

## Questions for User

- Which providers/models first after OpenRouter? (OpenAI, Gemini, Mistral)
- Default for “Show reasoning” (ON or OFF) for reasoning models?
- Preferred auto-lock behavior (timeout length, default on/off)?
