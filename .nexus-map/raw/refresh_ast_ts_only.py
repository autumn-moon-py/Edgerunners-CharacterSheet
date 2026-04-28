import json
import sys
from pathlib import Path

SKILL_SCRIPT_DIR = Path(r"C:\Users\Administrator\.agents\skills\nexus-query\scripts")
if str(SKILL_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SKILL_SCRIPT_DIR))

from extract_ast import (
    _load_language_customizations,
    _load_languages,
    _apply_cli_customizations,
    collect_source_files,
    extract_file,
    apply_max_nodes,
)


REPO_PATH = Path(r"D:\project\web\DaggerHeart-CharacterSheet").resolve()
CONFIG_PATH = REPO_PATH / ".nexus-map" / "raw" / "ts-only-languages.json"
OUTPUT_PATH = REPO_PATH / ".nexus-map" / "raw" / "ast_nodes.json"
MAX_NODES = 5000
REQUESTED_LANGUAGES = ["javascript", "typescript", "tsx"]


def main() -> None:
    cli_ext_override, cli_query_override, cli_warnings, cli_custom_query_languages = _apply_cli_customizations(None, None)
    (
        extension_map,
        lang_queries,
        known_unsupported_extensions,
        config_warnings,
        loaded_config_paths,
        custom_query_languages,
    ) = _load_language_customizations(
        REPO_PATH,
        str(CONFIG_PATH),
        cli_ext_override,
        cli_query_override,
        cli_warnings,
        cli_custom_query_languages,
    )

    languages = _load_languages(extension_map, lang_queries, requested=REQUESTED_LANGUAGES)
    (
        source_files,
        supported_file_counts,
        known_unsupported_file_counts,
        configured_but_unavailable_file_counts,
    ) = collect_source_files(REPO_PATH, languages, extension_map, known_unsupported_extensions)

    all_nodes = []
    all_edges = []
    all_errors = []
    detected_langs = set()
    total_lines = 0
    warnings = list(config_warnings)
    module_only_file_counts = {}
    languages_with_structural_queries = sorted(
        lang for lang, query_parts in lang_queries.items() if query_parts.get("struct", "").strip()
    )

    for file_path, lang_name in source_files:
        nodes, edges, errors = extract_file(REPO_PATH, file_path, lang_name, languages[lang_name], lang_queries)
        all_nodes.extend(nodes)
        all_edges.extend(edges)
        all_errors.extend(errors)
        if lang_name not in languages_with_structural_queries:
            module_only_file_counts[lang_name] = module_only_file_counts.get(lang_name, 0) + 1
        if nodes:
            detected_langs.add(lang_name)
            total_lines += nodes[0].get("lines", 0)

    final_nodes, final_edges, truncated, truncated_count = apply_max_nodes(all_nodes, all_edges, MAX_NODES)

    if known_unsupported_file_counts:
        unsupported_summary = ", ".join(
            f"{lang} ({count} files)" for lang, count in sorted(known_unsupported_file_counts.items())
        )
        warnings.append(
            "known unsupported languages present; downstream outputs must mark inferred sections explicitly: "
            f"{unsupported_summary}"
        )

    if configured_but_unavailable_file_counts:
        unavailable_summary = ", ".join(
            f"{lang} ({count} files)" for lang, count in sorted(configured_but_unavailable_file_counts.items())
        )
        warnings.append(
            "some configured languages were detected in source files but no parser could be loaded: "
            f"{unavailable_summary}"
        )

    if module_only_file_counts:
        module_only_summary = ", ".join(
            f"{lang} ({count} files)" for lang, count in sorted(module_only_file_counts.items())
        )
        warnings.append(
            "some languages were parsed with module-only coverage because no structural query template is bundled: "
            f"{module_only_summary}"
        )

    if loaded_config_paths:
        config_summary = ", ".join(loaded_config_paths)
        warnings.append(f"custom language configuration loaded: {config_summary}")

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
            "languages_with_custom_queries": sorted(custom_query_languages.keys()),
            "module_only_file_counts": module_only_file_counts,
            "known_unsupported_file_counts": known_unsupported_file_counts,
            "configured_but_unavailable_file_counts": configured_but_unavailable_file_counts,
        },
        "nodes": final_nodes,
        "edges": final_edges,
        "errors": all_errors,
        "warnings": warnings,
    }

    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
