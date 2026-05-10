# Repository Guidelines

See also: `CLAUDE.md` (AI coding guide) and `README.md` (project overview).

## Project Structure & Module Organization
Vite + Vue 3 + TypeScript admin frontend for library management.
- `src/pages/`: shell pages (`Login.vue`, `Home.vue`, `Me.vue`).
- `src/views/`: domain screens — `Index` (public book browsing + shelf map), system modules (`SysUser`, `SysRole`, `SysMenu`, `SysDept`), library modules (`LibStock`, `LibBorrow`, `LibCategory`, `LibPublish`, `LibShelfMap`), and `error/404`.
- `src/components/`: reusable UI pieces and feature dialogs, grouped by domain (`library/borrow/`, `library/stock/`, `library/publish/`, `dashboard/`, `me/`, `system/user/`, `system/role/`) + top-level components (`AISidebar`, `Logo`, `ActionGroup`, `SelectTreeMenu`, `WarningModal`) + `lib/MapCanvas.vue` (SVG canvas for shelf map).
- `src/composables/`: view logic extracted into composables, mirroring the views structure (`system/user/`, `system/role/`, `system/menu/`, `library/stock/`, `library/borrow/`, `library/publish/`, `dashboard/`, `auth/`). Views are thin; business logic lives here. + `useSvgDrag.ts` (document-level drag/rotate for SVG canvas).
- `src/api/`: API clients by domain (`system/`, `library/`, `dashboard-api.ts`, `file-api.ts`, `public-book-api.ts`, `library-map-api.ts`). `file-api.ts` provides `resolveUrl`, `uploadFile`, `getRefCount`, `deletePhysical` (requires `sys:file:del`), `download`.
- `src/utils/`: shared utilities including `svg-coords.ts` (screen-to-SVG coordinate mapping, viewBox clamping, outline JSON parsing).
- `src/store/modules/`: Pinia stores (`auth-store`, `user-store`, `permission-store`).
- `src/router/`, `src/plugins/`, `src/utils/`, `src/enums/`, `src/types/`, `src/constants/`: routing, app plugins, shared utilities, enums, global types, and shared constants.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: start local dev server (Vite, port from `VITE_APP_PORT`).
- `pnpm build`: run type-check (`vue-tsc -b`) then production build.
- `pnpm preview`: preview the built app locally.
- `pnpm typecheck`: type-check only (`vue-tsc -b --pretty false`).
- `pnpm lint` / `pnpm lint:fix`: ESLint check / auto-fix.
- `pnpm format` / `pnpm format:check`: Prettier write / check.

No unit test framework is configured. Pre-commit gate: `pnpm typecheck && pnpm build`.

## Coding Style & Naming Conventions
- TypeScript + Vue SFC (`<script setup lang="ts">`) by default.
- Imports use alias `@/` for `src/*`. Type-only imports use `import type`.
- Naming:
  - Vue components & views: `PascalCase.vue`
  - API modules: `kebab-case` (e.g. `user-api.ts`)
  - Stores, composables, utilities: `camelCase` exports
- No `any`: prefer `unknown` + type narrowing. Only allowed at third-party boundaries with a Chinese comment.
- SFC structure (recommended order): imports → types → props/emits → state → computed → watch/lifecycle → handlers → API calls.
- Keep complex expressions out of templates (filter/map/reduce → `computed`).
- Every `catch` block must have an explicit action (toast, rollback, re-throw, or fallback). No bare `console.log` in production.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat(scope):`, `fix:`, `refactor(scope):`.
- Branch from `main`; do not commit directly to `main`.
- PRs should include: summary/motivation, impacted modules, verification steps, and screenshots for UI changes.

## Environment Configuration
- `.env.development` / `.env.production` for environment-specific values.
- `VITE_APP_API_URL`: backend API base URL (default `http://localhost:8080`).
- `VITE_APP_PORT`: dev server port (default `3000`).
- `VITE_APP_BRAND_TITLE` / `VITE_APP_BRAND_SUBTITLE`: brand name shown in sidebar logo, login page, and web page title.
- Never commit secrets; use `.env.*` files only for non-sensitive config. `.env` and `.env.*.local` are covered by `.gitignore`.
- After any code change, check whether `AGENTS.md`, `CLAUDE.md`, or `README.md` need updating.
