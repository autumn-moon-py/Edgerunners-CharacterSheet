# 卡包编辑器直写核心包源码设计

## 背景

当前卡包编辑器在 `核心包编辑` 模式下，点击「保存到核心包」并不会回写项目源码，而是把内容保存到浏览器本地覆盖层：

- IndexedDB
- localStorage（兼容回退）

运行时再通过 `loadBuiltinPackageSource()` 优先读取这层 override。

这条链路对浏览器内即时调试有效，但不符合本地开发维护核心包的真实工作流。当前开发者仍需要：

1. 在编辑器里修改核心包
2. 导出 JSON / DHCB
3. 手工替换 `data/cards/builtin-base.json`

目标是把这条链路改成：

- 仅在本地开发环境
- `核心包编辑` 模式下
- 点击「保存到核心包」后
- 直接覆盖项目里的 `data/cards/builtin-base.json`

## 目标

实现一个仅在本地开发可用的源码写入通道，使卡包编辑器可以直接把核心包正文保存到项目源文件，而不是只写浏览器 override。

## 非目标

以下内容不在本期范围：

1. 不处理图片写回项目目录
2. 不让线上部署或静态导出环境获得源码写入能力
3. 不移除现有浏览器 override 机制
4. 不改变普通卡包编辑与导出逻辑
5. 不自动提交 git

## 用户故事

### 用户故事 1：本地开发直接保存核心包

作为本地开发者，我希望在卡包编辑器加载核心包后，点击「保存到核心包」就能直接更新项目里的 `data/cards/builtin-base.json`，而不是导出后再手工替换。

### 用户故事 2：非本地开发环境保持旧行为

作为线上或静态版使用者，我不应该获得项目源码写入能力；系统要么继续走浏览器 override，要么明确拒绝本地写源码分支。

## 当前实现分析

### 编辑器入口

`app/card-editor/page.tsx`

这里通过 `useCardEditorStore()` 暴露：

- `loadBuiltinPackage`
- `saveBuiltinPackage`

Toolbar 的「保存到核心包」按钮最终调用 `saveBuiltinPackage()`。

### 当前核心包保存链路

`app/card-editor/store/card-editor-store.ts`

`saveBuiltinPackage()` 当前会：

1. 调 `preparePackageDataForBuiltinSave()` 清洗数据
2. 初始化卡牌运行时
3. 调 `runtimeStore.replaceBuiltinCards(preparedPackage.packageData)`
4. 可选同步内置包图片到运行时
5. 更新编辑器内部状态

这里的关键问题是：

- `replaceBuiltinCards()` 落到的是运行时内置包覆盖层
- 不是 `data/cards/builtin-base.json`

### 当前核心包读取链路

`card/stores/builtin-package-storage.ts`

这里的 `loadBuiltinPackageSource()` 会：

1. 先尝试读取 override
2. 没有 override 时，再读取默认文件 `data/cards/builtin-base.json`

这说明：

- 运行时已有“默认文件 + override”双层结构
- 我们不需要移除现有 override
- 只需要在本地开发时增加一条“直接写默认文件”的通道

## 设计原则

### 1. 只在本地开发开放源码写入

源码写入能力必须严格限制在本地开发环境。

理由：

1. 线上部署环境不应拥有任意写项目文件的能力
2. 静态导出版没有 Node 文件系统上下文
3. 本需求本质上是开发工作流增强，而不是终端用户功能

### 2. 仍保留浏览器 override 机制

不删除现有 override 机制。

理由：

1. 线上/静态环境仍需要这条链路
2. 当前运行时刷新逻辑已经围绕 override 工作
3. 本期目标是增加开发态直写，不是整体重构内置包存储模型

### 3. 直写目标固定为 `builtin-base.json`

本地开发态保存核心包时，直接覆盖：

`data/cards/builtin-base.json`

不新增 `builtin-override.json` 之类的额外源文件层。

理由：

1. 用户明确要求“直接编辑到项目源文件”
2. 开发者最直观、最易理解
3. 减少额外的运行时优先级与同步复杂度

## 最终方案

### 总体结构

新增一条仅在本地开发可用的 API 写文件链路：

1. 编辑器前端仍由 `saveBuiltinPackage()` 发起保存
2. 如果检测到本地开发环境，则改为调用本地 API
3. 本地 API 在服务端直接覆盖 `data/cards/builtin-base.json`
4. 成功后，前端继续触发运行时刷新，使当前页面即时生效
5. 如果不是本地开发环境，则继续走现有 override 逻辑

### 服务端 API

新增：

`app/api/dev/builtin-package/route.ts`

职责：

1. 仅在 `NODE_ENV === "development"` 下允许执行
2. 接收编辑器提交的核心包数据
3. 运行服务端清洗
4. 把结果写入 `data/cards/builtin-base.json`
5. 返回成功或错误信息

### 环境限制

API 必须做以下限制：

1. 如果不是开发环境，直接返回 403
2. 不允许在生产构建或静态导出流程中使用

### 数据写入格式

写回文件内容必须满足：

1. JSON 结构与当前 `builtin-base.json` 一致
2. 使用 UTF-8 编码
3. 格式化输出（建议保留 2 空格缩进）

### 前端保存分支

修改：

`app/card-editor/store/card-editor-store.ts`

在 `saveBuiltinPackage()` 里分成两条分支：

#### 分支 A：本地开发源码直写

条件：

- 本地开发环境

行为：

1. 调用 API：`/api/dev/builtin-package`
2. 成功后更新编辑器状态
3. 继续调用当前运行时刷新链路，让内置卡牌系统立即生效

#### 分支 B：旧 override 逻辑

条件：

- 非开发环境

行为：

1. 保持现有 `replaceBuiltinCards()` 逻辑
2. 保持当前图片同步与 toast 行为

### 成功后的运行时刷新

即使源码文件已被改写，前端当前会话仍然需要立即刷新运行时内置卡牌内容。

因此本地开发直写成功后，仍然要继续触发当前已有的运行时刷新流程，保证：

1. 当前编辑器状态更新
2. 主站实时读到新核心包
3. 不需要手工刷新页面

## UI 行为

### Toolbar 不新增新按钮

继续使用现有按钮：

- 「保存到核心包」

区别只体现在其底层行为：

1. 本地开发 -> 直写源码文件
2. 其他环境 -> 浏览器 override

### 提示文案

保存成功时，建议区分提示：

#### 本地开发直写成功

提示示例：

- `核心包已写回源码文件`

#### 非开发环境旧逻辑成功

继续保留：

- `核心包已保存`

## 图片边界

本期明确不处理图片写回项目目录。

也就是说：

1. 正文、字段、卡牌结构改动会写入 `builtin-base.json`
2. 浏览器中的本地图片数据不会自动写入项目源码目录
3. 若核心包编辑使用了仅存在于浏览器中的图片，本期不保证它们能同步成为源码资源

这是一个有意识的阶段性边界，不是遗漏。

## 失败场景

### 场景 1：非开发环境调用直写 API

结果：

- 返回 403
- 前端回退到旧逻辑或提示当前环境不支持源码直写

### 场景 2：文件写入失败

结果：

- 不修改编辑器状态里的 `isModified`
- 不提示成功
- 明确显示失败原因

### 场景 3：数据清洗失败

结果：

- 中断写入
- 返回明确错误

## 影响文件

### 新增文件

1. `app/api/dev/builtin-package/route.ts`
2. 可能新增一个服务端辅助工具，例如：
   - `lib/dev-builtin-package-file.ts`

### 修改文件

1. `app/card-editor/store/card-editor-store.ts`

## 成功标准

满足以下条件即视为完成：

1. 在本地开发环境中
2. 打开卡包编辑器并加载核心包
3. 修改核心包内容
4. 点击「保存到核心包」
5. `data/cards/builtin-base.json` 被直接覆盖
6. 当前运行时核心包立即刷新生效
7. 非开发环境不暴露源码写入能力

## 测试与验证建议

由于你当前仓库不允许我主动跑 `pnpm build` 等命令，后续实现完成后的验证建议应由显式请求触发。实现阶段至少需要人工验证：

1. 本地开发保存后源码文件是否真实变更
2. 主站是否立即读到新核心包
3. 非开发环境是否拒绝直写分支

## 范围结论

这是一个范围明确、可以单独实现的开发态增强功能。

第一阶段只解决：

- 核心包正文直写源码文件

图片回写、更多开发工具联动等能力放到后续阶段。
