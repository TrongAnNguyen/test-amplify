# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router entrypoints (`layout.tsx`, `page.tsx`), route segments, and global styles in `globals.css`.
- `components/`: reusable UI and feature modules (notably `BudgetExplorer.tsx`, `MapComponent.tsx`, `ExplorerShell.tsx`).
- `public/`: static assets served at root paths (`/next.svg`, `/vercel.svg`, etc.).
- Root config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.

## Build, Test, and Development Commands

- `yarn dev`: starts local dev server at `http://localhost:3000`.
- `yarn build`: creates production build.
- `yarn start`: serves production build locally.
- `yarn lint`: runs ESLint checks.

## Coding Style & Naming Conventions

- Language: TypeScript + React function components.
- Indentation: 2 spaces; keep imports grouped and remove unused symbols.
- Components: `PascalCase` filenames and exports (example: `MapComponent.tsx`).
- Route files: Next.js conventions (`page.tsx`, `layout.tsx`).
- Styling: update `app/globals.css` for shared styles; keep component-local styling close to feature code.
- Tailwind classnames: write mobile-first utilities and add responsive variants (`sm:`, `md:`, `lg:`) progressively.
- Tailwind classnames: prefer semantic tokens and scale utilities (`bg-background`, `text-foreground`, spacing/size scale) over raw values.
- Tailwind classnames: use arbitrary values only when no token or standard utility can express the style.
- Linting: use `eslint` via `yarn lint`; fix warnings before opening a PR.

## Testing Guidelines

- No test framework is configured yet in this repository.
- Minimum pre-PR quality gate: `yarn lint` and a local smoke test in `yarn dev`.
- When adding tests, colocate as `*.test.ts(x)` near the module or under a `__tests__/` folder.

## Commit & Pull Request Guidelines

- Commit history favors short, imperative summaries.
- Prefer format: `<scope>: <imperative summary>` (example: `map: reduce label collisions`).
- Keep commits focused and atomic; avoid mixing refactors with behavior changes.
- PRs should include:
  - Clear problem/solution description.
  - Linked issue or task ID.
  - Screenshots/GIFs for UI changes.
  - Verification steps and commands run.

## Agent-Specific Notes

This project uses Next.js 16. Before changing framework behavior, check docs in `node_modules/next/dist/docs/` and follow current deprecation guidance.
