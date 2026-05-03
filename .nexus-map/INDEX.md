> generated_by: nexus-mapper v2
> verified_at: 2026-05-02
> provenance: AST-backed for JavaScript/TypeScript/TSX plus one local Python helper file. Current AST summary covers 209 source files and 44,842 lines, but 341 nodes were truncated. `query_graph.py` still did not recover trustworthy internal alias-import edges, so dependency conclusions below combine entry-file reading with manual validation. Git metadata exists, but only 2 commits from 1 author were available, so hotspot conclusions remain low confidence.

# Edgerunners-CharacterSheet

## 仓库快照

- 这是一个基于 Next.js 16、React 19、Zustand、Dexie 和 Tailwind 的前端优先 Web 应用，产品目标已经收敛到赛博朋克战役框架「边缘行者」角色工作台，而不是纯通用 DaggerHeart 展示站。
- 主要用户流程现在是 4 条：`/` 桌面角色工作台、`/m-sheet` 移动端角色工作台、`/card-editor` 卡包编辑器、`/card-manager` 卡包管理页。
- 核心状态仍分两套：`lib/sheet-store.ts` 管角色数据与页面状态，`card/stores/unified-card-store.ts` 管统一卡牌运行时。
- `SheetData` 已包含 `favoriteDomainCardIds`，说明“按角色保存领域卡收藏”已经成为正式角色数据的一部分，后续任何角色字段改动都要继续串查默认值、迁移、校验与导入导出链路。
- 当前没有自动化测试文件；`pnpm lint` 目前也不是可靠信号，因为脚本会报 `Invalid project directory provided`，静态校验仍需结合人工回归理解。

## 关键系统

- `应用壳层与入口编排`：`app/layout.tsx` 挂载主题、卡牌系统初始化、移动端重定向、打印辅助和全局通知。
- `桌面角色工作台`：`app/page.tsx` 负责桌面编辑、页签注册、导出、打印与角色切换。
- `移动端角色工作台`：`app/m-sheet/page.tsx` 与 `components/mobile-sheet/mobile-home.tsx` 负责手机入口、移动页签、移动打印预览和角色管理。
- `统一卡牌运行时`：`card/` 与 `card/stores/` 统一加载内置与自定义卡牌，维护批次、索引、图片和查询 API。
- `卡包编辑器 / 管理页`：`app/card-editor/` 与 `app/card-manager/` 共享同一套统一卡牌系统，但前者偏创作与校验，后者偏导入与批次运维。
- `存档、导出与互操作`：`lib/multi-character-storage.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`、`lib/character-data-validator.ts` 负责多角色归档、迁移、导出和导入。
- `核心包覆盖与开发态直写`：`card/stores/builtin-package-storage.ts`、`app/api/dev/builtin-package/route.ts`、`lib/dev-builtin-package-file.ts` 组成浏览器 override 与本地开发直写链路。

## 当前高风险区

- `app/page.tsx`：桌面主流程编排过于集中，角色管理、打印、导出、卡牌同步和 UI 状态都在这里汇合。
- `components/mobile-sheet/mobile-home.tsx`：移动端把页签、打印、导入、角色管理和卡牌同步都串在一处，且与桌面流程共享大量底层 hook。
- `lib/sheet-store.ts`：`SheetData` 的主写入口，字段和副作用很多，`favoriteDomainCardIds` 这类新增字段会直接扩散到多个链路。
- `card/stores/store-actions.ts`：统一卡牌系统的初始化、导入、批次删除、启停、索引重建和图片回滚全部在这里收束。
- `app/card-editor/store/card-editor-store.ts`：编辑器状态、卡牌 ID 重建、图片键迁移、校验和核心包保存逻辑高度耦合。
- `card/stores/builtin-package-storage.ts`：同时管理 IndexedDB、localStorage、浏览器存储迁移和跨标签刷新信号，是当前新增的一块脆弱互操作层。
- `lib/html-exporter.ts`：DOM 提取、样式内嵌、交互脚本注入和导出载荷拼装仍集中在单文件。
- `lib/multi-character-storage.ts`：加载即迁移并回写，兼容性变更影响面依旧很大。

## 证据缺口

- 当前 AST 覆盖了 209 个源码文件、44,842 行代码，但仍截断了 341 个节点，所以函数级结论只能保守使用。
- `query_graph.py --summary` 能输出目录骨架，但 `--hub-analysis` 仍未恢复出可用的内部依赖边；依赖图需要继续以入口文件和公开 API 为主，并显式标注为 `inferred`。
- Git 历史只有 2 个提交，热点榜里混有配置和旧 `.nexus-map` 产物，因此 Git 热点只能当极弱信号。
- 当前静态验证信号不完整：`pnpm lint` 脚本本身异常，`pnpm exec tsc --noEmit` 目前还会在 `components/mobile-sheet/mobile-page-two-card-section.tsx` 报现存类型错误。

## 推荐起点

- 改角色字段或存档兼容：先看 `lib/sheet-data.ts`、`lib/default-sheet-data.ts`、`lib/sheet-data-migration.ts`、`lib/character-data-validator.ts`、`lib/multi-character-storage.ts`。
- 改桌面主站或打印导出：先看 `app/page.tsx`、`hooks/use-character-management.ts`、`hooks/use-export-handlers.ts`、`lib/page-registry.ts`、`lib/html-exporter.ts`。
- 改移动端工作台：先看 `app/m-sheet/page.tsx`、`components/mobile-sheet/mobile-home.tsx`、`components/mobile-sheet/register-mobile-pages.ts`、`components/mobile-sheet/mobile-page-two-card-section.tsx`。
- 改卡牌查询、导入、批次或图片：先看 `card/index-unified.ts`、`card/stores/unified-card-store.ts`、`card/stores/store-actions.ts`、`card/utils/dhcb-importer.ts`。
- 改核心包覆盖或开发态保存：先看 `card/stores/builtin-package-storage.ts`、`app/api/dev/builtin-package/route.ts`、`lib/dev-builtin-package-file.ts`。
- 改卡包编辑器：先看 `app/card-editor/page.tsx`、`app/card-editor/store/card-editor-store.ts`、`app/card-editor/services/validation-service.ts`。

## [操作指南] 强制执行步骤

> 本节是对所有读取本文件的 AI 发出的硬性操作指令，不是建议。

### 步骤1 — 必须先读完以下所有文件（顺序不限）

读完本文件后，在执行任何任务之前，必须依次 read 以下文件完整内容：

- `.nexus-map/arch/systems.md` — 系统边界与代码位置
- `.nexus-map/arch/dependencies.md` — 系统间依赖关系与 Mermaid 图
- `.nexus-map/arch/test_coverage.md` — 测试面与证据缺口
- `.nexus-map/hotspots/git_forensics.md` — Git 热点与耦合风险
- `.nexus-map/concepts/domains.md` — 核心领域概念

> 这些文件均为高密度摘要，总量通常 < 5000 tokens，是必要的上下文成本。
> 不得以“任务简单”或“只改一个文件”为由跳过。

### 步骤2 — 按任务类型追加操作（步骤1 完成后执行）

- 若任务涉及接口修改、新增跨模块调用、删除或重命名公共函数：
  → 必须运行 `query_graph.py --impact <目标文件>` 确认影响半径后再写代码。
- 若任务需要判断某文件被谁引用：
  → 运行 `query_graph.py --who-imports <模块名>`。
- 若仓库结构已发生重大变化（新增系统、重构模块边界）：
  → 任务完成后评估是否需要重新运行 nexus-mapper 更新知识库。

> 当前依赖图对路径别名导入的恢复能力有限；运行 `query_graph.py` 后仍需要结合源码人工校验。
