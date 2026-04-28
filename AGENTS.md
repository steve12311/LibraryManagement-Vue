# Repository Guidelines

## Project Structure & Module Organization
Vite + Vue 3 + TypeScript admin frontend for library management.
- `src/pages/`: shell pages (`Login.vue`, `Home.vue`, `Me.vue`).
- `src/views/`: domain screens — system modules (`SysUser`, `SysRole`, `SysMenu`, `SysDept`) and library modules (`LibStock`, `LibBorrow`, `LibCategory`, `LibPublish`).
- `src/components/`: reusable UI pieces and feature dialogs, grouped by domain.
- `src/composables/`: view logic extracted into composables, mirroring the views structure. Views are thin; business logic lives here.
- `src/api/`: API clients by domain (`system/`, `library/`, `file-api.ts`, `public-book-api.ts`).
- `src/store/modules/`: Pinia stores (`auth-store`, `user-store`, `permission-store`).
- `src/router/`, `src/plugins/`, `src/utils/`, `src/enums/`, `src/types/`: routing, app plugins, shared utilities, enums, and global types.

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
- Never commit secrets; use `.env.*` files only for non-sensitive config.
