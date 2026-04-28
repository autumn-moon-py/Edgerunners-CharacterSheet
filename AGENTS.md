# AGENTS.md

本文件面向后续进入仓库的 coding agent，目标是让新会话能快速接手，而不是重复冷启动。

## 先读什么

进入仓库后，先读以下文件：

1. `.nexus-map/INDEX.md`
2. `.nexus-map/arch/systems.md`
3. `.nexus-map/arch/dependencies.md`
4. `.nexus-map/arch/test_coverage.md`
5. `.nexus-map/concepts/domains.md`
6. `.nexus-map/hotspots/git_forensics.md`

如果任务直接落在某个系统，再补读对应入口：

- 角色主站：`app/page.tsx`、`lib/sheet-store.ts`、`lib/sheet-data.ts`
- 卡牌运行时：`card/index-unified.ts`、`card/stores/unified-card-store.ts`、`card/stores/store-actions.ts`
- 卡包编辑器：`app/card-editor/page.tsx`、`app/card-editor/store/card-editor-store.ts`
- 卡包管理页：`app/card-manager/page.tsx`
- 存档与导入导出：`lib/multi-character-storage.ts`、`lib/storage.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`

## 项目概览

这是一个 Next.js 15 + React 19 的车卡 Web 应用，但当前默认内置核心包已经明确收敛到赛博朋克战役框架「边缘行者」，不要再把它当成纯通用 DaggerHeart 展示站来理解。

README 应保持面向玩家 / 主持人的产品视角；实现细节、架构边界和改动守则放在本文件与 `.nexus-map/`。

主要包含三条用户流程：

- `/`：角色工作台，负责编辑、打印、导出和多角色切换
- `/card-editor`：卡包编辑器，负责原始卡牌的可视化编写、预览和校验
- `/card-manager`：卡包管理页，负责导入 JSON / DHCB / ZIP、批次启停、批次删除和存储清理

核心状态系统有两套：

- `lib/sheet-store.ts`：角色与页面状态
- `card/stores/unified-card-store.ts`：统一卡牌运行时

## 改动守则

### 1. 改 `SheetData` 时不要只改一个地方

至少同步检查这些文件：

- `lib/sheet-data.ts`
- `lib/default-sheet-data.ts`
- `lib/sheet-data-migration.ts`
- `lib/storage.ts`
- `lib/html-importer.ts`
- `lib/html-exporter.ts`
- 相关回归验证点

### 2. 改卡牌结构时要串联整条链路

至少同步检查这些位置：

- `card/card-types.ts`
- `card/*/convert.ts`
- `card/type-validators.ts`
- `card/stores/store-actions.ts`
- `app/card-editor/store/card-editor-store.ts`
- `app/card-editor/services/validation-service.ts`

### 3. 改批次或图片导入时要考虑回滚

`.dhcb` / `.zip` 导入不是单纯写卡牌数据，还会写图片到 IndexedDB。相关逻辑集中在：

- `card/utils/dhcb-importer.ts`
- `card/stores/store-actions.ts`
- `card/stores/image-service/`

图片失败时当前设计会回滚批次，不要破坏这条语义。

### 4. 改存档迁移时要优先保证兼容

`lib/multi-character-storage.ts` 会在加载时自动迁移并回写。任何键名、结构或默认值变化都可能影响：

- 旧单角色存档迁移
- 多角色切换
- JSON 导入
- HTML 导入
- 复制角色

## 常用命令

```bash
pnpm dev
pnpm build
pnpm build:local
pnpm lint
```

当前快照里 `package.json` 没有保留自动化测试脚本。若后续重新接回测试体系，再补充这里的命令列表。

## 不要自动做的事

- 不要在没有用户明确要求时自动启动 `pnpm dev`
- 不要在没有用户明确要求时自动执行 `pnpm build` / `pnpm build:local` / `pnpm lint`
- 不要假设当前目录有 `.git`；本地工作副本可能只是源码快照
- 不要把有限的回归验证误认为足够，尤其是涉及 `store-actions`、存档迁移、HTML 导入导出时
