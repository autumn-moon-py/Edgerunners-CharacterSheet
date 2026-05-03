#!/usr/bin/env python3
"""
Run nexus-mapper AST extraction, but only load parsers for languages
that are actually present in the current repository.

This works around environments where the shared language pack is missing
some unrelated parsers referenced by the upstream languages.json.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 4:
        sys.stderr.write(
            "usage: python scripts/nexus_extract_ast_repo_languages.py <repo_path> <file_tree_out> <output_json>\n"
        )
        return 1

    repo_path = Path(sys.argv[1]).resolve()
    file_tree_out = Path(sys.argv[2]).resolve()
    output_json = Path(sys.argv[3]).resolve()

    script_path = Path(r"C:\Users\Administrator\.agents\skills\nexus-mapper\scripts\extract_ast.py")
    spec = importlib.util.spec_from_file_location("nexus_extract_ast", script_path)
    if spec is None or spec.loader is None:
        sys.stderr.write(f"[ERROR] failed to load {script_path}\n")
        return 1

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    # The shared skill script does not exclude Next.js build output by default.
    # For this repository analysis we explicitly ignore it to keep the scan
    # focused on source files and avoid timeouts on generated caches.
    module.EXCLUDE_DIRS.add(".next")
    module.EXCLUDE_DIRS.add(".next-build")
    module.EXCLUDE_DIRS.add(".worktrees")
    module.EXCLUDE_DIRS.add("output")

    if not repo_path.exists():
        sys.stderr.write(f"[ERROR] repo_path not found: {repo_path}\n")
        return 1

    module.write_filtered_file_tree(repo_path, file_tree_out)

    extension_map = dict(module.BUILTIN_EXTENSION_MAP)
    lang_queries = module._copy_lang_queries(module.BUILTIN_LANG_QUERIES)
    known_unsupported_extensions = dict(module.BUILTIN_KNOWN_UNSUPPORTED_EXTENSIONS)

    repo_languages: set[str] = set()
    known_unsupported_file_counts: dict[str, int] = {}
    for path in repo_path.rglob("*"):
        if not path.is_file() or module._should_skip_path(repo_path, path):
            continue
        suffix = path.suffix.lower()
        lang = extension_map.get(suffix)
        if lang:
            repo_languages.add(lang)
            continue
        unsupported_lang = known_unsupported_extensions.get(suffix)
        if unsupported_lang:
            known_unsupported_file_counts[unsupported_lang] = (
                known_unsupported_file_counts.get(unsupported_lang, 0) + 1
            )

    languages = module._load_languages(extension_map, lang_queries, requested=sorted(repo_languages))
    (
        source_files,
        supported_file_counts,
        _ignored_known_unsupported_counts,
        configured_but_unavailable_file_counts,
    ) = module.collect_source_files(
        repo_path,
        languages,
        extension_map,
        known_unsupported_extensions,
    )

    all_nodes: list[dict] = []
    all_edges: list[dict] = []
    all_errors: list[str] = []
    detected_langs: set[str] = set()
    total_lines = 0
    warnings: list[str] = []
    module_only_file_counts: dict[str, int] = {}
    languages_with_structural_queries = sorted(
        lang for lang, query_parts in lang_queries.items() if query_parts.get("struct", "").strip()
    )

    for file_path, lang_name in source_files:
        nodes, edges, errors = module.extract_file(
            repo_path,
            file_path,
            lang_name,
            languages[lang_name],
            lang_queries,
        )
        all_nodes.extend(nodes)
        all_edges.extend(edges)
        all_errors.extend(errors)
        if lang_name not in languages_with_structural_queries:
            module_only_file_counts[lang_name] = module_only_file_counts.get(lang_name, 0) + 1
        if nodes:
            detected_langs.add(lang_name)
            total_lines += nodes[0].get("lines", 0)

    final_nodes, final_edges, truncated, truncated_count = module.apply_max_nodes(
        all_nodes, all_edges, 500
    )

    if known_unsupported_file_counts:
        unsupported_summary = ", ".join(
            f"{lang} ({count} files)"
            for lang, count in sorted(known_unsupported_file_counts.items())
        )
        warnings.append(
            "known unsupported languages present; downstream outputs must mark inferred sections explicitly: "
            f"{unsupported_summary}"
        )

    if configured_but_unavailable_file_counts:
        unavailable_summary = ", ".join(
            f"{lang} ({count} files)"
            for lang, count in sorted(configured_but_unavailable_file_counts.items())
        )
        warnings.append(
            "some configured languages were detected in source files but no parser could be loaded: "
            f"{unavailable_summary}"
        )

    if module_only_file_counts:
        module_only_summary = ", ".join(
            f"{lang} ({count} files)"
            for lang, count in sorted(module_only_file_counts.items())
        )
        warnings.append(
            "some languages were parsed with module-only coverage because no structural query template is bundled: "
            f"{module_only_summary}"
        )

    result = {
        "languages": sorted(detected_langs),
        "stats": {
            "total_files": len(source_files),
            "total_lines": total_lines,
            "parse_errors": len(all_errors),
            "truncated": truncated,
            "truncated_nodes": truncated_count,
            "supported_file_counts": supported_file_counts,
            "languages_with_structural_queries": languages_with_structural_queries,
            "languages_with_custom_queries": [],
            "module_only_file_counts": module_only_file_counts,
            "known_unsupported_file_counts": known_unsupported_file_counts,
            "configured_but_unavailable_file_counts": configured_but_unavailable_file_counts,
            "custom_language_config_paths": [],
        },
        "nodes": final_nodes,
        "edges": final_edges,
    }

    if all_errors:
        result["_errors"] = all_errors[:20]
    if warnings:
        result["warnings"] = warnings

    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
