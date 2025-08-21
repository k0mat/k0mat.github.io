# Project Overview

io-ai is a frontend-only, browser-based SPA that lets users chat with multiple hosted LLMs by bringing their own API keys. It runs on GitHub Pages (no backend), streams responses, and will support multi-model fan-out (ask several models at once and compare answers side-by-side). All secrets and chat data live in the browser (local storage), with an option to encrypt secrets at rest using a user passphrase.

## Goals (v1)
- Single-page React app, build with Vite, TypeScript, and Tailwind.
- Providers: start with Gemini and OpenRouter; add OpenAI next.
- Streaming chat with markdown rendering and code highlighting.
- Key management UI; secrets persisted locally with optional passphrase encryption.
- GitHub Pages deployment with correct Vite base and SPA 404 fallback.

Non-goals (for now)
- No server-side components or shared secrets.
- No account system; personal/local usage only.
- No heavy plugin/tooling system yet.

---

# Architecture

- Frontend only
  - React 18 + Vite 5 + TypeScript (strict) for app shell and build.
  - Tailwind CSS for styling; light/dark theme toggle.
  - Zustand for state management (app, chats, secrets, models stores).
  - Streaming via fetch + ReadableStream; abort with AbortController.
  - Markdown rendering (react-markdown + remark-gfm + rehype-highlight).

- Provider adapters
  - Unified interface maps provider-specific request/stream formats to a common sendMessageStream(args) → AsyncIterable<string>.
  - OpenRouter for broad model routing; Gemini (Google) for direct Gemini models; additional providers will follow.

- Secrets
  - Stored in localStorage via a persisted Zustand store.
  - Optional encryption at rest using Web Crypto (AES-GCM + PBKDF2/SHA-256).
  - Passphrase held only in memory when unlocked.

- Deployment
  - GitHub Pages; Vite base set via env (VITE_BASE) in CI.
  - SPA fallback via public/404.html.

---

# Current Folder Structure

- /src
  - App.tsx: app shell, chat UI, settings panel trigger, streaming, per-tab sessions.
  - main.tsx, index.css: entry and global styles.
  - components/
    - ProviderSelect.tsx: accessible provider dropdown (Headless UI Listbox)
    - ModelFavoritesSelect.tsx: quick picker for saved models
    - settings/
      - SettingsPanel.tsx, SecretsSection.tsx, ChatPrefsSection.tsx, ModelsSection.tsx, ProviderKeyCard.tsx
  - providers/
    - adapters.ts: provider contracts + shared errors.
    - openrouter.ts: SSE streaming to OpenRouter chat completions.
    - gemini.ts: Google Gemini adapter (REST; simulated streaming in UI).
    - validate.ts: key validation helpers.
    - openrouter.test.ts: streaming/format tests.
    - echo.ts: legacy demo provider (not used anymore).
  - store/
    - appStore.ts: app-wide settings (theme, preferences).
    - secretsStore.ts: multi-provider keys + encryption state.
    - chatStore.ts: tabs, per-tab session state and messages.
    - modelsStore.ts: per-provider favorites + default model.
    - *.test.ts: unit tests for stores.
  - core/crypto.ts: AES-GCM + PBKDF2 helpers.
  - test/setup.ts: Vitest + jsdom setup and matchMedia polyfill.
- /public
  - 404.html: SPA fallback for GitHub Pages.
- vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js
- vitest.config.ts: jsdom, globals enabled.
- .github/workflows/deploy.yml: build and deploy to Pages.

---

# Libraries and Frameworks

- React 18, Vite 5, TypeScript 5
- Tailwind CSS
- Headless UI (@headlessui/react) for accessible Listbox (provider select)
- Zustand (state)
- react-markdown, remark-gfm, rehype-highlight
- Vitest + @testing-library/react + jsdom
- lucide-react, sonner

Planned providers (browser viability varies): OpenRouter (done), Gemini (done), OpenAI (next), Mistral. Others like Anthropic may require a proxy.

---

# Provider Adapter Contract

- sendMessageStream(args): AsyncIterable<string>
  - args: { model, messages, apiKey?, temperature?, maxTokens?, signal? }
  - messages: [{ role: 'system'|'user'|'assistant', content }]
  - Emits incremental content chunks; abortable via args.signal.
- Error mapping
  - ProviderAuthError (401), RateLimitError (429), CORSBlockedError, AbortError, Unknown.
- Capability flags per provider: browserSafe, supportsStreaming, supportsVision (future).

---

# Coding Standards

- TypeScript strict mode; avoid any; prefer explicit types in public APIs.
- React function components with hooks; no class components.
- Keep components small and focused; lift state only as needed.
- Use double quotes in TS/TSX; semicolons required.
- Prefer async iterators for streaming; always support AbortController.
- Storage keys are namespaced (e.g., io-ai:*); version persisted shapes when needed.
- No third-party scripts or unsafe eval; keep CSP-friendly code.

Lint/format
- Use consistent import order and file structure; prefer named exports.
- Prettier/ESLint can be added later; follow existing style in the meantime.

---

# UI & Design

The UI guidelines and the design system have moved to a dedicated document:
- See docs/design.md for UI Guidelines and Design System & Visual Guidelines.

Keep this file updated with links only; update docs/design.md when tokens, patterns, or component classes change.

---

# Security & Privacy

- BYO keys stored locally; optional passphrase encryption protects at rest but not against active XSS.
- Do not log secrets; avoid sending keys anywhere except directly to provider APIs from the browser.
- Some providers may block browser origins/CORS; mark those as "needs proxy" in the UI.
- Keep dependencies minimal; avoid risky, dynamic code execution.

---

# Testing

- Vitest + Testing Library; environment: jsdom; globals enabled.
- Test streaming UI with mocked adapters (OpenRouter SSE, Gemini REST).
- Polyfill matchMedia in test setup to avoid environment differences.
- Add tests when adding providers (auth errors, rate limits, abort behavior).

---

# Deployment (GitHub Pages)

- CI workflow builds with correct VITE_BASE:
  - username.github.io → "/"
  - project repos → "/<repo>/"
- SPA routing via public/404.html fallback.
- Artifacts are built to dist and deployed via actions/deploy-pages in a two-job workflow (build → upload artifact, then deploy with environment github-pages) on branch master.
- In repo Settings → Pages, set Source to "GitHub Actions" (not Branch) so Pages serves the built artifact, not the repo root.

---

# Roadmap (near-term)

1) Add OpenAI provider adapter.
2) Multi-model fan-out UI with controlled concurrency and per-model abort.
3) Export/import conversations (JSON) and presets.
4) Token usage estimates and latency/cost badges per run.
5) Optional PWA shell for offline and installability.

---

# Contribution & Conventions

- Keep PRs small and focused. Include unit tests for new features.
- Update README and this file when behavior or architecture changes in a meaningful way.
- Commit messages: conventional, imperative mood (e.g., feat: add OpenAI adapter).
- Prefer progressive enhancement.

---

# Project Memory (docs/memory.md)

Use docs/memory.md as a lightweight, living context log:
- Track active work: what’s in progress, status, next steps, and whether input is needed.
- Record decisions & rationale briefly when they affect behavior, architecture, or design system.
- Maintain ideas/backlog with rough priority and scope; move items to Active Work when started.
- List questions for the user and leave them until answered; update status when resolved.

Workflow
- Update docs/memory.md at the end of each meaningful change (code, tests, styles, or docs).
- Reference docs/memory.md in PR descriptions for historical context.
- When a major direction changes, update both docs/memory.md and this instructions file’s links.

---

# Update Policy (Important)

Whenever introducing a major change (new provider, storage shape change, build/deploy change, or significant UI/UX shift), update this document to reflect the new architecture, behavior, and guidance. Treat this file as the living source of truth for Copilot/context-aware tooling.

Maintainer note: If GitHub Pages stops serving the built app and instead serves /src/*, re-check Pages settings (Source must be GitHub Actions) and confirm the build+deploy workflow is green and publishing dist.
