# 卡包编辑器直写核心包实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 让本地开发环境下的核心包编辑器在点击「保存到核心包」时，直接覆盖项目里的 `data/cards/builtin-base.json`，而不是只写浏览器 override。

**架构：** 新增一个仅开发环境可用的 API 路由负责服务端写文件，前端 `saveBuiltinPackage()` 在本地开发时优先调用该路由并在成功后刷新运行时内置卡牌；其他环境继续保留现有 override 逻辑。图片同步继续沿用现有浏览器内链路，但不尝试写回项目目录。

**技术栈：** Next.js App Router、Route Handler、Node `fs/promises`、Zustand、现有内置包清洗/刷新逻辑。

---

## 文件结构

### 创建文件

- `app/api/dev/builtin-package/route.ts`
  - 本地开发专用 API
  - 接收核心包 JSON
  - 校验开发环境
  - 清洗数据后写入 `data/cards/builtin-base.json`

- `lib/dev-builtin-package-file.ts`
  - 处理服务端文件路径解析与 JSON 写入
  - 隔离 route handler 中的文件系统细节

### 修改文件

- `app/card-editor/store/card-editor-store.ts`
  - 在 `saveBuiltinPackage()` 中增加“本地开发直写源码”分支
  - 成功后保持现有运行时刷新与 toast 行为

- `card/stores/builtin-package-storage.ts`
  - 仅在需要时导出已有清洗工具或补一个可复用服务端辅助函数
  - 保持现有 override 读取/保存行为不变

- `docs/superpowers/specs/2026-05-02-card-editor-direct-write-builtin-design.md`
  - 如果实现时发现与规格不一致，需要同步修正文档

## 任务 1：新增开发环境写文件 API

**文件：**
- 创建：`app/api/dev/builtin-package/route.ts`
- 创建：`lib/dev-builtin-package-file.ts`

- [ ] **步骤 1：实现服务端文件写入辅助工具**

在 `lib/dev-builtin-package-file.ts` 中实现：

```ts
import { promises as fs } from "node:fs"
import path from "node:path"
import type { ImportData } from "@/card/card-types"

export function getBuiltinPackageFilePath() {
  return path.join(process.cwd(), "data", "cards", "builtin-base.json")
}

export async function writeBuiltinPackageFile(data: ImportData) {
  const targetPath = getBuiltinPackageFilePath()
  const serialized = `${JSON.stringify(data, null, 2)}\n`
  await fs.writeFile(targetPath, serialized, "utf8")
  return targetPath
}
```

- [ ] **步骤 2：实现开发环境限定的 route handler**

在 `app/api/dev/builtin-package/route.ts` 中实现：

```ts
import { NextResponse } from "next/server"
import type { ImportData } from "@/card/card-types"
import { sanitizeImportData } from "@/card/package-sanitizer"
import { writeBuiltinPackageFile } from "@/lib/dev-builtin-package-file"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "仅开发环境允许直写核心包源码" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as { data?: ImportData }
    if (!body?.data) {
      return NextResponse.json({ success: false, error: "缺少核心包数据" }, { status: 400 })
    }

    const sanitized = sanitizeImportData(body.data)
    const filePath = await writeBuiltinPackageFile(sanitized)

    return NextResponse.json({ success: true, filePath })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "写入核心包源码失败" },
      { status: 500 },
    )
  }
}
```

- [ ] **步骤 3：人工验证 API 设计覆盖规格边界**

检查点：

- 只允许 `development`
- 使用 Node runtime
- 写入目标固定到 `data/cards/builtin-base.json`
- 输出 UTF-8 + 2 空格缩进 JSON

预期：代码中已经显式体现，不需要额外命令验证。

## 任务 2：在编辑器保存链路中接入开发环境直写分支

**文件：**
- 修改：`app/card-editor/store/card-editor-store.ts:740-817`

- [ ] **步骤 1：抽出开发环境检测与 API 调用辅助函数**

在 `card-editor-store.ts` 顶部附近加入：

```ts
function isLocalDevEnvironment() {
  if (typeof window === "undefined") {
    return false
  }

  const host = window.location.hostname
  return process.env.NODE_ENV === "development" && (host === "localhost" || host === "127.0.0.1")
}

async function writeBuiltinPackageToSourceFile(data: CardPackageState) {
  const response = await fetch("/api/dev/builtin-package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  })

  const payload = await response.json() as { success: boolean; error?: string }
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "直写核心包源码失败")
  }
}
```

- [ ] **步骤 2：在 `saveBuiltinPackage()` 中插入开发环境分支**

把当前：

```ts
const saveResult = await runtimeStore.replaceBuiltinCards(preparedPackage.packageData)

if (!saveResult.success) {
  throw new Error(saveResult.errors[0] || '保存核心包失败')
}
```

改成：

```ts
if (isLocalDevEnvironment()) {
  await writeBuiltinPackageToSourceFile(preparedPackage.packageData)
} else {
  const saveResult = await runtimeStore.replaceBuiltinCards(preparedPackage.packageData)

  if (!saveResult.success) {
    throw new Error(saveResult.errors[0] || '保存核心包失败')
  }
}
```

- [ ] **步骤 3：本地开发分支成功后仍触发运行时刷新**

在开发环境直写成功后，补一段显式刷新：

```ts
if (isLocalDevEnvironment()) {
  const refreshedStore = useUnifiedCardStore.getState()
  if (typeof refreshedStore.refreshBuiltinCards === "function") {
    await refreshedStore.refreshBuiltinCards()
  }
}
```

如果当前 store 暴露的刷新方法名称不同，就用实际方法名替换，但必须保证“源码写入成功后当前运行时立即同步”。

- [ ] **步骤 4：区分成功提示文案**

把：

```ts
toast.success('核心包已保存')
```

改成：

```ts
toast.success(isLocalDevEnvironment() ? '核心包已写回源码文件' : '核心包已保存')
```

## 任务 3：保持非开发环境回退行为不变

**文件：**
- 修改：`app/card-editor/store/card-editor-store.ts:744-808`
- 参考：`card/stores/builtin-package-storage.ts:203-259`

- [ ] **步骤 1：确认旧 override 路径完整保留**

检查 `saveBuiltinPackage()` 中以下逻辑仍在非开发环境分支内保留：

- `replaceBuiltinCards(...)`
- 图片同步逻辑
- `isModified` / `lastSaved` 更新
- 失败 toast

预期：开发环境只新增分支，不删除旧链路。

- [ ] **步骤 2：确保图片边界文案不误导**

把图片同步失败提示保留在旧链路和运行时链路里，但不要新增任何“图片已写入源码目录”之类文案。

预期：本期实现只承诺正文直写，不承诺图片落地源码目录。

## 任务 4：人工验证清单（不主动执行命令）

**文件：**
- 修改：无
- 测试：人工验证

- [ ] **步骤 1：验证本地开发保存会修改源码文件**

人工步骤：

1. 本地运行开发环境
2. 打开 `/card-editor`
3. 点击「加载核心包」
4. 修改一张核心包卡牌文案
5. 点击「保存到核心包」
6. 查看 `data/cards/builtin-base.json`

预期：文件内容真实变化。

- [ ] **步骤 2：验证运行时立即刷新**

人工步骤：

1. 保存成功后返回主站
2. 查看对应卡牌显示

预期：无需手工导出/替换文件，无需重新启动开发环境即可看到新内容。

- [ ] **步骤 3：验证非开发环境不走源码写入**

人工步骤：

1. 在非开发环境或模拟非开发条件下触发保存

预期：不调用开发 API，保持旧 override 行为或明确报错，不会尝试写项目文件。

## 自检

### 规格覆盖度

已覆盖：

- 本地开发专用 API
- 直写 `builtin-base.json`
- 保留旧 override 逻辑
- 图片不在本期范围
- 保存后即时刷新运行时

### 占位符扫描

本计划没有使用「TODO / 后续实现 / 待定」类占位符；每个步骤都给出了目标代码或明确的人工验证动作。

### 类型一致性

计划中使用的核心类型和方法名与现有代码保持一致：

- `CardPackageState`
- `ImportData`
- `saveBuiltinPackage()`
- `replaceBuiltinCards(...)`
- `sanitizeImportData(...)`

如果实际实现时发现运行时刷新方法名与计划假设不同，应以代码库现状为准，但必须保留“源码写入后立即刷新当前运行时”的行为目标。
