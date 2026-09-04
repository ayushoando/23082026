# Generated Documents (`generated-documents/`) Subsystem Audit

**Date:** 2026-09-04  
**Target:** [`generated-documents/`](file:///d:/23082026/generated-documents/)  
**Generator:** [`tech-docs-generator/scripts/generate-all.mjs`](file:///d:/23082026/tech-docs-generator/scripts/generate-all.mjs)  
**Lifecycle:** Ephemeral machine-generated staging output.

---

## Executive Summary

The `generated-documents/` directory is the **compiled output target** of the Tech-Docs Generator extraction pipeline. It holds serialized JSON models, Markdown document mirrors, dependency impact graphs, and interactive repository visualizations extracted from the codebase.

```
generated-documents/
├── data/                    # 28 Domain JSON Datasets (Total ~35MB)
│   ├── repo-graph.json      # 33.9 MB complete repository AST dependency graph
│   ├── commands.json        # 88 KB parsed package.json & script manifests
│   ├── dependencies.json    # 150 KB external package dependency mapping
│   ├── runner-selection.json# 294 KB test runner routing criteria
│   └── database.json, api.json, routes.json, security.json, etc.
├── docs/                    # Staged Documentation & Source Mirrors
│   ├── _sources.json        # 5.3 MB serialized source text catalog
│   ├── _manifest.json       # Parity validation manifest
│   ├── data/                # Sub-model data replicas
│   └── markdown/            # Rendered technical markdown pages
├── repository-graph/        # Graph Visualizations & Graphviz/Mermaid Artifacts
│   ├── page-components/     # page-component-graph.mmd (638 nodes / 1,492 edges)
│   ├── cycles/              # Circular dependency detection logs
│   ├── impact/              # File modification blast-radius data
│   └── stats/               # Node degree & coupling distributions
└── repository-map/          # Interactive Standalone Map
    └── index.html           # 30 KB self-contained interactive repository tree
```

---

## 1. Directory Structure & File Footprint

| Subdirectory | File Count | Primary Contents | Size / Weight | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`data/`** | 28 files | `repo-graph.json`, `api.json`, `database.json`, etc. | ~35.0 MB | Consumed by the Tech-Docs SPA during client-side hydration. |
| **`docs/`** | 4 files + 2 dirs | `_sources.json`, `_manifest.json`, `markdown/` | ~5.5 MB | Full-text search catalog and markdown parity documents. |
| **`repository-graph/`**| 4 dirs | `page-components/`, `cycles/`, `impact/` | ~1.2 MB | Mermaid diagrams and architectural coupling metrics. |
| **`repository-map/`** | 1 file | `index.html` | 30 KB | Visual D3/SVG tree of all repository source files. |

---

## 2. Key Findings & Health Assessment

1. **Massive File Weight (`repo-graph.json` - 33.9 MB):**  
   The full AST dependency extractor (`extract-repo-graph.mjs`) writes an unminified 33.9MB JSON file containing every file, import, export, and symbol in the repository.  
   *Risk:* Loading this file directly in a browser SPA crashes the V8 heap or creates severe main-thread freezing. It should be chunked or pre-filtered.
2. **The Graph Orphan Disconnect:**  
   `repository-graph/page-components/page-component-graph.mmd` is generated here, but never imported by `tech-docs-generator/src/App.tsx`.
3. **Lifecycle Contract (`filesystem.mjs`):**  
   The generation pipeline correctly begins by wiping `generated-documents/` (`cleanGeneratedRoot()`) to prevent stale artifacts from surviving previous runs.
4. **Git Hygiene:**  
   `generated-documents/` should remain gitignored or staged strictly during release builds. Committing 34MB JSON blobs into Git history inflates the `.git` packfile size.
