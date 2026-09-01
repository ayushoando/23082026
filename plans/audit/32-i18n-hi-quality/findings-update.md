# Updated findings — 32-i18n-hi-quality

**Date:** 2026-09-01

## Resolved
- Evidence collected 2026-09-01 (32 hi strings sampled vs en reference; full key-by-key read, {var} token and variant-spelling greps, aria grading): verdict — ~85% of sampled strings publishable as-is, ~10% need polish, ~5% need fixes; zero broken interpolations (8/8 `{var}` tokens preserved, grammatically natural); key parity holds; aria/form/error and planner/session strings pass; weaknesses concentrated in the `marketing.*` namespace (workspace rendered 3 ways कार्यक्षेत्र/कार्यस्थल/वर्कस्पेस — High; brand ओआंडो/ओएंडओ split — Medium; Resource Desk 2 renderings; High-severity home-hero CTA divergence from en in label and href) plus untranslated "Phone:/Email:" legal labels and MT-polish slips (gender agreement, literal idioms).

## Fixed along the way (discovered during remediation)
- none (read-only audit; no message-file edits made)

## Remaining (failures / open items)
- Glossary sweep of `marketing.*` (~20 strings): workspace → कार्यक्षेत्र; Resource Desk → संसाधन डेस्क; "Oando" → ओआंडो; analytics → एनालिटिक्स; "Selected organisations" → चयनित संगठन; pick one numeral style (2011).
- Home hero divergence (High, if unintended): align `home.hero.primaryCta`/`secondaryCta` labels + hrefs with en's `/planner` funnel; complete `home.tools.demoAriaLabel` with the "open demo / launch planner" action phrase.
- MT-polish patches: `plannerLanding.featureAiTag` → "अटकने पर पहला लेआउट।"; `home.contact.status.errorGeneric` → "अभी सबमिट नहीं हो सका।"; idiomatic rewrite of `tracking.introTitle`/`social.introTitle`; translate "Phone:/Email:" labels in `legal.imprint` and `legal.refund.contactLines`.
- Low-severity drifts (trust/featured-organisations label, analytics term, "brief", numerals) to fold into the glossary sweep.
