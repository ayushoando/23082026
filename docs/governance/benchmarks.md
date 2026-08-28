# Benchmarks and evidence status

This reference defines adopted and repository-derived quality targets and the evidence needed to evaluate them. A target is not a pass certificate; every result remains `not-measured` until a fresh, authorized observation records the exact command or browser journey.

## Evidence states

| State | Meaning |
|---|---|
| `configured` | A source or command route exists; no result is inferred. |
| `observed` | An authorized command or journey completed and its scope, working directory, exit status, and result were recorded. |
| `not-measured` | No current observation exists. |
| `historical` | A dated observation is retained for context and does not describe current state. |
| `blocked` | A named blocker in [`Failures.md`](../../Failures.md) prevents measurement. |

## Adopted standards

| Concern | Authority | Programme target | Current status |
|---|---|---|---|
| Accessibility | [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) | Level AA for product journeys; repository-specific 44 × 44 CSS-pixel advisory for primary touch controls | not-measured |
| Field performance | [Core Web Vitals](https://web.dev/articles/vitals) | Largest Contentful Paint ≤ 2.5 s, Interaction to Next Paint ≤ 200 ms, Cumulative Layout Shift ≤ 0.1 at the 75th percentile | not-measured |
| Application security | [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) | Risk-based Level 2 target for authenticated administrative APIs | not-measured |
| Product quality vocabulary | [ISO/IEC 25010](https://www.iso.org/standard/78176.html) | Use the taxonomy to classify quality goals; no conformance claim | configured |

The repository adopts these targets within their governing scope. Static Markdown inspection does not establish accessibility, performance, security, or standards conformance.

## Repository-derived targets

| ID | Target | Value | Rationale | Evidence needed |
|---|---|---:|---|---|
| DB1 | Canvas share of workspace shell | ≥ 60% | The canvas is the primary task surface. | Authorized browser measurement at declared viewports |
| DB2 | Page-level workspace scroll | 0 | Workspace chrome must retain layout control. | Authorized browser measurement |
| DB3 | Interaction caps | 500 entities and 2,000 catalog items | Fixed caps make performance comparisons repeatable. | Named fixture and performance trace |
| DB4 | Test integrity | 0 hollow tests and 0 hidden gate skips | A green command must execute meaningful assertions. | Authorized audit output |
| DB5 | Locale key parity | 100% for configured locale files | Missing keys are broken UI, not cosmetic drift. | Authorized parity command |
| DB6 | Persistence purity | 0 production raw-disk writes and no dual write | Production filesystem is read-only. | Static source inspection plus authorized production-path tests |
| DB7 | Commercial truth | 0 invented prices | Missing prices must remain explicit in UI and exports. | Authorized BOQ and export journeys |
| DB8 | Deterministic release assets | Identical approved input produces identical release bytes | Release identity depends on reproducibility. | Authorized fixture comparison |

## Configured instruments

| Concern | Configured route | What an observed result would prove |
|---|---|---|
| Accessibility | `pnpm run test:a11y` | Only the journeys and viewports selected by that Playwright command |
| Full Vitest suite | `pnpm run test` | Both default and tech-docs lanes when both summaries complete |
| Coverage | `pnpm run test:coverage`, `pnpm run test:coverage:site`, `pnpm run test:coverage:admin` | Only the selected coverage lane and thresholds |
| API safety | `pnpm run test:audit:api-routes` | The static API audit's configured rules |
| Test integrity | `pnpm run test:audit:hollow`, `pnpm run test:audit:gate-skips` | The configured pattern checks |
| FOCSS and tokens | `pnpm run verify:focss`, `pnpm run lint:ui:strict`, `pnpm run check:style-tokens` | Static CSS structure and token rules, not rendered boxes |
| Full release | `pnpm run gate` | Only the commands included by the current root `release:gate` script |

These routes are `configured` and unrun by this documentation rewrite. Run one only with exact current-session authorization and enabled-hook permission.

## Honest reporting

- Record the exact command, arguments, repository-root working directory, exit status, scope, and redacted output summary.
- Report missing, denied, blocked, interrupted, failed, or unobserved commands as non-pass states.
- Browser evidence must name route, viewport, journey, console state, failed requests, accessibility observations, and trace identity.
- Local disk-mode evidence does not prove the hosted Supabase path.
- Historical measurements may explain a decision but never close a current target.
- Active hard blockers belong only in [`Failures.md`](../../Failures.md).
