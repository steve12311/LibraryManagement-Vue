# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + Vue 3 + TypeScript admin frontend.
- `src/pages/`: top-level pages (`Login.vue`, `Home.vue`, `Me.vue`).
- `src/views/`: domain screens (system and library modules such as `SysUser.vue`, `LibStock.vue`).
- `src/components/`: reusable UI pieces and feature dialogs.
- `src/api/`: API clients by domain (`system/`, `library/`, `file-api.ts`), plus `openapi.json`.
- `src/store/`, `src/router/`, `src/plugins/`, `src/utils/`: state, routing, app plugins, and shared utilities.
- `public/`: static assets; `dist/`: build output (do not edit manually).

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: start local dev server (Vite).
- `pnpm build`: run type-check (`vue-tsc -b`) and production build.
- `pnpm preview`: preview the built app locally.
- `pnpm exec vue-tsc -b --pretty false`: fast CI-style type validation.

## Coding Style & Naming Conventions
- Use TypeScript and Vue SFC (`<script setup lang="ts">`) by default.
- Follow existing file-local style: Vue view files are mostly 2-space indented; API modules commonly use semicolons.
- Keep imports using alias `@/` for `src/*`.
- Naming:
  - Vue components and view files: `PascalCase.vue`
  - API modules: `kebab-case` with `-api.ts`
  - Stores/utilities: descriptive `kebab-case` or `camelCase` exports
- Keep changes focused; avoid unrelated formatting churn.

## Testing Guidelines
There is currently no dedicated unit test framework configured.
- Minimum gate before commit: `pnpm exec vue-tsc -b --pretty false` and `pnpm build`.
- For UI/API changes, run `pnpm dev` and verify key flows manually (login, list pagination, CRUD dialogs).
- If you add complex business logic, prefer introducing tests with clear `*.spec.ts` naming.

## Commit & Pull Request Guidelines
- Use Conventional Commit style seen in history: `feat(scope): ...`, `fix: ...`, `refactor(scope): ...`.
- Keep commits atomic and scoped to one change set.
- Branch workflow: create a feature/refactor branch from `main`; do not commit directly to `main`.
- PRs should include:
  - concise summary and motivation,
  - impacted modules/files,
  - verification steps/commands,
  - screenshots or short recordings for UI updates.

## Security & Configuration Tips
- Keep environment-specific values in `.env.*`; never commit secrets.
- Use Vite dev proxy settings for backend routing; avoid hardcoding absolute API hosts in view logic.
