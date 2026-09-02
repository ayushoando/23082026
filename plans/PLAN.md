# Client-hub plan

Spine: [`client-hub/flowcharts/clients-hub-flow.md`](./client-hub/flowcharts/clients-hub-flow.md).

This file is the sequence. Phase notes live in subfolders under `plans/`. Named packets (`ui-audit`, `seosec`, …) stay here as history and input — they are not a second spine. `planner-comprehensive-audit/` is **dated**; tests still import its TypeScript.

R2 is the image optimizer. `D:\23082026 - Copy` is reference only. Studio, Admin, APIs, worker deploy, and `CF-TOKEN-01` are out of this sequence unless a walk finds a public leak.

## Already done

Footer, mobile Planner tab, header labels. Client-hub flattened. Map §4 matches next.config. Calculator classification is noindex. Unused `Hero.tsx` removed. Do not redo.

## Sequence

| Phase | Folder | What |
|---|---|---|
| — | [`client-hub/`](./client-hub/) | Spine (map). §4 aligned to next.config 2026-09-02 |
| 1 | [`chrome/`](./chrome/) | Public header, footer, tabs |
| 2 | [`homepage/`](./homepage/) | `/` as journey start, FOCSS, leftover hero |
| 3 | [`map-equals-code/`](./map-equals-code/) | Redirects, calculator indexability |
| 4 | [`walk/`](./walk/) | Browser, desktop + phone |

Order: 1 → 2 → 3 → 4. Commit when a phase is actually done.

Work systematically. Read the packet and the live files before changing them. Do not cut a surface unread.

## Packets (read when the phase needs them)

| Packet | Use in this sequence |
|---|---|
| [`ui-audit/`](./ui-audit/) | CSS, tokens, marketing layout, a11y — **Phase 2 and 4** |
| [`seosec/`](./seosec/) | Redirects, sitemap, robots — **Phase 3** |
| [`planner-audit/`](./planner-audit/) | Only `/planner` marketing pages, not the canvas |
| [`worker-audit/`](./worker-audit/) | R2 delivery only |
| others | Open when a walk hits that surface |

## Done when

A stranger can follow the map from header, footer, and tabs. No public chrome to `/dashboard`, `/portal`, `/ooplanner`, `/admin`. Redirects and calculator indexability match the map. Homepage does not skip to the app. Marketing images are R2 / `unoptimized`. Home, products, clients, `/planner`, `/access` checked on `http://localhost:3000`, desktop and phone.
