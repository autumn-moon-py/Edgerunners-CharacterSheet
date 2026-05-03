# Card Manager Distribution Gate 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为卡包管理功能增加构建时开关，让在线构建默认隐藏入口，本地 `build:local` 默认开启入口，并在相关页面关闭时显示统一的不可用提示。

**架构：** 通过一个共享的环境变量读取助手集中判断是否启用卡包管理功能。主站底部 Dock 仅在开关开启时显示 `卡包` 入口，`/card-manager` 与 `/card-editor` 页面在开关关闭时提前渲染统一的不可用界面。本地构建脚本在 `--local` 模式下自动注入开启变量。

**技术栈：** Next.js App Router、React 19、TypeScript、现有 `navigateToPage` 导航工具、构建脚本 `scripts/run-next-build.js`

---

## 文件职责

- 新建：`lib/distribution-flags.ts`
  - 统一读取 `NEXT_PUBLIC_ENABLE_CARD_MANAGER`
  - 暴露简单布尔函数，供客户端组件与页面复用
- 新建：`components/layout/feature-unavailable.tsx`
  - 统一渲染“当前发行版未启用该功能”的轻量页面
- 修改：`components/layout/bottom-dock.tsx`
  - 根据开关决定是否渲染 `卡包` 按钮
- 修改：`app/card-manager/page.tsx`
  - 在开关关闭时提前返回不可用页面
- 修改：`app/card-editor/page.tsx`
  - 在开关关闭时提前返回不可用页面
- 修改：`scripts/run-next-build.js`
  - `--local` 模式下注入 `NEXT_PUBLIC_ENABLE_CARD_MANAGER=true`

## 任务 1：添加共享开关读取助手

**文件：**
- 创建：`lib/distribution-flags.ts`

- [ ] **步骤 1：编写最少实现代码**

```ts
function isEnvEnabled(value: string | undefined): boolean {
  return value === 'true'
}

export function isCardManagerEnabled(): boolean {
  return isEnvEnabled(process.env.NEXT_PUBLIC_ENABLE_CARD_MANAGER)
}
```

- [ ] **步骤 2：检查类型与导入是否干净**

要求：
- 文件只保留本任务需要的函数
- 不引入额外配置对象或枚举
- 默认值为 `false`

- [ ] **步骤 3：Commit**

```bash
git add lib/distribution-flags.ts
git commit -m "feat: add distribution flag for card manager"
```

## 任务 2：添加统一不可用页面组件

**文件：**
- 创建：`components/layout/feature-unavailable.tsx`

- [ ] **步骤 1：编写最少实现代码**

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { navigateToPage } from '@/lib/utils'

interface FeatureUnavailableProps {
  title: string
  description: string
}

export function FeatureUnavailable({ title, description }: FeatureUnavailableProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mb-6 text-sm leading-6 text-gray-600">{description}</p>
        <Button onClick={() => navigateToPage('/')}>返回主站</Button>
      </div>
    </div>
  )
}
```

- [ ] **步骤 2：检查组件边界**

要求：
- 不把业务判断放进组件
- 组件只负责展示标题、描述和返回首页动作

- [ ] **步骤 3：Commit**

```bash
git add components/layout/feature-unavailable.tsx
git commit -m "feat: add shared unavailable feature page"
```

## 任务 3：根据开关控制底部 Dock 的卡包按钮

**文件：**
- 修改：`components/layout/bottom-dock.tsx`

- [ ] **步骤 1：接入共享开关**

在文件顶部增加导入：

```tsx
import { isCardManagerEnabled } from '@/lib/distribution-flags'
```

在 `MainModeContent` 内增加布尔值：

```tsx
const cardManagerEnabled = isCardManagerEnabled()
```

- [ ] **步骤 2：仅在启用时渲染卡包按钮组**

将现有 `Group C` 包裹为条件渲染：

```tsx
{cardManagerEnabled ? (
  <div className="flex items-center gap-1.5">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => navigateToPage('/card-manager')}
          className={cn(
            'bg-gray-800 hover:bg-gray-700 text-white gap-1.5 text-sm',
            isMobile ? 'px-4 py-2.5' : 'px-3 py-1.5'
          )}
        >
          <Package className="h-3.5 w-3.5" />
          卡包
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>卡包管理</p>
        <p className="mt-1 text-xs text-muted-foreground">管理和导入自定义卡包</p>
      </TooltipContent>
    </Tooltip>
  </div>
) : null}
```

- [ ] **步骤 3：运行构建前静态检查**

检查点：
- 没有新增未使用 import
- `MainModeContent` 在关闭时仍能正常渲染其余两组按钮

- [ ] **步骤 4：Commit**

```bash
git add components/layout/bottom-dock.tsx
git commit -m "feat: gate card manager dock entry by distribution"
```

## 任务 4：为 card manager 页面添加发行版守卫

**文件：**
- 修改：`app/card-manager/page.tsx`

- [ ] **步骤 1：接入开关与不可用页面组件**

增加导入：

```tsx
import { FeatureUnavailable } from '@/components/layout/feature-unavailable'
import { isCardManagerEnabled } from '@/lib/distribution-flags'
```

- [ ] **步骤 2：在组件早期返回不可用页面**

在页面组件顶部状态定义之后、其他交互逻辑之前加入：

```tsx
  if (!isCardManagerEnabled()) {
    return (
      <FeatureUnavailable
        title="当前发行版未启用卡包管理"
        description="此版本仅提供角色工作台功能，未开放卡包管理与导入入口。请使用本地离线版或启用了卡包功能的发行版。"
      />
    )
  }
```

- [ ] **步骤 3：检查页面关闭时的行为**

检查点：
- 页面关闭时不继续执行导入、初始化、轮询等逻辑
- 页面开启时原有逻辑不变

- [ ] **步骤 4：Commit**

```bash
git add app/card-manager/page.tsx
git commit -m "feat: guard card manager page by distribution"
```

## 任务 5：为 card editor 页面添加发行版守卫

**文件：**
- 修改：`app/card-editor/page.tsx`

- [ ] **步骤 1：接入开关与不可用页面组件**

增加导入：

```tsx
import { FeatureUnavailable } from '@/components/layout/feature-unavailable'
import { isCardManagerEnabled } from '@/lib/distribution-flags'
```

- [ ] **步骤 2：在页面早期返回不可用页面**

在 `isClient` 加载判断之前加入：

```tsx
  if (!isCardManagerEnabled()) {
    return (
      <FeatureUnavailable
        title="当前发行版未启用卡包编辑器"
        description="此版本未开放卡包编辑功能。请使用本地离线版或启用了卡包功能的发行版。"
      />
    )
  }
```

- [ ] **步骤 3：检查页面入口一致性**

检查点：
- 当开关关闭时，用户即使直接访问 URL 也只能看到不可用页面
- 当开关开启时，页面头部的“卡包管理”跳转保持不变

- [ ] **步骤 4：Commit**

```bash
git add app/card-editor/page.tsx
git commit -m "feat: guard card editor page by distribution"
```

## 任务 6：让 local 构建自动开启卡包管理

**文件：**
- 修改：`scripts/run-next-build.js`

- [ ] **步骤 1：在 local 构建环境下注入开关**

将 `isLocalBuild` 分支改为：

```js
if (isLocalBuild) {
  env.LOCAL_BUILD = 'true'
  env.NEXT_PUBLIC_ENABLE_CARD_MANAGER = 'true'
}
```

- [ ] **步骤 2：检查普通构建行为**

检查点：
- 普通 `pnpm run build` 不应自动设置 `NEXT_PUBLIC_ENABLE_CARD_MANAGER`
- `pnpm run build:local` 应自动开启该变量

- [ ] **步骤 3：Commit**

```bash
git add scripts/run-next-build.js
git commit -m "feat: enable card manager in local builds"
```

## 任务 7：运行构建验证关闭模式

**文件：**
- 修改：无
- 验证：当前工作区改动

- [ ] **步骤 1：运行默认生产构建**

运行：`pnpm run build`

预期：
- 构建成功退出
- 没有类型错误
- 没有因为新增开关导致页面构建失败

- [ ] **步骤 2：人工检查关闭模式代码路径**

检查点：
- `BottomDock` 中 `卡包` 按钮受 `isCardManagerEnabled()` 控制
- `app/card-manager/page.tsx` 和 `app/card-editor/page.tsx` 在关闭时返回 `FeatureUnavailable`

- [ ] **步骤 3：Commit**

```bash
git add .
git commit -m "test: verify web build with card manager disabled"
```

## 任务 8：运行构建验证 local 开启模式

**文件：**
- 修改：无
- 验证：当前工作区改动

- [ ] **步骤 1：运行本地构建**

运行：`pnpm run build:local`

预期：
- 构建成功退出
- local 构建携带 `NEXT_PUBLIC_ENABLE_CARD_MANAGER=true`

- [ ] **步骤 2：人工检查开启模式代码路径**

检查点：
- local 构建脚本中已注入变量
- 页面守卫不会误拦截 local 构建

- [ ] **步骤 3：最终 Commit**

```bash
git add .
git commit -m "feat: add distribution gate for card package tools"
```

## 自检

- 规格覆盖度：已覆盖环境变量、底部 Dock、`/card-manager`、`/card-editor`、`build:local` 自动开启。
- 占位符扫描：无 `TODO`、`待定`、`后续实现`、`类似任务` 等占位内容。
- 类型一致性：统一使用 `isCardManagerEnabled()` 与 `FeatureUnavailable`，未引入第二套命名。
