# Design & UI Guidelines

This document consolidates UX, UI, and visual design guidelines for io-ai, focusing on clarity, usability, and a consistent look-and-feel across light/dark modes.

## UI Guidelines

- Modern, clean, and responsive; keyboard-accessible controls.
- Light/dark toggle; respect system preference in "system" mode.
- Chat composer supports Enter to send (Shift+Enter for newline).
- Assistant messages render markdown with code block syntax highlighting.
- Streaming shows progressive text and a Stop button.
- Provider-aware affordances (e.g., disabled Send when a required key is missing).
- Settings panel (gear icon) provides Secrets and preferences.
- Future: multi-model fan-out shows side-by-side results with stop/retry per model.

## Design System & Visual Guidelines

Principles
- Clarity first: readable type, strong contrast, minimal chrome.
- Predictable: consistent spacing, sizes, and states across components.
- Calm motion: subtle transitions on hover/focus; no distracting animations.
- Accessible: WCAG AA contrast; focus visible; ARIA where needed.

Layout & spacing
- Content width: chat container max-w-4xl; generous gutters on mobile.
- Spacing scale: Tailwind spacing with 4px base; prefer 4/8/12/16 steps.
- Sections: use 16–24px separation between major blocks; 8–12px within.

Typography
- System font stack; 14–16px base for body; 12–13px for meta text.
- Headings are weight-driven (semibold/bold) vs. oversized.
- Code blocks mono font via highlight plugin; wrap long lines.

Color & theming
- Use CSS variables for surfaces, text, border, primary, and ring.
- Light: neutral surfaces, blue primary. Dark: deep neutrals, same primary.
- Keep fixed alpha shadows; avoid theme-dependent shadow colors.

Elevation & surfaces
- Cards: subtle border + low-elevation shadow; rounded corners.
- Popovers/menus: slightly higher elevation.

States
- Hover: +2–4% lightness shift or subtle bg tint.
- Focus: 2px ring using primary color; always visible on keyboard focus.
- Disabled: reduce opacity and disable pointer.
- Danger: red; Warning/Info use semantic hues, but use sparingly.

Components (class contracts)
- .card: padded container with border and background surface.
- .input, .select, .textarea: neutral bg/text, border, rounded, ring on focus.
- .btn: neutral button; .btn-primary, .btn-danger for emphasis; .icon-btn for small icon actions.
- Provider select uses Headless UI Listbox styled with input/menu classes.
- .badge: small label for metadata.

Accessibility
- Minimum target size 40x40px for touch; adequate spacing for grouped controls.
- aria-labels for icon-only buttons; correct roles for interactive elements.

Motion
- Use transition-colors, transition-shadow for hover/focus; 150–200ms ease-out.

Responsive
- Mobile first; ensure composer and message list are comfortable on small screens.

Documentation
- Update this file when tokens or component classes change.

Change process
- Any change to tokens, components, or patterns must be reflected here and in the code (src/index.css, Tailwind, and components). Add a brief rationale in docs/memory.md under "Design decisions".
