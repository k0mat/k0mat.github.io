# io-ai (SPA scaffold)

React + Vite + TypeScript starter for a browser-only multi-LLM chat app (to be hosted on GitHub Pages). Includes Tailwind, Zustand, streaming scaffolding, tests, and Pages deployment workflow.

Tech stack
- React 18, Vite 5, TypeScript
- Tailwind CSS
- Zustand (state)
- react-markdown + remark-gfm + rehype-highlight (+ rehype-sanitize)
- Vitest + Testing Library

Getting started
```bash
# install
npm install

# dev
npm run dev
# then open http://localhost:5173

# typecheck
npm run typecheck

# test
npm test

# build
npm run build

# preview production build
npm run preview
```

New chat quick-start for the agent (context reset helper)
- What this is: a frontend-only SPA for multi-LLM chat; BYO API keys stored locally; deployed on GitHub Pages.
- Core files to skim first:
  - .github/copilot-instructions.md (project overview and contracts)
  - docs/memory.md (active work, recent changes, and decisions)
  - docs/design.md (visual tokens and UI guidelines)
  - src/App.tsx (chat UI, streaming, auto-scroll, typing indicator)
  - src/store/* (Zustand stores: app, chats, models, secrets)
  - src/providers/* (OpenRouter + Gemini adapters now; OpenAI next)
- Current behavior highlights:
  - Streaming chat with async-iterable adapters; per-tab sessions persisted.
  - Markdown is sanitized (rehype-sanitize) and compact, with code highlighting.
  - Assistant bubble has subtle border/shadow for contrast in both themes.
  - Auto-scroll setting (Settings → Chat) follows streaming when near bottom; on-send scrolls down.
  - Tab titles can auto-update via model on Fibonacci counts of user messages.
- Don’ts and conventions:
  - No server; no encryption-at-rest; secrets persist plaintext in localStorage.
  - Keep CSP-friendly; no unsafe eval. Prefer small, focused changes + tests.
  - Follow provider adapter contract in src/providers/adapters.ts.
- What’s next:
  - Implement OpenAI provider; then multi-model fan-out UI with per-model abort.
- Quick checks: `npm run typecheck && npm test` (or `npm run typecheck; npm test` for Windows and PowerShell) should be green before committing.

GitHub Pages deployment
- This repo includes .github/workflows/deploy.yml which builds and deploys on pushes to main.
- The workflow auto-sets VITE_BASE:
  - For username.github.io repos: "/"
  - For project pages: "/<repo-name>/"
- After your first push to main, enable Pages: Settings → Pages → Source: GitHub Actions.

Notes
- A public/404.html SPA fallback is provided for client-side routing on Pages.
- Providers included: Gemini (REST) and OpenRouter (SSE); keys are BYO and stored locally in the browser.
- Security: in a browser-only setup, API keys live in localStorage and are visible to the local user. OK for personal use; don’t use shared secrets here.

Project structure
- src/App.tsx: chat UI, streaming loop, typing indicator, auto-scroll, tab naming
- src/providers/*: provider contracts and adapters (gemini, openrouter); validate helpers
- src/store/*: Zustand stores (app, chats, models, secrets) with persistence
- src/index.css: tokens, component classes, markdown styles, and theming
- public/404.html: SPA fallback for Pages

License
- MIT (add your own if needed)
