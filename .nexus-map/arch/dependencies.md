> generated_by: nexus-mapper v2
> verified_at: 2026-04-22
> provenance: The repository-level import graph could not be recovered from current AST output, so the diagrams below are inferred from entry files, public APIs and manual inspection of state/store wiring.

# 系统依赖

## 总览

下面的依赖图不是“源码 import 的逐条还原”，而是当前仓库里真实工作流的系统级依赖关系。它反映谁负责编排、谁提供领域能力、谁承担持久化和互操作。

```mermaid
flowchart LR
  app_shell["应用壳层与页面编排<br/>app/layout.tsx / app/page.tsx"]
  workspace["角色工作台<br/>app/page.tsx + lib/sheet-store.ts"]
  card_runtime["统一卡牌运行时<br/>card/ + card/stores/"]
  card_tools["卡包编辑与管理工具<br/>app/card-editor + app/card-manager"]
  browser_data["浏览器数据与互操作<br/>lib/storage.ts + html-* + multi-character-storage.ts"]

  app_shell --> workspace
  app_shell --> card_tools
  workspace --> card_runtime
  workspace --> browser_data
  card_tools --> card_runtime
  browser_data --> card_runtime
```

## 主站角色流

```mermaid
sequenceDiagram
  participant User as 用户
  participant Home as app/page.tsx
  participant Sheet as lib/sheet-store.ts
  participant Cards as card/index-unified.ts
  participant Data as lib/multi-character-storage.ts
  participant Export as hooks/use-export-handlers.ts

  User->>Home: 编辑角色页
  Home->>Sheet: 读写 SheetData
  Home->>Cards: 查询职业/种族/社群/领域卡
  Home->>Data: 载入或切换活动存档
  User->>Export: 触发打印 / HTML / JSON 导出
  Export->>Cards: 解析卡牌 class / ref
  Export->>Data: 读取当前角色数据
```

## 自定义卡包导入流

```mermaid
sequenceDiagram
  participant Manager as app/card-manager/page.tsx
  participant Dhcb as card/utils/dhcb-importer.ts
  participant Store as card/stores/store-actions.ts
  participant ImageDB as card/stores/image-service/database.ts

  Manager->>Dhcb: 导入 .dhcb / .zip
  Dhcb->>Dhcb: 解析 cards.json 与 images/*
  Dhcb->>Store: importCards(processedImportData)
  Store->>Store: 校验、转换、生成 batchId、写入 localStorage
  Dhcb->>Dhcb: 校验孤儿图片
  Dhcb->>ImageDB: importBatchImages(batchId, imageMap)
  ImageDB-->>Dhcb: 成功或失败
  Dhcb-->>Store: 若图片失败则 removeBatch(batchId) 回滚
  Dhcb-->>Manager: 返回批次统计与导入结果
```

## 关键依赖解释

- `应用壳层` 只负责把主题、初始化器、通知、页面框架和主流程拼起来，不负责业务规则。
- `角色工作台` 是主业务入口，但所有卡牌语义都来自 `统一卡牌运行时`，所有角色持久化与导出又依赖 `浏览器数据与互操作`。
- `卡包编辑与管理工具` 共享统一卡牌系统，而不是维护另一套卡牌模型；这保证了编辑器、管理页和主站看到的是同一批标准卡牌对象。
- `浏览器数据与互操作` 一方面服务主站，另一方面也借助卡牌系统计算导出文件名和解析卡牌引用，因此它不是完全独立的底层库。

## 依赖图的证据缺口

- 由于当前 AST 输出没有恢复出可用的内部 import 解析结果，本文件中的箭头方向来自入口文件与 API 调用关系，不代表逐条 import 明细。
- 如果后续任务需要精确到“谁 import 了谁”，请重新运行 `query_graph.py` 并结合手工阅读确认。
