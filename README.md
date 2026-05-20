# 图书管理系统 · 管理端前端

Vite + Vue 3 + TypeScript 构建的图书馆管理后台，支持图书、借阅、预约、分类、出版社、库存管理，以及系统用户/角色/菜单权限配置，并集成 AI 阅读助手。

## 技术栈

| 分类 | 技术 |
|---|---|
| 构建 | Vite 8 |
| UI 框架 | Vue 3 + TypeScript (`<script setup>`) |
| 组件库 | @nuxt/ui 4.7（主）/ element-plus（辅） |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Pinia + pinia-plugin-persistedstate |
| 路由 | vue-router 5（Hash 模式） |
| HTTP | axios + qs |
| 图表 | echarts |
| AI 对话 | ai + markstream-vue + stream-markdown + stream-monaco |
| 数学/图表渲染 | katex + mermaid + @terrastruct/d2 |
| 表格 | @tanstack/vue-table |
| 表单验证 | valibot |
| 日期处理 | @internationalized/date |
| 工具库 | @vueuse/core |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:3000）
pnpm dev

# 类型检查
pnpm typecheck

# 生产构建（含类型检查）
pnpm build

# 预览构建产物
pnpm preview

# 代码检查与格式化
pnpm lint
pnpm format
```

## 环境配置

复制 `.env.development` 并按需修改：

```ini
VITE_APP_PORT=3000                           # 开发服务器端口
VITE_APP_TITLE=system-management-admin       # 网页标题
VITE_APP_BRAND_TITLE=校园图书馆              # 品牌名称（侧栏、登录页、网页标题）
VITE_APP_BRAND_SUBTITLE=Campus Library       # 品牌副标题
VITE_APP_API_URL=http://localhost:8080       # 后端接口地址
# VITE_APP_WS_ENDPOINT=ws://localhost:8080/ws  # WebSocket 端点（可选）
# VITE_MOCK_DEV_SERVER=false                 # Mock 服务开关（可选）
```

生产环境在 `.env.production` 中配置同名变量。

## 项目结构

```
src/
├── pages/          # 页面骨架：Login、Home（主布局含侧边栏）、Me
├── views/          # 业务视图：Index（首页公共图书浏览）、Dashboard、SysUser/Role/Menu/Dept、LibStock/Borrow/Reservation/Category/Publish、error/404
├── components/     # 可复用组件，按业务分组（library/、dashboard/、me/、system/）
├── composables/    # 视图逻辑拆分，与 views 结构对应（system/user/、library/borrow/、library/reservation/ 等）
├── constants/      # 共享常量（file-constants.ts）
├── api/            # 接口客户端，按域划分（system/、library/、dashboard-api.ts、public-book-api.ts、file-api.ts）
├── store/modules/  # auth-store（token）、user-store（用户信息）、permission-store（动态路由）
├── router/         # 静态路由定义，动态路由由 permission-store 从后端生成
├── plugins/        # 应用插件：permission.ts（全局导航守卫）
├── enums/          # 枚举：API 状态码、菜单类型、借阅状态、预约状态、系统状态
├── types/          # 全局类型声明：request.ts、common.ts、global.d.ts
└── utils/          # 基础设施：request.ts、auth.ts、date-format.ts、Chat.ts、option-items.ts
```

## 核心机制

### 认证与动态路由

1. `auth-store` 将 `accessToken` 持久化到 `localStorage`。
2. 全局导航守卫（`src/plugins/permission.ts`）在每次导航前检查登录状态。
3. 首次进入已认证路由时，`permission-store` 从后端拉取当前用户菜单树，转换为 `RouteRecordRaw[]` 并通过 `router.addRoute()` 动态注册。
4. 视图组件通过 `import.meta.glob('../../views/**/**.vue')` 按路径懒加载，找不到时回退 404。

### HTTP 请求层

`src/utils/request.ts` 统一处理：
- 请求拦截：自动注入 `Bearer` token；`FormData` 请求自动去除 `Content-Type`。
- 响应解包：成功时直接返回 `data` 字段；业务错误自动弹 toast。
- 401 / Token 过期：自动刷新 token 并重试（可在 `src/settings.ts` 中关闭）。
- 特殊响应类型（`blob` / `arraybuffer`）原样返回 `AxiosResponse`，用于文件下载。

跳过鉴权的请求设置 `headers: { Authorization: 'no-auth' }` 即可。

### 视图与 Composable 分离

视图文件只做编排，所有状态与业务逻辑拆到 `src/composables/` 对应目录下，每个 composable 单一职责（query / form / dialog / actions / submit）。新增视图时遵循相同模式。

### 书架地图 (Shelf Map)

`src/views/LibShelfMap.vue` 提供楼层轮廓绘制与书架位置管理功能：

- **SVG 画布**（`src/components/lib/MapCanvas.vue`）：1000×640 逻辑空间，支持动态缩放（鼠标中心缩放 0.3x–3x）、中键平移、轮廓点绘制/拖拽、书架拖拽移动、旋转手柄、Alt+拖拽复制书架
- **拖拽交互**（`src/composables/useSvgDrag.ts`）：文档级 mousemove/mouseup 监听，`getScreenCTM().inverse()` 精确坐标映射，智能参考线对齐（6px 阈值）、Shift 网格吸附（20px）、Shift 旋转吸附（15°步进）、中键平移
- **缩放平移**（`src/composables/useSvgZoom.ts`）：鼠标中心缩放，viewBox 动态计算，自动适配楼层边界
- **撤销重做**（`src/composables/useUndoRedo.ts`）：20 步操作历史栈，支持 Ctrl+Z/Ctrl+Shift+Z，覆盖移动、旋转、新增、删除
- **小地图**（`src/components/lib/MapMinimap.vue`）：左下角 140×100 缩略图，蓝色视口框可拖拽导航，书架热力着色，可折叠
- **悬浮提示**（`src/components/lib/ShelfTooltip.vue`）：悬停 300ms 弹出书架编号与容量占用
- **热力着色**：按容量使用率着色（绿 <50% / 黄 50–80% / 红 >80% / 灰 停用）
- **楼层背景图**：支持上传 PNG/JPG 平面图作为画布背景
- **坐标工具**（`src/utils/svg-coords.ts`）：纯函数，屏幕-SVG 坐标转换、viewBox 裁剪、轮廓 JSON 解析（兼容新旧格式）
- **API**（`src/api/library-map-api.ts`）：楼层/书架 CRUD、公开地图接口
- **公开地图**：`src/views/Index.vue` 中共享同一 MapCanvas（readonly 模式），支持缩放平移、热力着色、Tooltip、小地图，点击书架查看图书列表
- **键盘快捷键**：Delete 删除 / Escape 取消 / Ctrl+Z 撤销 / Ctrl+Shift+Z 重做 / Ctrl+S 保存
- **保存策略**：批量保存全部书架位置，避免逐条保存

## 文档

- `docs/前端代码规范标准.md` — 命名、类型、组件、API、样式等完整规范
- `CLAUDE.md` — AI 编码助手指引（Claude Code）
- `AGENTS.md` — 仓库规范与协作指引
- `README.md`（本文件） — 项目概览与快速开始
