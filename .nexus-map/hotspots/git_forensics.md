> generated_by: nexus-mapper v2
> verified_at: 2026-04-22
> provenance: Git analysis skipped because the repository snapshot available in this session does not contain `.git` metadata. The notes below are manual complexity heuristics, not git-derived hotspots.

# Git 热点与耦合风险

## 状态

- `.git` 目录不存在。
- `git_detective.py` 未执行。
- 本文件不能提供真实的提交次数、作者数或耦合对分数。

## 手工复杂度热点

| 文件 | 手工判断原因 |
| --- | --- |
| `lib/sheet-store.ts` | 角色主状态写入口非常集中，更新动作多且副作用丰富。 |
| `app/page.tsx` | 页面注册、模式切换、角色管理、打印和卡牌抽屉都在同一入口编排。 |
| `card/stores/store-actions.ts` | 初始化、导入、删除、批次禁用、内置卡牌播种、图片预处理和存储计算都在此收束。 |
| `app/card-editor/store/card-editor-store.ts` | 编辑器状态、卡牌模板生成、ID 迁移、图片键迁移和验证串联在一起。 |
| `lib/multi-character-storage.ts` | 旧键迁移、角色元数据与正文拆分、清理僵尸数据和测试清理都在这里。 |
| `lib/html-exporter.ts` | DOM 提取、样式内嵌、HTML 清洗、表单交互改写和角色数据嵌入都集中在一份大文件中。 |

## 风险模式

- `sheet-store` 与 `sheet-data` 强耦合：字段增加或语义变化容易波及导入导出、默认值和页面组件。
- `store-actions` 是卡牌运行时的汇聚点：批次、图片、内置卡牌播种、localStorage 同步和统计都依赖它，回归风险高。
- `card-editor-store` 与 `type-validators`、`id-generator`、图片辅助工具联动明显：卡牌结构或 ID 规则变化时需要联查多个文件。
- `multi-character-storage` 与 `storage.ts`、`html-importer.ts` 存在兼容边界：迁移策略一旦变化，旧存档和导入文件都可能受影响。

## 如果将来拿到完整 Git 元数据

优先重新运行以下步骤：

1. 生成新的 `raw/git_stats.json`
2. 对比 `lib/sheet-store.ts`、`card/stores/store-actions.ts`、`app/page.tsx` 是否仍位于热点前列
3. 检查跨系统 `coupling_pairs`，特别关注：
   - `app/page.tsx` 与 `lib/sheet-store.ts`
   - `app/card-manager/page.tsx` 与 `card/stores/store-actions.ts`
   - `lib/multi-character-storage.ts` 与 `lib/storage.ts` / `lib/html-importer.ts`
