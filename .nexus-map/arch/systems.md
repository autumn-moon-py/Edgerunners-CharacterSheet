> generated_by: nexus-mapper v2
> verified_at: 2026-04-22
> provenance: AST-backed directory coverage for JavaScript/TypeScript/TSX, with manual system boundary inference from entry files and store APIs. No git metadata was available.

# 系统边界

## 1. 应用壳层与页面编排

- 主代码位置：`app/layout.tsx`、`app/page.tsx`、`components/layout/`、`components/modals/`、`components/ui/`
- 职责：装配主题、全局通知、打印辅助、卡牌系统初始化、页面注册、标签页和底部工具栏。
- 关键证据：
  - `app/layout.tsx` 在根布局中挂载 `ThemeProvider`、`CardSystemInitializer`、`PrintHelper`、Toaster、统一进度弹窗和 chunk 加载错误处理。
  - `app/page.tsx` 顶部通过 `registerPages()` 注册主页面、游侠伙伴页、护甲模板页、冒险笔记页和卡牌打印页。
- 依赖关系：向下编排 `角色工作台` 与 `卡包编辑/管理工具`，本身不承载业务规则。

## 2. 角色工作台

- 主代码位置：`app/page.tsx`、`components/character-sheet*.tsx`、`components/character-sheet-sections/`、`components/notebook/`、`lib/sheet-store.ts`、`lib/sheet-data.ts`、`hooks/use-character-management.ts`、`hooks/use-export-handlers.ts`
- 职责：维护角色卡主视图、角色多页打印、卡槽编辑、文字模式、双页模式、悬浮笔记本、角色存档切换与导出动作。
- 关键证据：
  - `app/page.tsx` 同时连接 `useSheetStore`、`usePinnedCardsStore`、`useTextModeStore`、`useDualPageStore`、`useCharacterManagement()` 和 `useExportHandlers()`。
  - `lib/sheet-store.ts` 为 `SheetData` 提供大量集中式更新方法，包括属性、等级、卡牌、护甲模板和升级快照回滚。
  - `lib/sheet-data.ts` 定义了角色、伙伴、冒险笔记、护甲模板、笔记本等完整数据模型。
- 依赖关系：依赖 `统一卡牌运行时` 提供标准卡牌和卡槽数据，依赖 `浏览器数据与互操作` 提供存档和导出能力。

## 3. 统一卡牌运行时

- 主代码位置：`card/`、`card/stores/`、`data/cards/builtin-base.json`
- 职责：把内置卡牌与自定义卡牌统一转换为 `StandardCard` / `ExtendedStandardCard`，维护批次、索引、聚合字段、图片缓存和启停状态。
- 关键证据：
  - `card/index.ts` 将所有对外 API 转发到 `index-unified.ts`，明确采用统一实现。
  - `card/index-unified.ts` 对外暴露按类型/ID 查询、卡包导入、批次统计、批次禁用和 `.dhcb` 导入能力。
  - `card/stores/store-actions.ts` 在 `initializeSystem()` 中播种内置卡牌、重建索引、预处理图片并初始化图片服务。
  - `card/utils/dhcb-importer.ts` 说明 `.dhcb` 实际是 `cards.json + images/` 的 ZIP 包，并带图片孤儿校验与回滚机制。
- 依赖关系：被 `角色工作台` 和 `卡包编辑/管理工具` 共同依赖；底层使用 localStorage 和 IndexedDB 保存批次与图片。

## 4. 卡包编辑与管理工具

- 主代码位置：`app/card-editor/`、`components/card-editor/`、`app/card-manager/page.tsx`
- 职责：可视化编辑卡包、生成或迁移卡牌 ID、校验原始卡牌结构、预览卡牌、导入 JSON/DHCB/ZIP、查看批次并执行启停或删除。
- 关键证据：
  - `app/card-editor/page.tsx` 通过 `useCardEditorStore()` 拉起元数据编辑、卡牌增删、预定义字段管理、验证结果跳转和预览弹窗。
  - `app/card-editor/store/card-editor-store.ts` 负责种族双卡、子职业三卡、ID 重建、图片键迁移和持久化。
  - `app/card-editor/services/validation-service.ts` 将卡包校验包装为编辑器友好的结果结构，并补了种族配对校验。
  - `app/card-manager/page.tsx` 支持拖拽多文件导入、批次启停、批次删除、清空全部自定义卡牌和危险级别的本地数据重置。
- 依赖关系：高度依赖 `统一卡牌运行时`；管理页同时也是图片和批次状态的运维控制台。

## 5. 浏览器数据与互操作

- 主代码位置：`lib/multi-character-storage.ts`、`lib/storage.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`、`lib/memory-monitor.ts`
- 职责：处理多角色 localStorage 存档、旧键迁移、JSON/HTML 导入导出、打印后 HTML 封装，以及浏览器端内存采样和诊断报告。
- 关键证据：
  - `lib/multi-character-storage.ts` 定义了 `dh_character_list`、`dh_character_*` 和活动角色键，并实现旧单角色数据迁移与僵尸数据清理。
  - `lib/storage.ts` 保留旧的单角色键，同时提供多角色兼容 JSON 导入导出。
  - `lib/html-exporter.ts` 从打印页面提取 DOM，内嵌样式并写入 `window.characterData`。
  - `lib/html-importer.ts` 通过正则提取 HTML 里的 `window.characterData`，再交给通用验证器。
  - `lib/memory-monitor.ts` 采样堆内存、DOM 节点和 blob URL 数量，并导出诊断报告。
- 依赖关系：为 `角色工作台` 提供持久化和导出链路；导出文件名和卡牌引用又反向调用 `统一卡牌运行时`。

## 系统外但重要的支撑面

- `tests/unit/`：覆盖一批业务性单元测试，但没有看到实际集成测试目录。
- `scripts/`：图片优化和 CSS 提取等构建辅助脚本。
- `docs/`：若后续任务涉及升级交互、内存诊断或批量过滤方案，应把这里当作补充证据，而不是实现真相本身。
