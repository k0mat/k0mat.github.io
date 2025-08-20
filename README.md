# io-ai (SPA scaffold)

React + Vite + TypeScript starter for a browser-only multi-LLM chat app (to be hosted on GitHub Pages). Includes Tailwind, Zustand, streaming scaffolding, tests, and Pages deployment workflow.

Tech stack
- React 18, Vite 5, TypeScript
- Tailwind CSS
- Zustand (state)
- react-markdown + remark-gfm + rehype-highlight
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

GitHub Pages deployment
- This repo includes .github/workflows/deploy.yml which builds and deploys on pushes to main.
- The workflow auto-sets VITE_BASE:
  - For username.github.io repos: "/"
  - For project pages: "/<repo-name>/"
- After your first push to main, enable Pages: Settings → Pages → Source: GitHub Actions.

Notes
- A public/404.html SPA fallback is provided for client-side routing on Pages.
- The current app uses a demo Echo provider; real provider adapters (OpenAI, OpenRouter, Gemini, etc.) will be added next.
- Security: in a browser-only setup, any API keys live in localStorage and are visible to the local user. This is OK for personal use; don’t use shared secrets here.

Project structure
- src/App.tsx: minimal chat UI using an echo streaming provider
- src/providers/*: provider contracts and a demo echo provider
- src/store/*: Zustand app store
- public/404.html: SPA fallback for Pages

License
- MIT (add your own if needed)

