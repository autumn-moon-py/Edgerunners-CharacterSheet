> generated_by: nexus-mapper v2
> verified_at: 2026-05-02
> provenance: Static filesystem inspection plus one manual validation pass in the current workspace. No automated test suite was executed; static command status notes below come from direct command output during this mapping refresh.

# 测试面

## 当前状态

- 当前仓库快照里仍然没有 `tests/`、`__tests__/` 或常见 `*.test.*` / `*.spec.*` 测试文件。
- `package.json` 只保留了 `dev`、`build`、`build:local`、`extract-css`、`start`、`lint`、`optimize:images` 脚本，没有 `test` 类脚本。
- `pnpm lint` 当前不是可靠信号：命令会报 `Invalid project directory provided, no such directory: ...\lint`，说明现有 lint 脚本本身需要修复后才能作为验证手段。
- `pnpm exec tsc --noEmit` 当前也不是全绿：会在 `components/mobile-sheet/mobile-page-two-card-section.tsx` 报 `isEmptySlot` 类型错误。

## 直接含义

- 当前仓库没有自动化测试体系，且现成的静态校验命令也并非全部可用，因此“构建级信号”本身就不稳。
- 任何涉及以下文件的改动都需要额外人工回归：
  - `app/page.tsx`
  - `components/mobile-sheet/mobile-home.tsx`
  - `components/mobile-sheet/mobile-page-two-card-section.tsx`
  - `lib/sheet-store.ts`
  - `lib/multi-character-storage.ts`
  - `card/stores/store-actions.ts`
  - `card/stores/builtin-package-storage.ts`
  - `card/utils/dhcb-importer.ts`
  - `lib/html-exporter.ts`
  - `lib/html-importer.ts`
  - `app/card-editor/store/card-editor-store.ts`
  - `app/card-manager/page.tsx`

## 建议的人工回归清单

- 桌面主站：新建角色、切换角色、复制角色、删除角色、刷新后恢复活动角色。
- 移动端主站：首页重定向到 `/m-sheet`、页签切换、第二页三段视图、移动导出和角色管理弹窗。
- 角色字段兼容：确认 `favoriteDomainCardIds` 能随角色切换保留，且 HTML 导出再导入后不丢字段。
- 卡牌运行时：初始化内置卡牌、自定义卡包导入、批次禁用、批次删除、清空自定义卡牌。
- `.dhcb` / `.zip`：导入带图片卡包、构造孤儿图片、制造图片导入失败并确认整批回滚。
- 核心包覆盖：编辑器加载核心包、保存核心包、本地开发态直写、跨标签页收到 `BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY` 后刷新内置卡牌。
- 导出互操作：HTML 导出后再导入，确认 `SheetData` round-trip 不丢字段，且卡牌引用仍可恢复。

## 已知验证缺口

- 当前没有任何自动化回归覆盖桌面与移动端双入口共享的 `sheet-store` / 导出链路。
- `pnpm lint` 脚本异常意味着 ESLint 当前不能作为交付门禁；需要先修脚本本身。
- `pnpm exec tsc --noEmit` 的现存红灯说明类型系统也不是全局可用的交付信号，至少移动端卡组区块还有遗留问题。

## 如果后续补回测试体系

- 同步更新 `package.json`、`AGENTS.md` 和这份 `test_coverage.md`。
- 优先补的模块顺序建议是：
  1. `lib/multi-character-storage.ts` + `lib/sheet-data-migration.ts`
  2. `lib/sheet-store.ts` + 移动端 / 桌面双入口关键交互
  3. `card/stores/store-actions.ts` + `card/utils/dhcb-importer.ts`
  4. `card/stores/builtin-package-storage.ts` + 核心包 override 链路
  5. `lib/html-exporter.ts` + `lib/html-importer.ts`
  6. `app/card-editor/store/card-editor-store.ts`
