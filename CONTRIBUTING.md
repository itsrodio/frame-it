# Contributing to FrameIt

Thank you for your interest in contributing to **FrameIt**!

## Getting Started

### Prerequisites

- **Node.js** 24+
- **pnpm** 12+ (`corepack enable` or `npm install -g pnpm`)

### Local Setup

```bash
git clone https://github.com/itsrodio/frame-it.git
cd frame-it
pnpm install
```

### Development Commands

```bash
pnpm dev             # Start WXT dev server for Chrome (with HMR)
pnpm dev:firefox     # Start WXT dev server for Firefox
pnpm build           # Production build (.output/chrome-mv3)
pnpm build:firefox   # Production build for Firefox
pnpm build:safari    # Production build for Safari
pnpm compile         # TypeScript type check (tsc --noEmit)
pnpm check           # Biome lint and format check
pnpm check:write     # Auto-fix Biome lint and formatting issues
pnpm test:run        # Run Vitest unit tests
pnpm test:e2e        # Run Playwright E2E tests against built extension
```

To test the production build manually in Chrome:

1. Run `pnpm build`.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select `.output/chrome-mv3`.

## Pull Request Guidelines

1. **Branching**: Create a descriptive feature or fix branch from `main`.
2. **Conventional Commits**: Commit messages are validated by `commitlint` (via `lefthook` locally and in CI):
   - `feat: ...` — new features
   - `fix: ...` — bug fixes
   - `refactor: ...` — code restructuring without behavior changes
   - `test: ...` — adding or updating tests
   - `docs: ...` — documentation updates
   - `chore: ...` — tooling, dependencies, or maintenance
3. **Localization**: If you add or rename UI text, update all 9 locale files in `src/locales/` (`en`, `es`, `zh_CN`, `pt_BR`, `de`, `fr`, `ru`, `ja`, `ko`). The `i18n.test.tsx` test verifies key parity across all locales.
4. **Testing & Quality**: Ensure `pnpm check`, `pnpm compile`, `pnpm test:run`, and `pnpm build` pass before opening a PR.

## Reporting Bugs & Requesting Features

Please use the [GitHub Issue templates](https://github.com/itsrodio/frame-it/issues/new/choose) when filing bug reports or feature requests.
