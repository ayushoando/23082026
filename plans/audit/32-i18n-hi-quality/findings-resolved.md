# Resolved — 32-i18n-hi-quality
**Date:** 2026-09-01
- Evidence collected 2026-09-01 (32 hi strings sampled vs en reference; full key-by-key read, {var} token and variant-spelling greps, aria grading): verdict — ~85% of sampled strings publishable as-is, ~10% need polish, ~5% need fixes; zero broken interpolations (8/8 `{var}` tokens preserved, grammatically natural); key parity holds; aria/form/error and planner/session strings pass; weaknesses concentrated in the `marketing.*` namespace (workspace rendered 3 ways कार्यक्षेत्र/कार्यस्थल/वर्कस्पेस — High; brand ओआंडो/ओएंडओ split — Medium; Resource Desk 2 renderings; High-severity home-hero CTA divergence from en in label and href) plus untranslated "Phone:/Email:" legal labels and MT-polish slips (gender agreement, literal idioms).

(Fixed along the way: none — read-only audit; no message-file edits made.)
