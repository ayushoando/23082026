# 11 · Working with Kiro

[← Quality and validation](10-quality-validation.md) · [Return to start](README.md)

## Select the session and control mode

| Situation | Choose | Example |
|---|---|---|
| Explore, diagnose, small change | Vibe | “Find why the Planner save button is disabled. Do not edit yet.” |
| Feature, migration, redesign, cross-area work | Spec | “Create requirements, design, risks, and tasks for [feature]. Do not implement until I approve.” |
| Approach only | Plan | “Plan [change]. Do not edit.” |
| Routine/safe bounded work | Autopilot | “Implement the approved task and preserve unrelated work.” |
| Sensitive/unfamiliar/high impact | Supervised | “Show each edit for approval. Do not deploy or change hosted data.” |

## Supply precise context

| Context | Example |
|---|---|
| `#File` | “`#File site/server/Planner/plannerStore.ts` explain this save path.” |
| `#Folder` | “`#Folder site/features/admin` find the catalog-management pattern.” |
| `#Problems` | “`#Problems` diagnose the current errors.” |
| `#Terminal` | “`#Terminal` explain this failure; do not run further commands.” |
| `#Git Diff` | “`#Git Diff` review data risk, security, fork boundaries, UI, and missing proof.” |
| Attachments | Attach a design/screenshot/CSV/brief and state the expected outcome. |

A strong request = **area + outcome + constraints + expected proof**.

## Prompt templates

### Small fix

```text
#File [file] #Problems #Git Diff
In Supervised mode, investigate and fix [problem]. Explain the likely cause and
files first. Reuse patterns. Do not add dependencies/config. Tell me the smallest
relevant validation before running it.
```

### Cross-area feature

```text
Create a Spec for [feature]. It affects [surfaces/DB/API/etc.]. First map all
areas, requirements, design, risks, ownership, migration/security implications,
and tasks. Do not implement until I approve.
```

### Provider/external system task

```text
Create a read-only plan for [provider task]. Identify target, data risk,
least-privilege access, fallback, rollback, and exact actions requiring approval.
Do not query or mutate the external system yet.
```

## Skill routing

Say “Use the repository skills for this task,” or name `repo-map`, `graph-impact`, `focss-css`, `fork-boundaries`, `planner-studio`, `db-migrations`, or `verify-and-gate` when the area is clear. `oando-master` routes every repository task.

## When MCP is actually appropriate

MCP is not needed for normal source, UI, database migration, test, script, docs, or local workflow work. Consider it only for a recurring approved need for live provider state or external systems, and start read-only with least privilege.

[Return to the guide index](README.md).