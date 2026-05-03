> generated_by: nexus-mapper v2
> verified_at: 2026-05-02
> provenance: The diagrams below are inferred from entry files, store APIs and manual inspection. Current AST output preserved module structure, but `query_graph.py` still did not recover actionable internal alias-import edges for this repository, so dependency arrows below are system-level conclusions rather than import-accurate graphs.

# 系统依赖

## 总览

下面的图不是逐条 `import` 的机器还原，而是当前仓库真实业务链路的系统级依赖关系。重点在于“谁编排谁”“谁复用同一份角色数据”“谁提供共享卡牌语义”和“核心包覆盖链路插在什么位置”。

```mermaid
flowchart LR
  shell["应用壳层与入口编排<br/>app/layout.tsx"]
  desktop["桌面角色工作台<br/>app/page.tsx + lib/sheet-store.ts"]
  mobile["移动端角色工作台<br/>app/m-sheet + components/mobile-sheet/"]
  runtime["统一卡牌运行时<br/>card/ + card/stores/"]
  editor["卡包编辑器<br/>app/card-editor/"]
  manager["卡包管理页<br/>app/card-manager/page.tsx"]
  interop["存档、导出与互操作<br/>lib/multi-character-storage.ts + html-*"]
  builtin["核心包覆盖与开发态直写<br/>builtin-package-storage + dev route"]

  shell --> runtime
  shell --> desktop
  shell --> mobile
  shell --> editor
  shell --> manager
  desktop --> runtime
  desktop --> interop
  mobile --> runtime
  mobile --> interop
  runtime --> builtin
  editor --> runtime
  editor --> builtin
  manager --> runtime
  interop --> runtime
```

## 桌面角色流

```mermaid
sequenceDiagram
  participant User as 用户
  participant Home as app/page.tsx
  participant Sheet as lib/sheet-store.ts
  participant Characters as hooks/use-character-management.ts
  participant Runtime as card/index-unified.ts
  participant Interop as lib/multi-character-storage.ts
  participant Export as hooks/use-export-handlers.ts

  User->>Home: 打开主站或编辑角色
  Home->>Characters: 初始化迁移并加载活动角色
  Characters->>Interop: 读取角色列表与角色正文
  Characters-->>Home: 回填当前 SheetData
  Home->>Sheet: 通过 store 更新角色字段、卡槽和收藏状态
  Home->>Runtime: 查询标准卡牌与批次过滤结果
  User->>Export: 触发打印 / HTML / PDF 导出
  Export->>Runtime: 读取卡牌 class 和引用信息
  Export->>Interop: 使用当前角色数据生成导出载荷
```

## 移动端角色流

```mermaid
sequenceDiagram
  participant UA as MobileSheetRedirect
  participant Mobile as components/mobile-sheet/mobile-home.tsx
  participant Sheet as lib/sheet-store.ts
  participant Characters as hooks/use-character-management.ts
  participant Runtime as card/index-unified.ts
  participant Export as hooks/use-export-handlers.ts
  participant Interop as lib/multi-character-storage.ts

  UA->>Mobile: 根据 UA / 视口把首页流量导到 /m-sheet
  Mobile->>Characters: 读取活动角色并建立移动页签状态
  Characters->>Interop: 读取或迁移角色正文
  Mobile->>Sheet: 编辑角色字段、卡牌和冒险笔记
  Mobile->>Runtime: 同步卡牌快照、查询标准卡牌
  Mobile->>Export: 触发移动打印预览或 HTML 导出
  Export->>Interop: 复用同一份角色数据生成导出载荷
```

## 卡包导入流

```mermaid
sequenceDiagram
  participant Manager as app/card-manager/page.tsx
  participant Dhcb as card/utils/dhcb-importer.ts
  participant Store as card/stores/store-actions.ts
  participant ImageDB as card/stores/image-service/database.ts

  Manager->>Dhcb: 导入 .dhcb / .zip
  Dhcb->>Dhcb: 解析 cards.json 和 images/*
  Dhcb->>Store: importCards(processedImportData)
  Store->>Store: 校验、转换、建 batch、写入 localStorage
  Dhcb->>Dhcb: 校验是否存在孤儿图片
  Dhcb->>ImageDB: importBatchImages(batchId, imageMap)
  ImageDB-->>Dhcb: 成功或失败
  Dhcb-->>Store: 若图片失败则 removeBatch(batchId) 回滚
  Dhcb-->>Manager: 返回导入结果与图片数量
```

## 核心包覆盖流

```mermaid
sequenceDiagram
  participant Editor as app/card-editor/page.tsx
  participant EditorStore as app/card-editor/store/card-editor-store.ts
  participant BuiltinStore as card/stores/builtin-package-storage.ts
  participant DevRoute as app/api/dev/builtin-package/route.ts
  participant FileWriter as lib/dev-builtin-package-file.ts
  participant Runtime as card/stores/store-actions.ts

  Runtime->>BuiltinStore: loadBuiltinPackageSource()
  BuiltinStore-->>Runtime: 优先返回浏览器 override，否则回退默认 builtin-base.json
  Editor->>EditorStore: 加载或编辑核心包
  EditorStore->>DevRoute: POST /api/dev/builtin-package
  DevRoute->>DevRoute: 本地开发环境校验 + sanitizeImportData
  DevRoute->>FileWriter: 直写 data/cards/builtin-base.json
  BuiltinStore-->>Runtime: 保存 / 清理 override 后广播 storage signal
```

## 关键依赖说明

- `应用壳层` 不做业务决策，但它直接决定统一卡牌系统何时初始化、移动端何时重定向，以及 4 条主流程何时可见。
- `桌面角色工作台` 与 `移动端角色工作台` 共享同一套 `SheetData`、角色管理、导出和卡牌同步底盘，因此底层字段或导出语义变化不能只回归一个入口。
- `统一卡牌运行时` 仍是最重要的共享业务底盘，主站、移动端、编辑器和管理页都依赖它的标准卡牌与批次语义。
- `核心包覆盖与开发态直写` 是运行时和编辑器之间新增的一层互操作通道：运行时从这里读核心包来源，编辑器也通过它触发跨标签刷新和本地开发态持久化。
- `存档、导出与互操作` 不是纯底层工具库，因为导出标题、卡牌 class 和部分 HTML 互操作仍要回查统一卡牌运行时。

## 依赖图的证据缺口

- 由于当前 AST 对路径别名导入的恢复不完整，本文件里的箭头方向来自入口文件和公开 API 的真实调用关系，而不是逐条 import 清单。
- `query_graph.py --hub-analysis` 当前未恢复出可用的内部扇入/扇出结果，所以这里的系统边界主要依赖人工验证过的入口文件与 store API。
- 如果后续任务需要精确到“谁 import 了谁”，请先重跑 `query_graph.py`，再结合人工阅读确认结果是否可信。
