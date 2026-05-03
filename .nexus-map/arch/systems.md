> generated_by: nexus-mapper v2
> verified_at: 2026-05-02
> provenance: AST-backed directory coverage for JavaScript/TypeScript/TSX, with boundary validation from `app/layout.tsx`, `app/page.tsx`, `app/m-sheet/page.tsx`, `components/mobile-sheet/mobile-home.tsx`, `card/index-unified.ts`, `card/stores/store-actions.ts`, `card/stores/builtin-package-storage.ts`, `app/card-editor/store/card-editor-store.ts`, `app/card-manager/page.tsx` and storage/export entry files.

# 系统边界

## 1. 应用壳层与入口编排

- 主代码位置：`app/layout.tsx`、`components/card-system-initializer.tsx`、`components/mobile-sheet/mobile-sheet-redirect.tsx`
- 职责：挂载主题、通知、统一进度弹窗、卡牌系统初始化、打印辅助和移动端入口重定向，为桌面主站、移动端主站、编辑器和管理页提供统一运行容器。
- 关键证据：
  - `app/layout.tsx` 直接挂载 `ThemeProvider`、`ProgressModalProvider`、`CardSystemInitializer`、`PrintHelper`、`MobileSheetRedirect`、`ChunkLoadErrorHandler` 和全局通知组件。
  - `components/card-system-initializer.tsx` 在客户端挂载后初始化统一卡牌 store，并把 store 暴露到 `window` 供调试使用。
  - `components/mobile-sheet/mobile-sheet-redirect.tsx` 会根据 UA 和视口宽度把首页流量重定向到 `/m-sheet`。
- 边界说明：这一层负责“装配与路由”，不直接承载角色或卡包业务规则。

## 2. 桌面角色工作台

- 主代码位置：`app/page.tsx`、`components/character-sheet*.tsx`、`components/character-sheet-sections/`、`components/layout/`、`hooks/use-character-management.ts`、`hooks/use-export-handlers.ts`、`lib/page-registry.ts`、`lib/sheet-store.ts`
- 职责：驱动桌面版角色编辑、多页显示、打印模式、钉住卡牌、角色切换和导出动作。
- 关键证据：
  - `app/page.tsx` 通过 `registerPages()` 注册第一页、第二页、冒险笔记页和卡牌打印页，并同时连接角色管理、导出和多种 UI store。
  - `hooks/use-character-management.ts` 负责首次迁移、加载角色列表、切换角色、复制、删除和快速新建。
  - `hooks/use-export-handlers.ts` 统一包装打印、HTML 导出、快速 PDF / HTML 导出。
  - `lib/sheet-store.ts` 是 `SheetData` 的主要写入口，现已同时承载 `favoriteDomainCardIds` 这类角色偏好字段。
- 依赖关系：依赖 `统一卡牌运行时` 提供卡牌语义，依赖 `存档、导出与互操作` 提供持久化和导出能力。

## 3. 移动端角色工作台

- 主代码位置：`app/m-sheet/page.tsx`、`components/mobile-sheet/mobile-home.tsx`、`components/mobile-sheet/*`、`components/print/mobile-print-page-renderer.tsx`
- 职责：提供手机专用角色入口、移动页签、移动版第二页拆分视图、移动打印预览、角色管理和快捷导出。
- 关键证据：
  - `app/m-sheet/page.tsx` 只是薄入口，直接挂载 `MobileHome`。
  - `components/mobile-sheet/mobile-home.tsx` 串联了移动页签、第二页子区块、角色管理、HTML 导入、打印预览与快捷导出。
  - `components/mobile-sheet/register-mobile-pages.ts` 复用同一套 `page-registry`，说明移动端不是新数据模型，而是同一角色数据的另一种呈现方式。
- 依赖关系：和桌面主站共享 `sheet-store`、角色管理 hook、导出 hook 与统一卡牌运行时，因此任何底层数据或导出变更都要考虑双入口回归。

## 4. 统一卡牌运行时

- 主代码位置：`card/index.ts`、`card/index-unified.ts`、`card/stores/unified-card-store.ts`、`card/stores/store-actions.ts`、`card/stores/image-service/`、`card/*/convert.ts`
- 职责：把内置卡牌与自定义卡牌统一转换为标准运行时结构，维护批次、索引、聚合字段、图片缓存和公开查询 API。
- 关键证据：
  - `card/index.ts` 直接 re-export `index-unified.ts`，说明统一实现已是正式入口。
  - `card/stores/unified-card-store.ts` 用 Zustand 建立统一 store，状态里包含 `cards`、`batches`、`cardsByType`、统计信息和图片服务。
  - `card/stores/store-actions.ts` 收束初始化、导入、删除、批次禁用、索引重建、图片预处理和 localStorage 同步。
  - `card/utils/dhcb-importer.ts` 表明 `.dhcb` / `.zip` 导入是“卡牌 + 图片”的事务型流程，并包含孤儿图片校验和失败回滚。
- 依赖关系：被桌面主站、移动端主站、卡包编辑器和卡包管理页共同依赖，是项目真正的共享业务底盘。

## 5. 卡包编辑器

- 主代码位置：`app/card-editor/page.tsx`、`app/card-editor/store/card-editor-store.ts`、`app/card-editor/services/validation-service.ts`、`app/card-editor/utils/`、`app/api/dev/builtin-package/route.ts`
- 职责：编辑卡包元数据和原始卡牌、生成与迁移卡牌 ID、管理编辑器图片、预览卡牌、校验包结构，并在本地开发模式下支持直写核心包源码。
- 关键证据：
  - `app/card-editor/page.tsx` 把工具栏、标签页、预览弹窗、卡牌列表和验证结果串成完整编辑工作流。
  - `app/card-editor/store/card-editor-store.ts` 管理 `packageData`、`editingSource`、图片缓存、校验状态，以及种族双卡和子职业三卡等编辑器规则。
  - `app/api/dev/builtin-package/route.ts` 仅允许本地开发环境请求直写内置卡包文件，说明“编辑核心包源码”是受限开发能力，不是线上功能。
- 边界说明：这一层操作的是“原始卡包载荷”，不是主站直接消费的标准卡牌对象，但最终仍会接入统一卡牌运行时。

## 6. 卡包管理页

- 主代码位置：`app/card-manager/page.tsx`、`card/utils/dhcb-importer.ts`
- 职责：导入 JSON / DHCB / ZIP、查看批次卡牌、启停批次、删除批次、清空全部自定义卡牌，并展示基础存储统计。
- 关键证据：
  - `app/card-manager/page.tsx` 直接调用 `importCustomCards()`、`importDhcbCardPackage()`、`toggleBatchDisabled()`、`removeCustomCardBatch()` 和 `clearAllCustomCards()`。
  - 管理页和编辑器都通过 `isCardManagerEnabled()` 受同一环境变量开关控制，说明这是发行版能力，而不是始终开放的页面。
- 依赖关系：高度依赖 `统一卡牌运行时`，并把它当成批次运维后台使用。

## 7. 存档、导出与互操作

- 主代码位置：`lib/multi-character-storage.ts`、`lib/sheet-data.ts`、`lib/default-sheet-data.ts`、`lib/sheet-data-migration.ts`、`lib/character-data-validator.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`
- 职责：维护角色主数据结构、多角色 localStorage 归档、历史数据迁移、HTML 导出、HTML 导入和通用数据校验。
- 关键证据：
  - `lib/multi-character-storage.ts` 使用 `dh_character_list`、`dh_character_<id>` 和活动角色键管理多角色归档，并在加载时自动迁移与回写。
  - `lib/sheet-data.ts` 定义完整 `SheetData`；当前已包含 `favoriteDomainCardIds`，说明收藏状态已成为正式角色档案字段。
  - `lib/character-data-validator.ts` 是 JSON / HTML 共用的验证入口，先清洗、再合并默认值、再跑迁移。
  - `lib/html-exporter.ts` 把当前打印页 HTML、CSS 和角色数据封装成独立文件；`lib/html-importer.ts` 先读 `<script id="dh-character-data">`，再回退兼容旧的 `window.characterData` 赋值格式。
- 依赖关系：服务桌面和移动端工作台，也反向依赖统一卡牌运行时来计算导出标题和卡牌 class。

## 8. 核心包覆盖与开发态直写

- 主代码位置：`card/stores/builtin-package-storage.ts`、`app/api/dev/builtin-package/route.ts`、`lib/dev-builtin-package-file.ts`
- 职责：在浏览器端维护核心包 override 的读取、保存、清理和迁移语义，并在本地开发模式下把编辑器里的核心包内容写回 `data/cards/builtin-base.json`。
- 关键证据：
  - `card/stores/builtin-package-storage.ts` 会优先读取 IndexedDB / localStorage 中的 override，没有 override 时再回落到默认 `builtin-base.json`，并在保存 / 清理后发出 `BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY`。
  - `app/api/dev/builtin-package/route.ts` 只接受本地开发来源请求，且先走 `sanitizeImportData()` 再写文件。
  - `lib/dev-builtin-package-file.ts` 负责把卡包 JSON 直接写回仓库内 `data/cards/builtin-base.json`。
- 依赖关系：被统一卡牌运行时用于加载内置核心包，被卡包编辑器用于本地开发态保存和刷新。

## 系统外但重要的支撑面

- `scripts/`：构建、图片优化、CSS 提取和本仓库定制的 `nexus_extract_ast_repo_languages.py` 等辅助脚本。
- `docs/`：设计和说明文档，不是业务真相源，但适合补充背景与计划。
- `配套骰子/`：独立的骰子脚本目录，和主 Web 应用不是一条运行链路，但明显属于同一产品生态。
