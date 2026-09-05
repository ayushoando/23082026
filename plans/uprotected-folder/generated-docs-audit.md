# Generated Documents (`generated-documents/`) Subsystem Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`generated-documents/`](file:///d:/23082026/generated-documents/)  
**Method:** Live file inspections of extraction outputs, JSON datasets, `.gitignore` rules, and pipeline cleaning routines.

---

## 1. Directory Structure & Lifecycle

`generated-documents/` is the compiled output of the Tech-Docs Generator extraction pipeline:

```
generated-documents/          ← Gitignored (.gitignore ✅)
├── data/                     ← 28 structured JSON domain datasets
│   ├── repo-graph.json              ~32.38 MB  ⚠️ Large graph dataset
│   ├── runner-selection.json         0.28 MB
│   ├── dependencies.json             0.14 MB
│   ├── commands.json                 0.08 MB
│   ├── environment.json              0.04 MB
│   ├── search-items.json             0.02 MB
│   ├── security.json                 0.02 MB
│   ├── routes.json                   0.02 MB
│   ├── deployment.json               0.02 MB
│   ├── database.json                 0.02 MB
│   ├── api.json                      0.02 MB
│   └── … 17 additional domain datasets
├── docs/                     ← Source documentation mirrors & manifests
├── repository-graph/         ← Mermaid graph diagrams & impact analyses
└── repository-map/           ← Interactive standalone DOM/graph mapping
```

---

## 2. Git Hygiene & Ephemerality

- **Gitignored:** Verified present in root [`.gitignore`](file:///d:/23082026/.gitignore) (`generated-documents/`).
- **Clean Staging:** The generation pipeline always executes `filesystem.mjs` first to purge previous build artifacts before extraction, preventing stale dataset leaks.

---

## 3. Large Dataset Handling (`repo-graph.json`)

`repo-graph.json` contains full repository AST dependency mappings and is approximately **32.38 MB** unminified:
- **Client Safety Rule:** The Tech-Docs React SPA must **never** load or parse this entire JSON file synchronously on the main thread, as doing so will trigger V8 heap thrashing or main-thread freezes.
- **Access Strategy:** Consumers should either stream the data, query subsets via Web Workers, or extract pre-filtered domain slices.

---

## 4. Verification & Generation Commands

```powershell
# 1. Regenerate all extracted documentation datasets
node tech-docs-generator/scripts/generate-all.mjs

# 2. Verify git status remains clean (generated-documents is ignored)
git status --porcelain generated-documents/
```
