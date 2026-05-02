# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server on port 3000 (set in .env.development)
pnpm build            # typecheck + production build
pnpm preview          # preview production build
pnpm typecheck        # vue-tsc type check only
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier write
pnpm format:check     # Prettier check
```

No unit test framework is configured. Pre-commit gate: `pnpm typecheck && pnpm build`.

## Architecture

### Tech Stack
Vite + Vue 3 + TypeScript SFC (`<script setup lang="ts">`). Styling via **Tailwind CSS 4**. UI components via **@nuxt/ui** (primary) and **element-plus** (supplementary). Form validation via **valibot** (bundled with Nuxt UI). Tables via **@tanstack/vue-table**. State via **Pinia** with `pinia-plugin-persistedstate`. Routing via **vue-router** (hash history). HTTP via **axios** (`src/utils/request.ts`). Charts via **echarts**. AI chat via `ai` + `markstream-vue`. Utility composables from **@vueuse/core**.

Nuxt UI components are auto-imported (no explicit imports needed). Nuxt UI color mode (light/dark) is enabled.

### Directory Layout

| Path | Purpose |
|---|---|
| `src/pages/` | Shell pages: `Login.vue`, `Home.vue` (app layout/sidebar), `Me.vue` |
| `src/views/` | Domain screens mounted as children of `Home.vue`: `Dashboard`, `SysUser`, `SysRole`, `SysMenu`, `SysDept`, `LibStock`, `LibBorrow`, `LibCategory`, `LibPublish` |
| `src/components/` | Reusable dialogs and UI pieces, grouped by domain (e.g. `library/stock/`, `dashboard/`, `me/`) |
| `src/composables/` | View logic extracted into composables, mirroring domain structure (`system/user/`, `library/stock/`, etc.) |
| `src/api/` | Axios API clients by domain: `system/`, `library/`, `dashboard-api.ts`, `file-api.ts`, `public-book-api.ts` |
| `src/store/modules/` | `auth-store.ts` (access token, persisted), `user-store.ts` (user info + roles), `permission-store.ts` (dynamic routes) |
| `src/router/` | Static routes (`constantRoutes`) + dynamic route generation from backend |
| `src/plugins/` | App plugin setup; `permission.ts` is the global navigation guard |
| `src/constants/` | Shared constants: `file-constants.ts` (file upload limits, accept types) |
| `src/enums/` | Typed enums: `api/code-enum.ts` (response codes), `system/menu-enum.ts`, `system/status-enum.ts` (status, gender, data scope, root role), `system/borrow-status-enum.ts` |
| `src/types/` | Global TypeScript types: `global.d.ts`, `request.ts`, `common.ts` (ModalEditMode, BorrowDateValue, CoverFileModel, CategoryTreeNode) |
| `src/utils/` | Infrastructure: `request.ts` (axios instance), `auth.ts` (login redirect), `date-format.ts`, `option-items.ts`, `EventManager.ts` (typed event bus), `Chat.ts`, chat-stream, borrow-status |

### Auth & Route Flow

1. `auth-store` persists `accessToken` in `localStorage`.
2. Navigation guard (`src/plugins/permission.ts`) checks login state on every navigation.
3. On first authenticated navigation, `permission-store.generateRoutes()` fetches the user's menu tree from the backend (`MenuAPI.getRoutes()`), transforms it into `RouteRecordRaw[]`, and adds them dynamically via `router.addRoute()`.
4. Backend route components are resolved by matching `../../views/<component>.vue` against Vite's `import.meta.glob`; unmatched paths fall back to `views/error/404.vue`.
5. `src/utils/request.ts` handles token injection, 401 → token refresh (via `useTokenRefresh`), and business error toasts centrally. Token refresh can be disabled in `src/settings.ts` (`authConfig.enableTokenRefresh`).

### View ↔ Composable Pattern

Views are thin: they import composables for all state and logic. For example, `SysUser.vue` uses composables from `src/composables/system/user/` (query, form, dialog, actions, submit). Each composable has a single responsibility. Keep this pattern when adding new views.

### API Response Contract

All API responses are expected to match `ApiResponse<T> { code, data, msg }`. The axios interceptor unwraps `data` on success or throws/toasts on business errors. Binary responses (`blob`/`arraybuffer`/`stream`) are returned as raw `AxiosResponse`.

### Request Generics Convention

The axios instance is typed as `request<Req, Res>(config)`. `Req` must never be `any`. For requests with no body, use `request<unknown, Res>`. Each API method's signature must make the input/output boundary clear from the types alone — no `as any` casts to bridge types.

### Build Chunking

`vite.config.ts` manually splits large dependencies into named chunks: `vue-core`, `nuxt-ui`, `element-plus`, `ai-runtime`, `ai-markdown`, `ai-diagram-heavy`, `dashboard-echarts`, `dashboard-zrender`. When adding heavy new deps, consider adding a chunk entry.

## Conventions

- `@/` alias maps to `src/`.
- Vue files: `PascalCase.vue`; API modules: `kebab-case-api.ts`; stores/composables: `camelCase` exports.
- Commits: Conventional Commits — `feat(scope):`, `fix:`, `refactor(scope):`.
- Environment config lives in `.env.*`; API base URL is `VITE_APP_API_URL` (default `http://localhost:8080`). Dev port is `VITE_APP_PORT` (default 3000).
- Brand name configurable via `VITE_APP_BRAND_TITLE` / `VITE_APP_BRAND_SUBTITLE` in `.env.*`. Used by `Logo.vue`, `Login.vue`, and page title.
- To skip auth on a specific request, set `headers: { Authorization: 'no-auth' }`.
- **No `any`**: default to `unknown` + type narrowing. Only allowed at third-party boundaries with a Chinese comment explaining why.
- **`import type`** is required for type-only imports.
- **SFC structure** (recommended order): imports → type declarations → props/emits/model → reactive state → computed → watch/lifecycle → event handlers → API calls.
- **Component size**: keep under 200 lines; business pages under 300 lines; over 500 lines is a must-split.
- **Template expressions**: no complex chains (filter/map/reduce, deep optional chaining) in templates — extract to `computed` or functions.
- **Error handling**: every `catch` must have an explicit action (user toast, state rollback, re-throw, or controlled fallback). No bare `console.log`/`console.error` in production code.
- **useToast** from Nuxt UI (`useToast().add({title, description, color})`) is the standard notification mechanism.
- **EventManager** (`src/utils/EventManager.ts`) provides a typed event bus for cross-component communication. Prefer `props`/`emit`/composables/Pinia first; use EventManager only when those don't fit.
- Reference `docs/前端代码规范标准.md` for the full coding standards; `docs/CodeReview-Checklist.md` for review checklist.
