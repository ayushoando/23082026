# i18n Hindi (hi.json) Quality Audit

- **Scope:** `site/i18n/messages/hi.json` (1,424 lines) vs `site/i18n/messages/en.json` (reference, 1,382 lines)
- **Depth:** fast — 32 strings sampled across marketing, forms, planner/studio surfaces

## Method

1. Read both files fully; compared key-by-key (key parity holds; no missing/extra localizable keys, both have `contact.introDescription: ""`).
2. Sampled 32 hi strings: marketing chrome (`marketing.chrome.*`, `home.hero`, `home.trust`, `products.*`), forms (`home.contact.form.*`, `home.contact.status.*`, `legal.privacy.cookies.*`), planner/studio (`planner.session.*`, `planner.export.*`, `plannerLanding.*`).
3. Grepped hi.json for every `{var}` token (8 hits) and matched each against its en counterpart.
4. Grepped variant spellings of suspect terms (workspace, Resource Desk, brand "Oando", numerals) to confirm inconsistency counts.
5. Graded aria strings (`demoAriaLabel`, `channelsAriaLabel`, `listAriaLabel`, `header.*`, `quickContact.*`) for descriptive completeness.

## Findings

| Issue | Example strings (hi.json) | Severity |
|---|---|---|
| **Placeholders: all preserved** — 8/8 templated keys keep `{var}` intact and grammatically natural | `planner.export.ready` "आपकी {format} फ़ाइल तैयार है।" · `portfolio.totalTemplate` "{clients} ग्राहक - {photos} तस्वीरें" · `career.openingsAvailableTemplate` "{count} पद उपलब्ध" · `clients.showcase.emptySector` "{sector} में अभी तक…" | ✅ Pass |
| Terminology drift: en "workspace/workplace" rendered 3 ways — कार्यक्षेत्र (dominant, ~40 hits), कार्यस्थल (7 hits), वर्कस्पेस (5 hits) | `marketing.planning.heroKicker` "कार्यस्थल योजना" vs `planning.heroTitle` "योजना सेवा/कार्यक्षेत्र योजना" (line 955) vs `about.heroSubtitle` "वर्कस्पेस सिस्टम"; वर्कस्पेस/कार्यस्थल concentrated in `marketing.*` | **High** |
| Brand inconsistency: en "Oando" → two Hindi spellings | `home.title` "ओआंडो प्लेटफॉर्म" + `marketing.planning.plannerCta` "ओआंडो प्लानर" vs `home.plannerSuite.titleLead` "ओएंडओ" + `workspace.accessPanelDescription` "ओएंडओ सूट" | Medium |
| en "Resource Desk" → two renderings; same CTA appears both ways | `service.tertiaryCta` "संसाधन डेस्क खोलें" vs `marketing.service.ctaDescription` (1324), `marketing.downloads.craftAttribution` (1330), `marketing.sustainability.ctaDescription` (1383) "रिसोर्स डेस्क" | Medium |
| Home hero CTAs diverge from en in label *and* href — hi users get a different funnel | `home.hero.primaryCta` hi "उत्पाद देखें"→`/products` vs en "Get your layout plan"→`/planner`; `secondaryCta` hi "कोटेशन अनुरोध"→`/#contact` vs en "Browse products"→`/products` | **High** (if unintended) |
| Hero paraphrase swap, not translation | `solutions.heroTitleLead/Accent` en "Built for / how teams work." → hi "वर्कस्पेस / समाधान"; `products.rangeTitleLead` en "Six / ranges" → hi "आवश्यकतानुसार / ब्राउज़ करें।" | Medium |
| Gender agreement error (clipped MT style) | `plannerLanding.featureAiTag` "अटकने पर पहली लेआउट।" (लेआउट is masc. → "पहला लेआउट") | Medium |
| Literal/awkward renderings | `tracking.introTitle` "एक सच्चा मार्ग" ("truthful route"); `social.introTitle` "एक स्वच्छ सेतु" ("clean bridge"); `solutions.stats[0]` "कार्यक्षेत्र परियोजनाओं में वर्ष"; `home.contact.status.errorGeneric` "वर्तमान में सबमिट करने में असमर्थ" ("now" → अभी); `home.whyChooseUs.titleLead/Accent` "हम तैयार करते हैं / कार्यक्षेत्र" (unnatural split order) | Medium |
| Untranslated English labels inside hi legal blocks (inconsistent with ईमेल/फोन used elsewhere) | `legal.imprint.sections[2].lines` "Phone: +91…", "Email: sales@…"; `legal.refund.contactLines` "Email: / Phone: / Corporate Office:" (832–834) | Medium |
| en "Selected organisations" → two different hi terms | `home.trust.logoLabel` "प्रमुख संगठन" vs `clients.featuredLabel` "चयनित संगठन" | Low |
| Mixed analytics term | `legal.privacy.cookies.categories.analytics` "विश्लेषण और एट्रिब्यूशन" vs `marketing.chrome.cookie.*` "एनालिटिक्स" | Low |
| Mixed en "brief" | `home.contact.form.briefLabel` "विवरण" (consistent elsewhere) vs `about.processTitleLead` "योजना से" (en "Brief to…") | Low |
| Mixed numerals | `trustedBy.heroSubtitle`/`overviewKicker` "२०११ से" (Devanagari) vs `home.hero.kicker` "2011 से" (Latin) | Low |
| Aria shortened vs en (loses action context) | `home.tools.demoAriaLabel` hi "उदाहरण 10x8 मीटर कार्यालय फ़्लोर प्लान" vs en "Open interactive floor plan demo: …, launch planner"; identical to `demoCaption` | Medium |
| Aria & form strings otherwise good | `contact.channelsAriaLabel` "फोन, ईमेल और सेवा क्षेत्र" · `legal.privacy.cookies.listAriaLabel` · `marketing.chrome.header.openMenu/closeNavigation` · `quickContact.open/close` · form labels/placeholders/`consentText`/`consentHint`/`errorChannel` all natural | ✅ Pass |
| Planner/studio strings clean | `planner.session.*` (saveCloud/saveDraft/saveAsNew/open3d/importJson), `planner.export.downloaded/linkCopied`, `plannerLanding.step1–3` | ✅ Pass |

## Verdict

- **~85% of sampled strings are publishable as-is**; ~10% need polish (idiom/gender), ~5% need fixes (divergent home-hero CTAs, missing aria action context, untranslated legal labels).
- Strengths: zero broken interpolations, consistent "योजना कॉल"/"संसाधन डेस्क खोलें"/"गोपनीयता नीति" CTAs, good split-heading reordering in most heroes (`home.collections`, `home.contact`), solid form/error strings.
- Weakness: the `marketing.*` namespace reads like a separate, looser pass — nearly every inconsistency (कार्यस्थल, रिसोर्स डेस्क, एनालिटिक्स, ओआंडो/ओएंडओ) lives there.

**Top 3 fixes**
1. **Unify terminology via a glossary sweep of `marketing.*` (~20 strings):** workspace → कार्यक्षेत्र; Resource Desk → संसाधन डेस्क; "Oando" → ओआंडो; analytics → एनालिटिक्स; "Selected organisations" → चयनित संगठन; pick one numeral style (2011).
2. **Fix the home hero divergence** (`home.hero.primaryCta`/`secondaryCta` labels + hrefs) to match en's `/planner` funnel, and complete `home.tools.demoAriaLabel` with the "open demo / launch planner" action phrase.
3. **Patch the MT-polish strings:** `plannerLanding.featureAiTag` → "अटकने पर पहला लेआउट।"; `home.contact.status.errorGeneric` → "अभी सबमिट नहीं हो सका।"; `tracking.introTitle`/`social.introTitle` idiomatic rewrite; translate "Phone:/Email:" labels in `legal.imprint` and `legal.refund.contactLines`.
