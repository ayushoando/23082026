# Phase 1 — Chrome

Public chrome contract: `site/features/site/data/navigation.ts`.

- Header: Products, Solutions, Clients, Planner `/planner`, About, Contact, plus **More** (Planning, Showrooms, Trusted By, Careers, After Sales, Downloads, Sustainability, FAQ). Sign in is a utility.
- FAQ is `/faq` (footer Services + More). Not a header primary. Logo is home on phone — no Home tab.
- Footer: no `/dashboard`, `/portal`, `/ooplanner`, `/admin`. Clients under Company. Planning in Services.
- Mobile: Planner tab → `/planner`. Account → `/access`. Phone bar is Get Quote + hamburger by design (`<768`). Desktop primary nav from `1280px`.

Source for this phase is already landed (`navigation.ts` re-read 2026-09-02: header, footer, mobile Planner tab still match). Browser proof is Phase 4.

Do not put calculators, compare, quote-cart, or choose-product in chrome.
