> generated_by: nexus-mapper v2
> verified_at: 2026-04-22
> provenance: AST-backed for JavaScript/TypeScript/TSX through a local compatibility wrapper around the nexus-mapper extractor; no git metadata was available; dependency notes below combine AST directory coverage with manual inspection because the internal import graph was incomplete and 281 function nodes were truncated.

# DaggerHeart-CharacterSheet

## 仓库快照

- 这是一个基于 Next.js 15、React 19、Zustand 和 Tailwind 的客户端优先 Web 应用，用来创建、管理、打印和导出 DaggerHeart 角色卡。
- 用户面对的三条主流程分别是主站角色工作台（`/`）、卡包编辑器（`/card-editor`）和卡包管理页（`/card-manager`）。
- 仓库核心能力不止是表单编辑，还包含统一卡牌运行时、自定义卡包导入、浏览器端多角色存档、HTML/JSON 导出导入，以及前端内存诊断。

## 关键系统

- `应用壳层`：`app/layout.tsx` 挂载主题、卡牌系统初始化、打印辅助、通知和全局错误处理。
- `角色工作台`：`app/page.tsx` 负责页面注册、主角色卡 UI、打印、双页/文字模式、悬浮笔记本和角色切换。
- `统一卡牌运行时`：`card/` 与 `card/stores/` 负责内置卡牌播种、自定义卡牌导入、批次启停、图片管理和标准卡牌查询。
- `卡包编辑与运营工具`：`app/card-editor/` 负责编写和校验卡包，`app/card-manager/` 负责导入 JSON/DHCB/ZIP、批次查看和清理。
- `浏览器数据与互操作`：`lib/multi-character-storage.ts`、`lib/storage.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`、`lib/memory-monitor.ts` 处理本地存档、迁移、导出和诊断。

## 手工关注区

- `lib/sheet-store.ts`：角色主数据的集中写入口，字段和副作用很多。
- `card/stores/store-actions.ts`：统一卡牌系统的初始化、导入、批次删除、清理和图片索引都在这里。
- `app/page.tsx`：页面注册、模态框、打印状态和角色操作在同一处编排。
- `app/card-editor/store/card-editor-store.ts`：卡包编辑器把卡牌模板、ID 生成、图片迁移和验证串在一起。
- `lib/multi-character-storage.ts`：多角色迁移、清理和 localStorage 键约定都在这里，兼容性风险高。

## 证据缺口

- 仓库当前不是 Git 工作树，无法生成真实的热点排行和共变更耦合数据。
- AST 成功覆盖了 245 个 JS/TS/TSX 文件，但节点上限截断了 281 个函数节点，所以函数级结论只能保守使用。
- `query_graph.py --hub-analysis` 没有恢复出可用的内部 import 图，因此系统依赖图主要基于入口文件和 store API 的人工推断。
- 仓库存在 `CLAUDE.md`，但原本没有实体 `AGENTS.md`；本次分析额外补了一份仓库级 `AGENTS.md` 作为后续 agent 入口。

## 推荐起点

- 角色数据或页面行为改动：先看 `lib/sheet-data.ts`、`lib/default-sheet-data.ts`、`lib/sheet-store.ts`、`app/page.tsx`。
- 卡牌查询、导入或批次逻辑改动：先看 `card/index-unified.ts`、`card/stores/unified-card-store.ts`、`card/stores/store-actions.ts`。
- 卡包编辑器改动：先看 `app/card-editor/page.tsx`、`app/card-editor/store/card-editor-store.ts`、`app/card-editor/services/validation-service.ts`。
- 存档、导入导出兼容改动：先看 `lib/multi-character-storage.ts`、`lib/storage.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`。

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

> 当前 AST 依赖图不完整；运行 `query_graph.py` 后仍需结合人工阅读校验结果。
