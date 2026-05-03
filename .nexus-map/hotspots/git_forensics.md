> generated_by: nexus-mapper v2
> verified_at: 2026-05-02
> provenance: Based on `raw/git_stats.json` plus manual complexity review. Git data is present but severely degraded because only 2 commits from 1 author were available, and generated/config files dominate the hotspot list.

# Git 热点与耦合风险

## Git 数据现状

- 分析窗口：最近 90 天
- 提交数：2
- 作者数：1
- 直接结论：这份 Git 统计只能提供极弱信号，不能代表真实长期维护热点。

## Git 统计里出现的文件

- `lib/embedded-styles.ts`
- `next.config.mjs`
- `package.json`
- `pnpm-lock.yaml`
- `scripts/extract-css.js`
- `tsconfig.json`
- 以及一批旧 `.nexus-map/*` 生成文件

这些文件更像最近两次提交改动到的配置或生成产物，而不是日常业务复杂度中心。因此，下面的热点判断继续以手工复杂度为主。

## 手工复杂度热点

| 文件 | 风险原因 |
| --- | --- |
| `app/page.tsx` | 桌面主站总编排点，页面注册、角色切换、打印、导出、卡牌同步和多种 UI 状态都在这里汇合。 |
| `components/mobile-sheet/mobile-home.tsx` | 移动端把页签、打印、导入、角色管理、卡牌同步和多种预览状态都收在一处。 |
| `lib/sheet-store.ts` | `SheetData` 的主写入口，字段多、更新动作多，任何结构变更都容易扩散。 |
| `card/stores/store-actions.ts` | 初始化、导入、批次启停、删除、图片处理、索引重建和存储同步都在一处收束。 |
| `app/card-editor/store/card-editor-store.ts` | 编辑器状态、ID 重建、图片键迁移、验证和核心包保存逻辑高度耦合。 |
| `card/stores/builtin-package-storage.ts` | 同时管理 IndexedDB、localStorage、override 迁移、清理验证和跨标签刷新信号。 |
| `lib/html-exporter.ts` | DOM 提取、样式嵌入、交互脚本注入和导出载荷构建全部集中在大文件中。 |
| `lib/multi-character-storage.ts` | 多角色迁移、活动角色、僵尸数据清理与回写策略都在这里。 |

## 风险模式

- 桌面 / 移动双入口共享底盘：`app/page.tsx` 和 `components/mobile-sheet/mobile-home.tsx` 共用 `sheet-store`、角色管理和导出 hook，改一边很容易漏回归另一边。
- `sheet-store` 与 `sheet-data` 强耦合：字段变化会同时影响默认值、迁移、校验、导入导出和页面组件；`favoriteDomainCardIds` 已经验证了这类扩散路径会真实发生。
- `store-actions` 是卡牌运行时的真正汇聚点：一旦修改导入、批次或图片逻辑，桌面主站、移动端主站、编辑器和管理页都会受影响。
- `builtin-package-storage` 跨越 IndexedDB、localStorage、浏览器事件和开发态文件写回，是一个新的脆弱互操作面。
- `html-exporter` / `html-importer` 形成一组脆弱的互操作闭环：任一侧格式变化都可能破坏 round-trip。
- `multi-character-storage` 加载即迁移并回写，意味着“读数据”本身就会产生副作用。

## 使用这份热点数据时的注意事项

- 不要把当前 `raw/git_stats.json` 的排序当成真实热点排行榜。
- 真正需要优先复核的，仍然是上面的手工复杂度热点。
- 如果后续补充了更长 Git 历史，优先重新检查：
  1. `app/page.tsx`
  2. `components/mobile-sheet/mobile-home.tsx`
  3. `lib/sheet-store.ts`
  4. `card/stores/store-actions.ts`
  5. `app/card-editor/store/card-editor-store.ts`
  6. `card/stores/builtin-package-storage.ts`
