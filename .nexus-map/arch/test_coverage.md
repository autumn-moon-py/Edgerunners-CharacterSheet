> generated_by: nexus-mapper v2
> verified_at: 2026-04-22
> provenance: Static inspection only. The current snapshot no longer contains the previously observed test files or test scripts.

# 测试面

## 当前状态

- 当前仓库快照里没有 `tests/` 目录。
- 当前 `package.json` 也没有保留 `test`、`test:run`、`test:unit`、`test:integration` 之类脚本。
- 因此，这个快照不能再沿用旧的“已有若干单元测试覆盖”结论。

## 直接含义

- 现在没有可立即执行的自动化测试作为回归信号。
- 涉及 `app/page.tsx`、`lib/multi-character-storage.ts`、`card/stores/store-actions.ts`、`lib/html-exporter.ts`、`lib/html-importer.ts`、`app/card-manager/page.tsx` 的改动，建议至少补一层人工回归清单。
- 如果后续把测试体系接回仓库，这份文件需要和 `package.json`、`AGENTS.md`、`CLAUDE.md` 一起更新。

## 优先补测建议

- `sheet-store` 与 `multi-character-storage`：迁移、切换、复制角色
- `store-actions`：批次导入、图片失败回滚、批次禁用、批次删除
- `html-exporter` / `html-importer`：round-trip 兼容
- `app/card-manager/page.tsx`：多文件导入和危险操作确认

## 证据声明

- 本文件基于当前文件系统快照重新校正，不再引用已经缺失的历史测试文件。
