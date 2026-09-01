# Remaining — CSS system (FOCSS)
**Date:** 2026-09-01

- 14.4 (partial): `site/focss/site/components/shared/missing-components.css` (233 lines, debt-marker name) remains a resident of the shared barrel. Header comment now describes its actual content, but the plan's rename/split-out needs a file rename or deletion — **file deletions/moves require user confirmation** (hard rule). Removing it from the barrel without relocating its consumers (`.product-gallery` etc. are used outside route bundles) risks style regressions that cannot be verified here because visual baselines must not be regenerated (policy requires review).
- 14.1 (future work, not required): per-route marketing CSS entry chains — formally declined for now; documented in `site/focss/site/components/index.css` header. Revisit only if a bundle budget flags marketing CSS weight.
