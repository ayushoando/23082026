---
name: ui-redesign
description: Redesign an existing route with evidence-led visual direction, existing assets first, and tightly scoped route changes. Use when a user asks to remake, improve, or visually redesign a page.
---

# UI Redesign

Redesign the requested route without treating it as permission to change the wider product.

## Discovery

1. Read the route, its rendered view, directly imported styles, route copy/data, and the current worktree status.
2. Inspect existing local image assets before proposing generated imagery. Prefer genuine project photography when it communicates the page truthfully.
3. Establish one visual direction: hierarchy, page rhythm, photo placement, and primary action. State the exact route-owned files to be changed before editing.

## Build

- Change only the requested route and its direct data/style dependencies. Do not redesign shared chrome, adjacent routes, or unrelated assets unless the user specifically asks.
- Use semantic structure, responsive layouts, accessible image alternatives, and existing design tokens.
- Generate a new image only when the route needs a visual that is unavailable locally and the user has authorized image generation.
- Follow the active user control state. Do not start a development server, visual test, build, or screenshot workflow without current authorization.

## Handoff

State the visual direction, the exact real or generated imagery used, the files changed, and only the validation that was actually run.
