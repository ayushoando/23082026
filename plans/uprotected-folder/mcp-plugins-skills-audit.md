# MCP Servers, Plugins & Skills Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`.agents/skills/`](file:///d:/23082026/.agents/skills/)  
**Method:** Live inventory of repository skills, global plugin evaluation, and toolchain alignment.

---

## 1. Workspace Skills (4 Active Skills Confirmed)

Live inspection of [`.agents/skills/`](file:///d:/23082026/.agents/skills/) confirms four high-leverage workspace skills:

| Workspace Skill | Directory | Core Purpose & Controlling Scope |
| :--- | :--- | :--- |
| **`oando-master`** | `.agents/skills/oando-master/` | **Controlling Platform Architecture:** Enforces dual-DB rules (Admin `rxzpznmxbaoxpikowmfc` vs Products `erpweaiypimorcunaimz`), mode-aware persistence wrappers, zero manual `any`, fork boundary isolation, and authorized release gates. |
| **`safe-change`** | `.agents/skills/safe-change/` | **Preflight Safety:** Guides reversible, user-approved repository modifications with minimal diffs and blast radius checks. |
| **`recovery-audit`** | `.agents/skills/recovery-audit/` | **Tree Inspection:** Read-only inspection of recovery reports, agent artifacts, and damaged branches without modifying files. |
| **`ui-redesign`** | `.agents/skills/ui-redesign/` | **Visual Overhauls:** Scoped UI improvements adhering to FOCSS design tokens and existing repository assets. |

---

## 2. Active Global Plugins & Tools

- **`gemini-api-docs` (MCP Server):** Upstream Gemini API & SDK documentation reference.
- **`chrome-devtools-plugin`:** Browser diagnostics, accessibility (`a11y-debugging`), LCP performance optimization, and memory profiling.
- **`modern-web-guidance-plugin`:** Modern web development standards (`modern-web-guidance`, `chrome-extensions`).
- **`gemini-api`:** Multimodal and GenAI capabilities (`gemini-api-dev`, `gemini-interactions-api`, `gemini-live-api-dev`, `gemini-omni-flash-api`).

---

## 3. Toolchain Alignment Recommendations

To maximize developer ergonomics and minimize context overhead:
1. **Supabase Postgres MCP (Recommended):** Facilitates direct schema introspection and migration dry-runs across both Supabase databases.
2. **Cloudflare MCP (Recommended):** Enables live querying of R2 buckets and Vectorize index health.
3. **Workspace Skill Execution:** Always invoke `oando-master` prior to architectural changes touching persistence, database schemas, or fork boundaries.
