> generated_by: nexus-mapper v2
> verified_at: 2026-05-02
> provenance: Domain notes are grounded in `lib/sheet-data.ts`, `lib/default-sheet-data.ts`, `lib/sheet-data-migration.ts`, `lib/character-data-validator.ts`, `card/card-types.ts`, `card/stores/store-types.ts`, `card/stores/builtin-package-storage.ts`, `app/card-editor/types/index.ts`, `lib/multi-character-storage.ts`, `lib/html-exporter.ts` and `lib/html-importer.ts`.

# 核心领域概念

## 1. 角色档案（SheetData）

- 定义位置：`lib/sheet-data.ts`
- 含义：整个应用最核心的数据对象，承载角色基础信息、卡牌引用、双卡组、战斗数值、冒险笔记、页面可见性以及角色偏好状态。
- 重要约束：
  - 新字段不能只改接口；至少要同步检查 `default-sheet-data.ts`、`sheet-data-migration.ts`、`character-data-validator.ts`、HTML 导入导出链路。
  - `professionRef`、`ancestry1Ref`、`communityRef` 等引用字段用于避免名称兼容问题，不能只靠字符串名称回推卡牌。
  - 当前“聚焦卡组 / 库存卡组”直接落在 `cards` 和 `inventory_cards`，不再依赖历史 `focused_card_ids` 方案。
  - `favoriteDomainCardIds` 已成为正式角色字段，意味着“领域卡收藏”不是 UI 临时状态，而是随角色存档、迁移和导入导出一起流转的角色偏好数据。

## 2. 标准卡牌（StandardCard / ExtendedStandardCard）

- 定义位置：`card/card-types.ts`
- 含义：内置卡牌与自定义卡牌最终都会被标准化为统一运行时结构，供桌面主站、移动端主站、编辑器、管理页和打印系统共享。
- 重要约束：
  - `type`、`class`、`id` 是关键路由字段；主站选择器、导出标题、批次管理和编辑器预览都依赖它们。
  - `ExtendedStandardCard` 通过 `source`、`batchId`、`batchName` 区分内置与自定义来源。
  - 变体卡的额外语义由运行时和转换器补齐，不能把所有卡都当作简单静态 JSON 看待。

## 3. 卡包批次（Batch）

- 定义位置：`card/stores/store-types.ts`
- 含义：一组一起导入、一起启停、一起删除的卡牌集合，是统一卡牌运行时的运维单位。
- 重要约束：
  - 批次保存 `cardIds`，删除批次时按这些 ID 清理卡牌与图片。
  - 批次可被禁用但不删除；主站和查询 API 会过滤禁用批次里的卡牌。
  - 内置卡牌对应特殊系统批次，不能被当作普通自定义批次清空。

## 4. 卡包载荷（CardPackageState / ImportData）

- 定义位置：`app/card-editor/types/index.ts`、`card/card-types.ts`
- 含义：编辑器操作的是“原始卡包载荷”，运行时导入的是 `ImportData`，两者共同描述卡包元数据、自定义字段和按类型分组的原始卡牌数组。
- 重要约束：
  - 编辑器里的卡牌 ID 会随着包名或作者变化而重建，图片键也需要跟着迁移。
  - `sanitizeImportData()` 和验证服务是卡包进入统一运行时前的最后结构闸门。
  - 核心包浏览器覆盖和开发态直写链路同样以 `ImportData` 为边界，不会绕开这套数据结构。

## 5. 多角色归档（Character Archive）

- 定义位置：`lib/multi-character-storage.ts`
- 含义：通过 `dh_character_list` 管角色元数据，通过 `dh_character_<id>` 管单角色正文，并单独维护活动角色 ID。
- 重要约束：
  - 读取角色不是纯只读动作；`loadCharacterById()` 会自动执行迁移并回写。
  - 删除角色先删元数据，再尽力删除正文，允许短暂留下僵尸数据，之后再由清理逻辑收尾。
  - 旧单角色键会在迁移时被吸收并转成多角色结构。

## 6. 导出与导入载荷

- 定义位置：`lib/html-exporter.ts`、`lib/html-importer.ts`、`card/utils/dhcb-importer.ts`
- 含义：系统外流转时主要有三类载荷：
  - HTML：打印页快照，主数据写进 `<script id="dh-character-data" type="application/json">`，运行时脚本再同步到 `window.characterData`
  - JSON：卡包或角色的结构化文本载荷
  - DHCB / ZIP：`cards.json` 加可选 `images/*` 的卡包压缩载荷
- 重要约束：
  - HTML 导入优先读取 `dh-character-data` 脚本标签，再回退兼容旧的 `window.characterData` 赋值格式。
  - DHCB 导入会拒绝孤儿图片，并在图片导入 IndexedDB 失败时回滚整个批次。
  - 角色导出 / 导入现在也要保留 `favoriteDomainCardIds` 这类新角色偏好字段，不能只盯基础战斗数值。

## 7. 核心包来源覆盖（Builtin Package Override Source）

- 定义位置：`card/stores/builtin-package-storage.ts`、`app/api/dev/builtin-package/route.ts`、`lib/dev-builtin-package-file.ts`
- 含义：统一卡牌运行时加载内置核心包时，不再只有仓库里的 `builtin-base.json` 一种来源；它会优先读取浏览器中的 override，没有 override 时再回退到默认 JSON。
- 重要约束：
  - 浏览器 override 会在 IndexedDB 与 localStorage 之间迁移和兜底，不能假设只有一种存储介质。
  - 保存或清理 override 后必须发出 `BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY`，否则其它标签页不会刷新内置核心包。
  - 通过 `POST /api/dev/builtin-package` 写回仓库文件只允许本地开发环境和 localhost 请求，不是线上功能。

## 8. 发行版功能开关

- 定义位置：`lib/distribution-flags.ts`
- 含义：`NEXT_PUBLIC_ENABLE_CARD_MANAGER` 控制卡包编辑器和卡包管理页是否可用。
- 重要约束：
  - `app/card-editor/page.tsx` 和 `app/card-manager/page.tsx` 都会在入口处做开关检查。
  - 这意味着“卡包能力”是发行版策略，不是所有部署环境默认开放的功能。
