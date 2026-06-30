# Repository Guidelines

## Project Structure & Module Organization

- `amplify/`: AWS Amplify Gen 2 backend infrastructure as code, including auth configurations (`auth/resource.ts`) and data schema definitions (`data/resource.ts`).
- `app/`: Next.js App Router entrypoints (`layout.tsx`, `page.tsx`), global styles in `globals.css`, and functional page segments (e.g. `/admin`, `/login`, `/sign-up`, `/welcome`, `/budget-explorer`).
- `components/`: Reusable UI and feature modules:
  - `auth/`: Multi-phase login/signup components and animated backgrounds.
  - `admin/`: Uploader forms (`BudgetUploader.tsx`, `EmployeeUploader.tsx`).
  - Root components: `BudgetExplorer.tsx`, `ExplorerShell.tsx`, `MapComponentV2.tsx`, `QueryProvider.tsx`, `AmplifyConfig.tsx`.
- `public/`: Static assets served at root paths (`/next.svg`, `/vercel.svg`, etc.).
- Root configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.

## Build, Test, and Development Commands

- `yarn dev`: Starts local dev server at `http://localhost:3000`.
- `npx ampx sandbox`: Starts the local development sandbox for AWS Amplify Gen 2 backend resources.
- `yarn build`: Creates Next.js production build.
- `yarn start`: Serves production build locally.
- `yarn lint`: Runs ESLint checks.
- `yarn format`: Formats source files using Prettier.

## Coding Style & Naming Conventions

- **Language**: TypeScript + React function components.
- **Indentation**: 2 spaces; keep imports grouped and remove unused symbols.
- **Components**: Use `PascalCase` filenames and exports (example: `MapComponentV2.tsx`).
- **Route files**: Next.js App Router conventions (`page.tsx`, `layout.tsx`).

### Styling & Tailwind CSS v4 Guidelines

- **No `tailwind.config.js`**: Tailwind CSS v4 is configured entirely inside [app/globals.css](file:///Users/annguyen/Documents/tribal/repo/omnicom-network/app/globals.css) via `@import 'tailwindcss'` and `@theme inline`. Do not look for or create a Tailwind config file.
- **Design Tokens**: Standard design tokens (e.g., `bg-background`, `text-foreground`, `bg-card`, `--profit`, `--loss`, `--center-node`) are mapped to CSS variables in `app/globals.css`. Prefer semantic token classes over raw color values.
- **Tailwind classnames**: Write mobile-first utilities and add responsive variants (`sm:`, `md:`, `lg:`) progressively. Use arbitrary values only when no token or standard utility can express the style.
- **Component-local styles**: Keep component styling close to feature code, updating `app/globals.css` only for shared, global rules or core theme definitions.

### AWS Amplify Gen 2 Guidelines

- **Schema Updates**: Modify Data models in `amplify/data/resource.ts` and Auth definitions in `amplify/auth/resource.ts`. Ensure schema typescript types are exported via `Schema`.
- **Validation**: Proactively verify schema changes compile successfully by ensuring `npx ampx sandbox` validation runs without error.

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
