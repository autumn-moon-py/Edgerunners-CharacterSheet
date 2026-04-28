> generated_by: nexus-mapper v2
> verified_at: 2026-04-22
> provenance: Domain notes are grounded in `lib/sheet-data.ts`, `card/card-types.ts`, `card/stores/store-types.ts`, `lib/multi-character-storage.ts`, `lib/html-exporter.ts` and related entry files.

# 核心领域概念

## 1. 角色档案（SheetData）

- 定义位置：`lib/sheet-data.ts`
- 含义：整个应用最核心的数据对象，承载角色基础信息、卡牌引用、属性、装备、伙伴、冒险笔记、护甲模板、笔记本和页面可见性。
- 重要约束：
  - 新字段不能只改接口；还要同步 `default-sheet-data.ts`、`sheet-data-migration.ts`、JSON/HTML 导入导出逻辑。
  - `professionRef`、`ancestryRef`、`communityRef` 等卡牌引用用于避免名称兼容问题。
  - `checkedUpgrades` 使用扁平 key 格式保存升级勾选状态，不能随意改键格式。

## 2. 标准卡牌（StandardCard / ExtendedStandardCard）

- 定义位置：`card/card-types.ts`
- 含义：所有内置卡牌和自定义卡牌在运行时都会被转换成统一结构，供主站、管理页、编辑器和打印系统复用。
- 重要约束：
  - `type` 与 `class` 是关键路由字段；编辑器、导出文件名和卡槽选择都依赖它们。
  - `ExtendedStandardCard` 在 `StandardCard` 上补充 `source`、`batchId`、`batchName`，用于区分内置与自定义来源。
  - 变体卡会通过 `variantSpecial` 保存真实类型和子类别，不能直接当作普通标准卡处理。

## 3. 卡包批次（Batch）

- 定义位置：`card/stores/store-types.ts`、`card/stores/store-actions.ts`
- 含义：一组一起导入、一起禁用、一起删除的卡牌集合，也是自定义卡牌的运维单位。
- 重要约束：
  - 批次记录 `cardIds`，删除批次时按这些 ID 批量移除卡牌。
  - 批次可被禁用但不删除；主站查询卡牌时会过滤掉禁用批次。
  - 内置卡牌作为特殊系统批次存在，ID 固定且清空自定义卡牌时必须保留。

## 4. 多角色归档（Character Archive）

- 定义位置：`lib/multi-character-storage.ts`
- 含义：通过 `dh_character_list` 管理元数据，通过 `dh_character_<id>` 保存每个角色的完整 `SheetData`，并单独维护活动角色 ID。
- 重要约束：
  - 删除角色先删元数据再删正文，允许留下僵尸数据，之后再由清理函数处理。
  - 加载角色时会自动跑迁移并回写，读取不是纯只读动作。
  - 旧单角色键会在迁移时被吸收并清理。

## 5. 导出互操作载荷

- 定义位置：`lib/storage.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`、`card/utils/dhcb-importer.ts`
- 含义：角色数据和卡包在系统外部流转时使用的三类载荷：
  - JSON：角色快照，直接导入导出 `SheetData`
  - HTML：打印页面快照，内嵌样式并写入 `window.characterData`
  - DHCB/ZIP：卡包载荷，至少包含 `cards.json`，可选 `images/*`
- 重要约束：
  - HTML 导入依赖 `window.characterData` 正则提取和 `data-exporter="daggerheart-character-sheet"` 标识。
  - DHCB 导入会拒绝孤儿图片，并在图片写入失败时回滚已导入的批次。

## 6. 角色工作台附属子域

- `AdventureNotesData`：角色简介、玩家信息、故事文本和冒险履历。
- `ArmorTemplateData`：机甲/护甲模板、升级槽和废料收集。
- `NotebookData`：浮动笔记本页、文本行、计数器行和骰子行。

这些子域都挂在 `SheetData` 下，所以看起来像“额外页面功能”，本质上仍然是角色档案的一部分。
