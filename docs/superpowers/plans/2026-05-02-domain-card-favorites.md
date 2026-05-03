# 领域卡收藏功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为领域卡选择弹窗增加按角色保存的收藏功能，在卡片右上角提供五角星按钮，并在左侧类型栏增加 `收藏` 入口。

**架构：** 收藏数据直接挂在 `SheetData.favoriteDomainCardIds`，由 `sheet-store` 暴露最小收藏 action。领域卡弹窗在不污染 `CardType` 体系的前提下，引入一个仅用于 UI 的 `favorites` 伪视图，并把收藏按钮透传到图片卡与文本卡组件。

**技术栈：** Next.js 16、React 19、TypeScript、Zustand、现有卡牌选择弹窗组件体系

---

## 文件结构

### 修改文件

- `lib/sheet-data.ts`
  - 为角色数据增加 `favoriteDomainCardIds`
- `lib/default-sheet-data.ts`
  - 为新角色提供默认收藏字段
- `lib/sheet-data-migration.ts`
  - 为旧角色数据补齐收藏字段
- `lib/character-data-validator.ts`
  - 在清洗、合并和导入链路中保留收藏字段
- `lib/sheet-store.ts`
  - 新增领域卡收藏相关 action
- `components/modals/card-selection/CardTypeSidebar.tsx`
  - 增加领域上下文下的 `收藏` 入口
- `components/modals/card-selection-modal.tsx`
  - 引入 `favorites` 伪视图并过滤收藏领域卡
- `components/modals/display/CardGrid.tsx`
  - 透传收藏状态和收藏点击事件
- `components/modals/display/InfiniteCardGrid.tsx`
  - 继续透传收藏状态和收藏点击事件
- `components/ui/image-card.tsx`
  - 图片模式卡片右上角星标按钮
- `components/ui/selectable-card.tsx`
  - 文本模式卡片右上角星标按钮

### 不修改文件

- `card/card-types.ts`
  - 不新增 `CardType.Favorites`
- `components/modals/generic-card-selection-modal.tsx`
  - 本期只处理领域卡主弹窗，不扩散到其它选择器

## 任务 1：接通按角色保存的收藏数据字段

**文件：**
- 修改：`lib/sheet-data.ts`
- 修改：`lib/default-sheet-data.ts`
- 修改：`lib/sheet-data-migration.ts`
- 修改：`lib/character-data-validator.ts`

- [ ] **步骤 1：在 `SheetData` 中声明收藏字段**

在 `lib/sheet-data.ts` 的 `SheetData` 接口里新增字段：

```ts
favoriteDomainCardIds: string[]
```

要求：

- 放在 `cards` / `inventory_cards` 附近或其他角色偏好字段附近
- 不使用可选字段，避免后续逻辑到处判空

- [ ] **步骤 2：为默认角色数据补齐空数组默认值**

在 `lib/default-sheet-data.ts` 的 `defaultSheetData` 中加入：

```ts
favoriteDomainCardIds: [],
```

要求：

- 保持对象结构清晰
- 不引入 `Array(0)` 或额外 helper

- [ ] **步骤 3：为旧角色数据增加迁移逻辑**

在 `lib/sheet-data-migration.ts` 中新增一个最小迁移函数，例如：

```ts
function migrateFavoriteDomainCardIds(data: SheetData): SheetData {
  if (Array.isArray(data.favoriteDomainCardIds)) {
    return data
  }

  return {
    ...data,
    favoriteDomainCardIds: [],
  }
}
```

并在 `migrateSheetData()` 主链路中调用它。

要求：

- 只接受数组；历史缺失值统一补 `[]`
- 不在迁移阶段做卡牌存在性校验

- [ ] **步骤 4：在数据验证器里保留新字段**

在 `lib/character-data-validator.ts` 的 `cleanAndNormalizeData()` 中加入：

```ts
favoriteDomainCardIds: Array.isArray(data.favoriteDomainCardIds)
  ? data.favoriteDomainCardIds.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
  : [],
```

要求：

- 只保留非空字符串 ID
- 不去做领域卡类型校验，避免在导入阶段引入卡牌运行时依赖

- [ ] **步骤 5：人工核对导入导出链路是否天然覆盖该字段**

检查并确认以下链路使用的是完整 `SheetData` 对象，不需要额外加字段白名单：

- `lib/multi-character-storage.ts`
- `lib/html-exporter.ts`
- `lib/html-importer.ts`

预期：

- 无需修改这 3 个文件
- 若发现白名单或字段裁剪，再补任务，不要临时口头跳过

- [ ] **步骤 6：验证新字段在类型层无报错**

人工检查以下点：

- `SheetData` 类型引用处不出现缺字段错误
- `defaultSheetData` 与 `SheetData` 接口保持一致
- `migrateSheetData()` 返回的对象始终带 `favoriteDomainCardIds`

- [ ] **步骤 7：Commit**

```bash
git add lib/sheet-data.ts lib/default-sheet-data.ts lib/sheet-data-migration.ts lib/character-data-validator.ts
git commit -m "feat: add per-character domain favorites field"
```

## 任务 2：在 `sheet-store` 中增加领域卡收藏 action

**文件：**
- 修改：`lib/sheet-store.ts`

- [ ] **步骤 1：在 `SheetState` 接口中声明收藏相关方法**

在 `SheetState` 中加入：

```ts
toggleFavoriteDomainCard: (cardId: string) => void;
isFavoriteDomainCard: (cardId: string) => boolean;
```

- [ ] **步骤 2：实现 `toggleFavoriteDomainCard`**

在 store 实现中加入最小逻辑：

```ts
toggleFavoriteDomainCard: (cardId) => set((state) => {
  const normalizedCardId = cardId.trim()

  if (!normalizedCardId) {
    return state
  }

  const currentFavorites = Array.isArray(state.sheetData.favoriteDomainCardIds)
    ? state.sheetData.favoriteDomainCardIds
    : []

  const exists = currentFavorites.includes(normalizedCardId)

  return {
    sheetData: {
      ...state.sheetData,
      favoriteDomainCardIds: exists
        ? currentFavorites.filter((id) => id !== normalizedCardId)
        : [...currentFavorites, normalizedCardId],
    },
  }
}),
```

要求：

- 非空校验
- 无重复写入
- 不引入额外 helper 文件

- [ ] **步骤 3：实现 `isFavoriteDomainCard`**

加入只读查询：

```ts
isFavoriteDomainCard: (cardId) => {
  const normalizedCardId = cardId.trim()
  if (!normalizedCardId) {
    return false
  }

  const favorites = useSheetStore.getState().sheetData.favoriteDomainCardIds
  return Array.isArray(favorites) && favorites.includes(normalizedCardId)
},
```

如果当前文件内部不适合直接调用 `useSheetStore.getState()`，则改为通过 `get` 风格或闭包访问当前状态，但要保持接口语义不变。

- [ ] **步骤 4：为弹窗消费准备最小 selector 出口**

在文件底部现有导出区域附近，补一个最小 hook 或复用现有模式，例如：

```ts
export const useFavoriteDomainCardIds = () => useSheetStore((state) => state.sheetData.favoriteDomainCardIds)
```

如果已有更合适的直接 selector 模式，按现有风格保持一致。

- [ ] **步骤 5：验证现有 `useCardActions` 等导出不受影响**

确认：

- 现有 `useCardActions` 仍然只暴露卡组相关动作
- 新增收藏动作不会误塞进不相关的导出集合里

- [ ] **步骤 6：Commit**

```bash
git add lib/sheet-store.ts
git commit -m "feat: add domain favorite actions to sheet store"
```

## 任务 3：让左侧类型栏支持领域专属 `收藏` 入口

**文件：**
- 修改：`components/modals/card-selection/CardTypeSidebar.tsx`

- [ ] **步骤 1：为侧栏增加领域上下文参数**

修改 props：

```ts
interface CardTypeSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  showDomainFavorites?: boolean
}
```

- [ ] **步骤 2：在标准卡牌分组中渲染 `收藏` 入口**

在“标准卡牌”列表中、`领域` 附近增加一个条件按钮：

```tsx
{showDomainFavorites ? (
  <button
    onClick={() => onTabChange('favorites')}
    className={cn(
      'w-full text-left px-4 py-2 text-sm rounded',
      activeTab === 'favorites'
        ? 'bg-blue-100 text-blue-700 font-medium'
        : 'hover:bg-gray-100 text-gray-600'
    )}
  >
    收藏
  </button>
) : null}
```

要求：

- 不改动现有 `CardType` 列表来源
- `收藏` 只是额外 UI 项，不并入 `getCardTypesByCategory()`

- [ ] **步骤 3：控制 `收藏` 入口只在需要时出现**

保证 `showDomainFavorites` 默认值为 `false`，避免：

- 其他使用侧栏的弹窗自动出现 `收藏`
- 非领域上下文出现无意义入口

- [ ] **步骤 4：Commit**

```bash
git add components/modals/card-selection/CardTypeSidebar.tsx
git commit -m "feat: add favorites entry to domain card sidebar"
```

## 任务 4：在领域卡弹窗里接入 `favorites` 伪视图

**文件：**
- 修改：`components/modals/card-selection-modal.tsx`

- [ ] **步骤 1：接入当前角色收藏列表和收藏 action**

在弹窗组件顶部引入 `sheet-store` 收藏能力，例如：

```ts
const favoriteDomainCardIds = useSheetStore((state) => state.sheetData.favoriteDomainCardIds)
const toggleFavoriteDomainCard = useSheetStore((state) => state.toggleFavoriteDomainCard)
```

- [ ] **步骤 2：定义领域收藏视图常量**

在组件内部新增常量：

```ts
const FAVORITES_TAB_ID = 'favorites'
```

避免在多个分支里硬编码字符串。

- [ ] **步骤 3：判断当前是否处于领域收藏上下文**

补充最小派生状态：

```ts
const isFavoritesView = state.activeTab === FAVORITES_TAB_ID
const isDomainContext = state.activeTab === CardType.Domain || isFavoritesView
```

要求：

- 左侧从 `领域` 切到 `收藏` 后，不丢失领域场景能力

- [ ] **步骤 4：构建收藏视图的基底卡牌集合**

在 `searchedCards` 之前增加一层列表派生，示例：

```ts
const favoriteDomainCards = useMemo(() => {
  const favoriteIds = new Set(favoriteDomainCardIds)
  return filteredCards.filter((card) => card.type === CardType.Domain && favoriteIds.has(card.id))
}, [filteredCards, favoriteDomainCardIds])

const cardsForCurrentView = isFavoritesView ? favoriteDomainCards : filteredCards
```

注意：

- 这里必须让 `收藏` 视图基于当前已加载的领域卡集合
- 不能把非领域卡带进来

- [ ] **步骤 5：让本地搜索基于当前视图结果集工作**

把 `searchedCards` 的输入从 `filteredCards` 改为 `cardsForCurrentView`：

```ts
if (!searchTerm.trim()) return cardsForCurrentView
```

要求：

- `收藏` 视图仍可搜索
- 普通领域视图和其他卡牌视图行为不变

- [ ] **步骤 6：把 `showDomainFavorites` 传给左侧侧栏**

渲染 `CardTypeSidebar` 时加入：

```tsx
<CardTypeSidebar
  activeTab={state.activeTab}
  onTabChange={handleTabChange}
  showDomainFavorites={initialTab === CardType.Domain || state.activeTab === CardType.Domain || state.activeTab === FAVORITES_TAB_ID}
/>
```

如果在阅读实现后发现 `initialTab` 不是可靠依据，可改成更稳妥的领域弹窗判定，但要保持“只在领域场景显示收藏入口”这条规则。

- [ ] **步骤 7：把收藏状态和点击事件透传给卡片网格**

给 `InfiniteCardGrid` 增加参数：

```tsx
showFavoriteButton={isDomainContext}
favoriteCardIds={favoriteDomainCardIds}
onFavoriteToggle={(card) => toggleFavoriteDomainCard(card.id)}
```

要求：

- 只在领域上下文透传
- 非领域场景保持未启用

- [ ] **步骤 8：验证空状态文案在收藏视图下仍合理**

如果当前 `emptyMessage` 过于通用，改成基于视图的条件文案：

```ts
emptyMessage={isFavoritesView ? '还没有收藏的领域卡' : '未找到符合条件的卡牌'}
```

- [ ] **步骤 9：Commit**

```bash
git add components/modals/card-selection-modal.tsx
git commit -m "feat: add favorites view to domain card modal"
```

## 任务 5：把收藏按钮透传到网格层

**文件：**
- 修改：`components/modals/display/CardGrid.tsx`
- 修改：`components/modals/display/InfiniteCardGrid.tsx`

- [ ] **步骤 1：为 `CardGrid` 增加收藏相关 props**

扩展接口：

```ts
showFavoriteButton?: boolean
favoriteCardIds?: string[]
onFavoriteToggle?: (card: T) => void
```

- [ ] **步骤 2：在 `CardGrid` 中计算单卡收藏状态并透传**

示例：

```ts
const favoriteIdSet = new Set(favoriteCardIds ?? [])
```

并在每个 `SelectableCard` / `ImageCard` 上透传：

```tsx
showFavoriteButton={showFavoriteButton && card.type === CardType.Domain}
isFavorite={favoriteIdSet.has(card.id)}
onFavoriteToggle={() => onFavoriteToggle?.(card)}
```

要求：

- 不给非领域卡显示星标
- 不让 `CardGrid` 自己修改收藏数据，只做透传

- [ ] **步骤 3：在 `InfiniteCardGrid` 中继续透传这些 props**

扩展 `InfiniteCardGridProps`，并原样转发给 `CardGrid`。

要求：

- 不改变无限滚动行为
- 不引入额外 state

- [ ] **步骤 4：Commit**

```bash
git add components/modals/display/CardGrid.tsx components/modals/display/InfiniteCardGrid.tsx
git commit -m "feat: pass favorite controls through card grids"
```

## 任务 6：在图片卡与文本卡上增加五角星按钮

**文件：**
- 修改：`components/ui/image-card.tsx`
- 修改：`components/ui/selectable-card.tsx`

- [ ] **步骤 1：为两个卡片组件增加收藏相关 props**

统一增加：

```ts
showFavoriteButton?: boolean
isFavorite?: boolean
onFavoriteToggle?: () => void
```

- [ ] **步骤 2：在图片卡右上角加星标按钮**

在 `ImageCard` 的图片区域右上角放一个按钮，与领域等级徽章共存。

建议结构：

```tsx
{showFavoriteButton ? (
  <button
    type="button"
    className="absolute top-2 left-2 z-10 rounded-full bg-black/40 px-2 py-1 text-white backdrop-blur-md transition hover:bg-black/55"
    onClick={(event) => {
      event.stopPropagation()
      onFavoriteToggle?.()
    }}
    aria-label={isFavorite ? '取消收藏领域卡' : '收藏领域卡'}
  >
    {isFavorite ? '★' : '☆'}
  </button>
) : null}
```

要求：

- 不遮住现有等级徽章
- 点击星标不触发卡片 `onClick`

- [ ] **步骤 3：在文本卡右上角加星标按钮**

在 `SelectableCard` 标题区右侧锚点附近加入同样语义的按钮，例如：

```tsx
{showFavoriteButton ? (
  <button
    type="button"
    className="ml-1 text-amber-500 transition hover:text-amber-600"
    onClick={(event) => {
      event.stopPropagation()
      onFavoriteToggle?.()
    }}
    aria-label={isFavorite ? '取消收藏领域卡' : '收藏领域卡'}
  >
    {isFavorite ? '★' : '☆'}
  </button>
) : null}
```

要求：

- 文本模式布局不要被挤坏
- 保持现有类型锚点和标题可读性

- [ ] **步骤 4：人工检查文本模式和图片模式的显示一致性**

确认：

- 两种模式都能收藏 / 取消收藏
- 两种模式都不会误触发选卡

- [ ] **步骤 5：Commit**

```bash
git add components/ui/image-card.tsx components/ui/selectable-card.tsx
git commit -m "feat: add favorite button to domain cards"
```

## 任务 7：端到端回归验证

**文件：**
- 验证：`components/modals/card-selection-modal.tsx`
- 验证：`lib/sheet-store.ts`
- 验证：`lib/multi-character-storage.ts`
- 验证：`lib/html-exporter.ts`
- 验证：`lib/html-importer.ts`

- [ ] **步骤 1：手工验证普通领域视图收藏操作**

检查：

1. 打开领域卡弹窗
2. 点击任意领域卡星标
3. 弹窗不关闭
4. 卡牌不被选中
5. 星标状态立即切换

- [ ] **步骤 2：手工验证 `收藏` 视图**

检查：

1. 至少收藏 2 张领域卡
2. 左侧点击 `收藏`
3. 仅看到已收藏领域卡
4. 在该视图中取消收藏一张卡后，它从列表中消失

- [ ] **步骤 3：手工验证按角色隔离**

检查：

1. 角色 A 收藏几张领域卡
2. 切换到角色 B
3. 打开领域卡弹窗，确认收藏状态不同步
4. 切回角色 A，确认收藏仍存在

- [ ] **步骤 4：手工验证旧角色兼容性**

检查：

1. 读取没有 `favoriteDomainCardIds` 的旧角色数据
2. 页面无报错
3. 收藏功能可正常使用

- [ ] **步骤 5：手工验证导出再导入**

检查：

1. 角色带有领域卡收藏
2. 执行 HTML 导出
3. 再导入该角色
4. 确认收藏字段仍保留

- [ ] **步骤 6：运行至少一条仓库允许的静态验证命令**

如果用户允许执行验证命令，优先运行：

```bash
pnpm lint
```

如果用户不允许或当前环境不适合运行，则在交付中明确说明“只完成手工回归，未执行 lint / build”。

- [ ] **步骤 7：Commit**

```bash
git add .
git commit -m "feat: add per-character domain card favorites"
```

## 计划自检

### 规格覆盖度检查

- 右上角五角星按钮：由任务 5、任务 6 覆盖
- 左侧 `收藏` 入口：由任务 3 覆盖
- 仅领域卡场景启用：由任务 3、任务 4、任务 5 覆盖
- 按角色保存：由任务 1、任务 2、任务 7 覆盖
- 导入导出兼容：由任务 1、任务 7 覆盖

### 占位符扫描

- 计划中没有 `TODO`、`TBD`、`待定`、`后续实现` 类占位项
- 每个任务都指向了具体文件和具体变更方向

### 类型一致性检查

- 数据字段统一使用 `favoriteDomainCardIds`
- store action 统一使用 `toggleFavoriteDomainCard`
- 伪视图值统一使用 `favorites`
- 明确不引入新的 `CardType`
