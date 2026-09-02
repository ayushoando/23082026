# Phase 3 — Map equals code

HTTP redirects: `config/build/next.config.js`. Map §4 must list the same destinations. Live wins; then update the map.

Known mismatch: map sends `/news`, `/brochure`, `/catalog` to `/`. Live sends news → `/about`, catalog/brochure → `/downloads`.

Calculators `/tools/*`: one story in the map, `routeClassification.ts`, robots, and sitemap. Either real NBC content and indexable, or shells and noindex. Not both.

`/compare`, `/quote-cart`, `/choose-product`, `/tools/*` stay out of chrome.

Read [`../seosec/`](../seosec/) only for missing 308s and sitemap/robots. Not a full security programme.
